import type { AlertNotificationPayload } from "../types";

export class EmailNotifier {
  async send(to: string, payload: AlertNotificationPayload): Promise<void> {
    const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
    const from = process.env.EMAIL_FROM ?? "alerts@solvia.app";

    if (!apiKey) {
      console.warn("[EmailNotifier] EMAIL_PROVIDER_API_KEY not set, skipping email to", to);
      return;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[Solvia] ${payload.title}`,
        text: payload.message,
      }),
    });
  }
}
