import type { GenerateMessageParams } from "./types";

const LEVEL_LABELS: Record<string, string> = {
  friendly: "rappel amical",
  reminder_1: "première relance",
  reminder_2: "deuxième relance",
  final_notice: "dernier rappel avant contentieux",
};

const CHANNEL_HINTS: Record<string, string> = {
  email: "Format email professionnel avec objet suggéré.",
  whatsapp: "Message court et direct, adapté à WhatsApp.",
  phone: "Script téléphonique avec points clés à aborder.",
};

export function buildPrompt(params: GenerateMessageParams): string {
  const level = LEVEL_LABELS[params.level] ?? params.level;
  const channel = CHANNEL_HINTS[params.channel] ?? "";

  return `Tu es un assistant de recouvrement pour une PME française.
Rédige un message de ${level} pour le client "${params.client.displayName}".
Facture : ${params.invoice.reference}, montant ${params.invoice.amount.toFixed(2)} EUR, échéance ${params.invoice.dueAt.toISOString().split("T")[0]}.
${params.invoice.daysOverdue > 0 ? `Retard : ${params.invoice.daysOverdue} jours.` : "Échéance à venir."}
Canal : ${params.channel}. ${channel}
Ton : professionnel, courtois mais ferme. En français. Ne mentionne jamais de données bancaires.`;
}
