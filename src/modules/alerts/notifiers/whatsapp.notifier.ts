import twilio from "twilio";
import { decryptPii } from "@/shared/crypto/encryption";
import type { AlertNotificationPayload } from "../types";

export class WhatsAppNotifier {
  async send(whatsappNumberEncrypted: Uint8Array, payload: AlertNotificationPayload): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      console.warn("[WhatsAppNotifier] Twilio not configured, skipping WhatsApp notification");
      return;
    }

    const toNumber = decryptPii(whatsappNumberEncrypted);
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      from,
      to: toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`,
      body: `[Solvia] ${payload.title}\n${payload.message}`,
    });
  }
}
