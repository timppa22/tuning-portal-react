import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runQuery } from "@/lib/db";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Insert into custom DB
    if (data.user) {
      const supabaseId = data.user.id;
      const firstName = fullName.split(" ")[0] || "";
      const lastName = fullName.split(" ").slice(1).join(" ") || "";

      await executeQuery(
        `INSERT INTO users (supabase_id, email, username, first_name, last_name, email_verified, role, is_banned)
         VALUES (?, ?, ?, ?, ?, ?, 'user', false)
         ON DUPLICATE KEY UPDATE
         username = VALUES(username), first_name = VALUES(first_name), last_name = VALUES(last_name)`,
        [supabaseId, email, username, firstName, lastName, false]
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
