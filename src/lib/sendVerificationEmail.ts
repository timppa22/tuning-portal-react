
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerificationToken(userId: number): string {
  // You can customize token generation logic as needed
  // Here we use uuidv4 for a random token
  return uuidv4();
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `https://cartuner.se/auth/verify-email?token=${token}`;
  try {
    await resend.emails.send({
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
