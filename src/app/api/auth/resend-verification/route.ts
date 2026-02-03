import { NextRequest, NextResponse } from "next/server";
import { executeQuery, getRow } from "@/lib/db";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/sendVerificationEmail";
import {
  rateLimitByIpAndIdentifier,
  logRateLimitEvent,
} from "@/lib/rate-limit";

interface ResendVerificationRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResendVerificationRequest = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Apply rate limiting (3 requests per 30 minutes per email and IP)
    const rateLimitResult = await rateLimitByIpAndIdentifier(request, email, {
      limit: 3,
      windowMs: 30 * 60 * 1000, // 30 minutes
      identifier: "resend-verification",
      useDatabase: true, // Use database for persistence
    });

    // Log rate limit event for monitoring
    await logRateLimitEvent(
      request.headers.get("x-forwarded-for") || "unknown",
      "resend-verification",
      rateLimitResult.success,
      rateLimitResult.remaining
    );

    // If rate limit is exceeded, return error
    if (!rateLimitResult.success) {
      const minutes = Math.ceil(rateLimitResult.msBeforeNext / 60000);
      return NextResponse.json(
        {
          error: `Too many verification email requests. Please try again in ${minutes} minute${
            minutes === 1 ? "" : "s"
          }.`,
          retryAfter: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              rateLimitResult.msBeforeNext / 1000
            ).toString(),
          },
        }
      );
    }

    // Find user in database
    const user = await getRow<{ id: number; email_verified: boolean }>(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await executeQuery(
      "DELETE FROM email_verification_tokens WHERE user_id = ?",
      [user.id]
    );

    // Generate new verification token and send verification email
    const verificationToken = await generateVerificationToken(user.id);

    // Add exponential backoff for failed email attempts
    let retries = 0;
    const maxRetries = 3;
    let emailSent = false;

    while (!emailSent && retries < maxRetries) {
      try {
        emailSent = await sendVerificationEmail(email, verificationToken);
        if (emailSent) break;
      } catch (error) {
        console.error(`Email sending attempt ${retries + 1} failed:`, error);
      }

      retries++;
      if (retries < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retries - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while resending verification email" },
      { status: 500 }
    );
  }
}
