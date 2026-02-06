import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

type SupabaseWebhookPayload = {
	type?: string;
	event?: string;
	action?: string;
	record?: any;
	user?: any;
	data?: any;
};

function splitName(fullName: string) {
	const trimmed = fullName.trim();
	if (!trimmed) {
		return { firstName: "", lastName: "" };
	}

	const parts = trimmed.split(" ");
	return {
		firstName: parts[0] || "",
		lastName: parts.slice(1).join(" ") || "",
	};
}

function getEmailVerified(record: any): boolean {
	return Boolean(record?.email_confirmed_at || record?.confirmed_at);
}

export async function POST(request: NextRequest) {
	try {
		const payload = (await request.json()) as SupabaseWebhookPayload;
		const eventType = payload.type || payload.event || payload.action;
		const record = payload.record || payload.user || payload.data?.record || payload.data;

		if (!record) {
			return NextResponse.json({ error: "Missing record" }, { status: 400 });
		}

		const supabaseId = record.id || record.user_id;
		const email = record.email;

		if (!supabaseId || !email) {
			return NextResponse.json(
				{ error: "Missing required user fields" },
				{ status: 400 }
			);
		}

		if (eventType === "USER_DELETED" || eventType === "DELETE") {
			return NextResponse.json({ ok: true });
		}

		const metadata = record.raw_user_meta_data || record.user_metadata || {};
		const username =
			metadata.username ||
			metadata.user_name ||
			metadata.name ||
			email.split("@")[0];
		const fullName =
			metadata.fullName ||
			metadata.full_name ||
			metadata.name ||
			"";
		const { firstName, lastName } = splitName(fullName);
		const emailVerified = getEmailVerified(record);

		await executeQuery(
			`INSERT INTO users (supabase_id, email, username, first_name, last_name, email_verified, role, is_banned)
			 VALUES (?, ?, ?, ?, ?, ?, 'user', false)
			 ON DUPLICATE KEY UPDATE
			 email = VALUES(email),
			 username = VALUES(username),
			 first_name = VALUES(first_name),
			 last_name = VALUES(last_name),
			 email_verified = VALUES(email_verified)`
			,
			[supabaseId, email, username, firstName, lastName, emailVerified]
		);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Supabase webhook error:", error);
		return NextResponse.json(
			{ error: "An error occurred processing the webhook" },
			{ status: 500 }
		);
	}
}
