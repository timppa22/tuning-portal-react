import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/sendVerificationEmail";
import { generateToken, setAuthCookie } from "@/lib/auth";
import { getRow } from "@/lib/db";
import {
  rateLimitByIpAndIdentifier,
  logRateLimitEvent,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Apply rate limiting (10 requests per hour per IP)
    // This prevents brute force attempts on verification tokens
    const rateLimitResult = await rateLimitByIpAndIdentifier(
      request,
      token, // Use token as identifier
      {
        limit: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        identifier: "verify-email",
        useDatabase: true, // Use database for persistence
      }
    );

    // Log rate limit event for monitoring
    await logRateLimitEvent(
      request.headers.get("x-forwarded-for") || "unknown",
      "verify-email",
      rateLimitResult.success,
      rateLimitResult.remaining
    );

    // If rate limit is exceeded, return error
    if (!rateLimitResult.success) {
      const minutes = Math.ceil(rateLimitResult.msBeforeNext / 60000);
      return NextResponse.json(
        {
          error: `Too many verification attempts. Please try again in ${minutes} minute${
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

    // Verify the token
    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Get user data for token generation
    const user = await getRow<any>(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [result.userId]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate authentication token
    const authToken = generateToken(user);

    // Create response with auth cookie
    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });

    // Set authentication cookie
    const authCookieHeader = setAuthCookie(authToken);

    // Add the cookie to the response
    response.headers.append("Set-Cookie", authCookieHeader);

    return response;
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}
