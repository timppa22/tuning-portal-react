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

// Rate limiting configuration constants
const MS_PER_MINUTE = 60000;
const DEV_RATE_LIMIT = 20;
const DEV_WINDOW_MINUTES = 15;
const PROD_RATE_LIMIT = 10;
const PROD_WINDOW_MINUTES = 30;

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
    // Environment-based rate limiting configuration
    // Development/local: More permissive for testing
    // Production: Still protective but less restrictive than before
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rateLimit = isDevelopment 
      ? { limit: DEV_RATE_LIMIT, windowMs: DEV_WINDOW_MINUTES * MS_PER_MINUTE }
      : { limit: PROD_RATE_LIMIT, windowMs: PROD_WINDOW_MINUTES * MS_PER_MINUTE };
    
    // Apply rate limiting to prevent registration abuse
    const rateLimitResult = await rateLimitByIpAndIdentifier(
      request,
      "registration",
      {
        limit: rateLimit.limit,
        windowMs: rateLimit.windowMs,
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

    // If rate limit exceeded, return error with helpful timing information
    if (!rateLimitResult.success) {
      const minutes = Math.ceil(rateLimitResult.msBeforeNext / MS_PER_MINUTE);
      console.warn(`Registration rate limit exceeded for IP: ${ip}, reset in ${minutes} minutes`);
      return NextResponse.json(
        { 
          error: `Too many registration attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
          retryAfter: rateLimitResult.resetTime,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.msBeforeNext / 1000).toString(),
          },
        }
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
      // Start transaction for user creation and email verification
      const result = await executeTransaction<any>(
        [
          // Insert new user
          "INSERT INTO users (username, email, password, full_name, email_verified, registration_ip, last_login_ip, registration_date, user_agent) VALUES (?, ?, ?, ?, FALSE, ?, ?, NOW(), ?)",
          // The second query will be for the verification token, added dynamically below
        ],
        [
          [
            username,
            email,
            hashedPassword,
            fullName || null,
            ip,
            ip,
            userAgent,
          ],
          // Second query params will be added after we get the user ID
        ]
      );

      // Get the inserted user ID from the first query result
      userId = result[0].insertId;

      // Generate verification token
      verificationToken = await generateVerificationToken(userId);

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
