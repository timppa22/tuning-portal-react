import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const verifyUrl = `https://cartuner.se/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "noreply@cartuner.se",
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to activate your account:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });
}
