
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { getRow } from "./db";

let resend: Resend | null = null;

function getResendInstance(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export function generateVerificationToken(userId: number): string {
  // You can customize token generation logic as needed
  // Here we use uuidv4 for a random token
  return uuidv4();
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/auth/verify?token=${token}`;
  try {
    const resendInstance = getResendInstance();
    await resendInstance.emails.send({
      from: "onboarding@resend.dev", // väliaikainen osoite
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to activate your account:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: number }> {
  try {
    // Query the email_verification_tokens table for the token
    const verificationToken = await getRow<any>(
      "SELECT user_id, expires_at FROM email_verification_tokens WHERE token = ?",
      [token]
    );

    if (!verificationToken) {
      return { success: false };
    }

    // Check if the token has expired
    const now = new Date();
    const expiresAt = new Date(verificationToken.expires_at);

    if (now > expiresAt) {
      return { success: false };
    }

    return { success: true, userId: verificationToken.user_id };
  } catch (error) {
    console.error("Error verifying email token:", error);
    return { success: false };
  }
}
