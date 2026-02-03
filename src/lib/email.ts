import { Resend } from "resend";
import {
  sendVerificationEmail,
  generateVerificationToken,
  verifyEmailToken,
} from "./sendVerificationEmail";

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

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<boolean> {
  try {
    const resendInstance = getResendInstance();
    await resendInstance.emails.send({
      from: "onboarding@resend.dev", // temporary address
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Re-export auth email helpers
export {
  sendVerificationEmail,
  generateVerificationToken,
  verifyEmailToken,
};
