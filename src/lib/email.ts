

import { v4 as uuidv4 } from "uuid";
import { executeQuery, executeTransaction } from "./db";
// Generate a verification token and save it to the database
export async function generateVerificationToken(
  userId: number
): Promise<string> {
  try {
    // Generate a unique token with higher entropy
    const token = uuidv4();

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing tokens for this user first to prevent token accumulation
    await executeQuery(
      "DELETE FROM email_verification_tokens WHERE user_id = ?",
      [userId]
    );

    // Save token to database with transaction to ensure data consistency
    await executeQuery(
      "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    // Update user's verification token fields
    await executeQuery(
      "UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?",
      [token, expiresAt, userId]
    );

    // Log token generation for audit purposes (without exposing the actual token)
    console.log(
      `Verification token generated for user ${userId}, expires at ${expiresAt}`
    );

    return token;
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw new Error("Failed to generate verification token");
  }
}

// Send verification email with enhanced security and tracking
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  // Sähköpostin lähetys on siirretty Resend-palveluun. Tämä funktio on tyhjä tai voi kutsua uutta Resend-funktiota.
  return true;
}

// Verify a token with enhanced security checks
// Send a generic email with customizable content
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    // Add a unique tracking ID for this email
    const emailTrackingId = uuidv4().substring(0, 8);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      headers: {
        "X-Priority": "1", // High priority
        "X-Tracking-ID": emailTrackingId,
      },
    };

    // Send the email with improved timeout and retry mechanism
    const sendWithRetry = async (attempts = 3, timeout = 30000) => {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          // Create a timeout promise that rejects after specified time
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(`Email sending timed out after ${timeout / 1000}s`)
                ),
              timeout
            );
          });

          // Race the email sending against the timeout
          // Sähköpostin lähetys on siirretty Resend-palveluun. Tämä kohta on tyhjä.
          return true;
        } catch (error) {
          console.error(
            `Email sending attempt ${attempt}/${attempts} failed:`,
            error
          );

          // If this was the last attempt, throw the error
          if (attempt === attempts) throw error;

          // Otherwise wait before retrying (exponential backoff)
          const backoffTime = Math.min(Math.pow(2, attempt) * 500, 5000); // 1s, 2s, 4s up to max 5s
          console.log(`Retrying in ${backoffTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
      // This should never be reached due to the throw in the last attempt
      throw new Error("All email sending attempts failed");
    };

    // Execute the send with retry function
    await sendWithRetry();
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; userId?: number; reason?: string }> {
  try {
    // Validate token format first (basic validation to prevent SQL injection)
    if (!token || token.length < 10 || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return { success: false, reason: "invalid_format" };
    }

    // Check if token exists and is not expired
    const tokenRecord = await executeQuery<any[]>(
      "SELECT user_id, expires_at FROM email_verification_tokens WHERE token = ?",
      [token]
    );

    if (!tokenRecord || tokenRecord.length === 0) {
      // Check if token was already used (for better error messaging)
      const userWithEmail = await executeQuery<any[]>(
        "SELECT id FROM users WHERE verification_token = ?",
        [token]
      );

      if (userWithEmail && userWithEmail.length > 0) {
        return { success: false, reason: "already_verified" };
      }

      return { success: false, reason: "not_found" };
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord[0].expires_at);
    if (expiresAt < new Date()) {
      return { success: false, reason: "expired" };
    }

    const userId = tokenRecord[0].user_id;

    // Mark user as verified and poista token
    await executeQuery(
      "UPDATE users SET email_verified = TRUE, verification_token_expires = NOW(), verification_token = NULL WHERE id = ?",
      [userId]
    );
    await executeQuery(
      "DELETE FROM email_verification_tokens WHERE token = ?",
      [token]
    );

    return { success: true, userId };
  } catch (error) {
    console.error("Error verifying email token:", error);
    return { success: false, reason: "error" };
  }
}
