import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import Stripe from "stripe";

// Initialize Stripe with the secret key
let stripe: Stripe | null = null;
let webhookSecret: string | undefined;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  } else {
    console.warn("STRIPE_SECRET_KEY not configured - Stripe webhooks will not function");
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Get the signature from the headers
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Get the raw body
    const body = await request.text();

    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`
        );

        // Process the successful payment
        // Check if this payment has already been processed
        try {
          const [existingTransaction] = await executeQuery<any>(
            "SELECT id FROM credit_transactions WHERE stripe_payment_id = ?",
            [paymentIntent.id]
          );

          // If transaction exists, payment was already processed
          if (existingTransaction) {
            console.log(
              `Payment ${paymentIntent.id} already processed, skipping`
            );
            break;
          }

          // Get the metadata to determine the user and amount
          const userId = paymentIntent.metadata?.user_id;
          const creditAmount = paymentIntent.metadata?.credit_amount;

          if (userId && creditAmount) {
            // Add credits to user's account as a backup to the purchase API
            await executeQuery(
              "INSERT INTO credit_transactions (user_id, amount, transaction_type, stripe_payment_id) VALUES (?, ?, ?, ?)",
              [userId, creditAmount, "purchase", paymentIntent.id]
            );

            // Update user's credit balance
            // First check if the user already has a credit entry
            const [existingCredit] = await executeQuery<any>(
              "SELECT id FROM user_credits WHERE user_id = ?",
              [userId]
            );

            if (existingCredit) {
              // Update existing credit record
              await executeQuery(
                "UPDATE user_credits SET credits = credits + ? WHERE user_id = ?",
                [creditAmount, userId]
              );
            } else {
              // Create new credit record
              await executeQuery(
                "INSERT INTO user_credits (user_id, credits) VALUES (?, ?)",
                [userId, creditAmount]
              );
            }

            console.log(
              `Added ${creditAmount} credits to user ${userId} via webhook`
            );
          } else {
            console.log("Missing user_id or credit_amount in payment metadata");
          }
        } catch (error) {
          console.error("Error processing payment webhook:", error);
        }
        break;

      case "charge.succeeded":
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge for ${charge.amount} was successful!`);
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(
          `Payment failed: ${failedPaymentIntent.last_payment_error?.message}`
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "An error occurred processing the webhook" },
      { status: 500 }
    );
  }
}
