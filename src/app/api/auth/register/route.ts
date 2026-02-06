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
  try {
    const body = await request.json();
    const { email, password, username, fullName } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, fullName },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailVerificationSent: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "An error occurred during registration. Please try again later.",
      },
      { status: 500 }
    );
  }
}
