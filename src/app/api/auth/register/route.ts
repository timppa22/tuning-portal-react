import { NextRequest, NextResponse } from "next/server";
import { executeQuery, executeTransaction } from "@/lib/db";
import { hash } from "bcrypt";
import {
  generateToken,
  setAuthCookie,
} from "@/lib/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/sendVerificationEmail";
import {
  rateLimitByIpAndIdentifier,
  logRateLimitEvent,
} from "@/lib/rate-limit";

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
}

export async function POST(request: NextRequest) {
  // Get client IP and user agent for logging
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();

  // Initialize variables at the top level to ensure they're in scope for error handling
  let username: string = "";
  let email: string = "";
  let userId: number;
  let verificationToken: string;
  let user: User;

  try {
    // Apply rate limiting to prevent registration abuse
    const rateLimitResult = await rateLimitByIpAndIdentifier(
      request,
      "registration",
      {
        limit: 5, // 5 registration attempts
        windowMs: 60 * 60 * 1000, // per hour
        identifier: "register",
        useDatabase: true, // More persistent across server restarts
      }
    );

    // Log rate limit event
    await logRateLimitEvent(
      ip,
      "registration",
      rateLimitResult.success,
      rateLimitResult.remaining
    );

    // If rate limit exceeded, return error
    if (!rateLimitResult.success) {
      console.warn(`Registration rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body: RegisterRequest = await request.json();
    // Assign to our top-level variables
    username = body.username;
    email = body.email;
    const { password, fullName } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await executeQuery<any[]>(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Log registration attempt (without sensitive data)
    console.log(
      `Registration attempt: username=${username}, email=${email}, ip=${ip}, userAgent=${userAgent}, timestamp=${timestamp}`
    );

    // Variables already declared at the top level

    // Use transaction to ensure all operations succeed or fail together
    try {
      // Insert user first to get the ID
      await executeQuery(
        "INSERT INTO users (username, email, password, full_name, email_verified, registration_ip, last_login_ip, registration_date, user_agent) VALUES (?, ?, ?, ?, FALSE, ?, ?, NOW(), ?)",
        [
          username,
          email,
          hashedPassword,
          fullName || null,
          ip,
          ip,
          userAgent,
        ]
      );

      // Get the inserted user ID using LAST_INSERT_ID()
      const idResult = await executeQuery<any>("SELECT LAST_INSERT_ID() as id");
      userId = idResult[0]?.id;

      if (!userId) {
        throw new Error("Failed to create user");
      }

      // Generate verification token
      verificationToken = generateVerificationToken(userId);

      // Insert verification token
      await executeQuery(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))",
        [userId, verificationToken]
      );

      // Send verification email with retry mechanism
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

      // If email fails after all retries, throw error to trigger transaction rollback
      if (!emailSent) {
        throw new Error(`Failed to send verification email to: ${email}`);
      }

      // Create user object for token generation
      user = {
        id: userId,
        username,
        email,
        role: "user",
      };

      // Generate JWT token
      const token = generateToken(user);

      // Set auth cookie with the token
      const authCookieHeader = setAuthCookie(token);

      // Log registration with geolocation tracking
      const { logRegistration } = await import("@/lib/securityMiddleware");
      await logRegistration(userId, request);

      // Return success response with verification token
      const response = NextResponse.json(
        {
          success: true,
          user,
          emailVerificationSent: emailSent,
          verificationToken: verificationToken, // Include the token for the verification modal
        },
        { status: 201 }
      );

      // Add the auth cookie to the response
      response.headers.append("Set-Cookie", authCookieHeader);

      return response;
    } catch (error) {
      // Log detailed error information
      console.error("Registration error:", {
        error: error instanceof Error ? error.message : String(error),
        username,
        email,
        ip,
        userAgent,
        timestamp,
      });

      // Return appropriate error message based on error type
      if (
        error instanceof Error &&
        error.message.includes("verification email")
      ) {
        return NextResponse.json(
          {
            error: "Unable to send verification email. Please try again later.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error:
            "An error occurred during registration. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log detailed error information
    console.error("Registration error:", {
      error: error instanceof Error ? error.message : String(error),
      username,
      email,
      ip,
      userAgent,
      timestamp,
    });

    return NextResponse.json(
      {
        error: "An error occurred during registration. Please try again later.",
      },
      { status: 500 }
    );
  }
}
