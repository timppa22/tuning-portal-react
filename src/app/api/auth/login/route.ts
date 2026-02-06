import { NextRequest, NextResponse } from "next/server";
import { getRow } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import {
  generateToken,
  setAuthCookie,
} from "@/lib/auth";
import { logAuthSuccess, logAuthFailure } from "@/lib/securityMiddleware";

interface LoginRequest {
  identifier: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  email_verified: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { identifier, password } = body;

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    // Find user in database with ban information
    const user = await getRow<User>(
      `SELECT u.*, u.is_banned, u.ban_reason, u.ban_expires_at
       FROM users u
       WHERE u.email = ? OR u.username = ?`,
      [identifier, identifier]
    );

    if (!user) {
      // Log failed login attempt
      await logAuthFailure(identifier, request, "User not found");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error || !data.user) {
      // Log failed login attempt due to invalid password
      await logAuthFailure(identifier, request, "Invalid password");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if email is verified in Supabase
    if (!data.user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          emailVerificationRequired: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Check if user is banned
    if (user.is_banned) {
      // Check if ban has expired
      const banExpired =
        user.ban_expires_at && new Date(user.ban_expires_at) < new Date();

      if (!banExpired) {
        return NextResponse.json(
          {
            error: `Your account has been banned. Reason: ${
              user.ban_reason || "Violation of terms of service"
            }`,
            isBanned: true,
            banReason: user.ban_reason,
            banExpiresAt: user.ban_expires_at,
          },
          { status: 403 }
        );
      }
      // If ban has expired, continue with login process
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set auth cookie with the token
    const authCookieHeader = setAuthCookie(token);

    // Log successful login with geolocation tracking
    await logAuthSuccess(user.id, request);

    // Return success response with user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    // Add ban information to the response
    const userResponse = {
      ...userWithoutPassword,
      isBanned: user.is_banned || false,
      banReason: user.ban_reason || null,
      banExpiresAt: user.ban_expires_at || null,
    };

    const response = NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 200 }
    );

    // Add the auth cookie to the response
    response.headers.append("Set-Cookie", authCookieHeader);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again later." },
      { status: 500 }
    );
  }
}
