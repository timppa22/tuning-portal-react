export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { executeQuery, executeTransaction } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

interface PurchaseRequest {
  amount: number;
  paymentMethodId: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });

    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: PurchaseRequest = await request.json();
    const { amount, paymentMethodId } = body;

    if (!amount || amount <= 0 || !paymentMethodId) {
      return NextResponse.json(
        { error: "Invalid purchase request" },
        { status: 400 }
      );
    }

    const priceInCents = amount * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInCents,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        user_id: user.id.toString(),
        credit_amount: amount.toString(),
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment failed" },
        { status: 400 }
      );
    }

    await executeTransaction("START TRANSACTION");

    try {
      await executeQuery(
        "INSERT INTO credit_transactions (user_id, amount, transaction_type, stripe_payment_id) VALUES (?, ?, ?, ?)",
        [user.id, amount, "purchase", paymentIntent.id]
      );

      await executeQuery(
        "INSERT INTO user_credits (user_id, credits) VALUES (?, ?) ON DUPLICATE KEY UPDATE credits = credits + VALUES(credits)",
        [user.id, amount]
      );

      await executeTransaction("COMMIT");

      return NextResponse.json({
        success: true,
        credits: amount,
        message: "Credits purchased successfully",
      });
    } catch (dbError) {
      await executeTransaction("ROLLBACK");
      throw dbError;
    }
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
