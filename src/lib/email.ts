import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
	try {
		await resend.emails.send({
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
