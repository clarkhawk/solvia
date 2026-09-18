/**
 * @file templates.ts
 * @description Modèles de relance rédigés à l'avance, utilisés quand aucune clé IA
 * n'est configurée. Le message reste un brouillon : l'utilisateur le relit, l'ajuste
 * et décide de l'envoi.
 *
 * Ces modèles servent aussi de référence de ton pour la génération par IA : même
 * structure, mais figée, là où l'IA adapte le texte au client et à l'historique.
 *
 * @module modules/relances/templates
 */

import type { RelanceChannel, RelanceLevel } from "@prisma/client";

export interface RelanceTemplateParams {
  channel: RelanceChannel;
  level: RelanceLevel;
  clientName: string;
  reference: string;
  amountRemaining: number;
  dueAt: Date;
  daysOverdue: number;
  currency: string;
  organizationName: string;
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function frDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

const LEVEL_TITLES: Record<RelanceLevel, string> = {
  friendly: "Rappel amical",
  reminder_1: "Relance",
  reminder_2: "Deuxième relance",
  final_notice: "Mise en demeure avant recouvrement",
};

/** Phrase de contexte adaptée au retard : avant échéance, ou X jours après. */
function situation(params: RelanceTemplateParams): string {
  const { daysOverdue, dueAt } = params;
  if (daysOverdue <= 0) return `arrive à échéance le ${frDate(dueAt)}`;
  if (daysOverdue === 1) return `est échue depuis hier (${frDate(dueAt)})`;
  return `est échue depuis ${daysOverdue} jours (échéance du ${frDate(dueAt)})`;
}

function emailTemplate(p: RelanceTemplateParams): string {
  const amount = money(p.amountRemaining, p.currency);
  const context = situation(p);
  const subject = `${LEVEL_TITLES[p.level]} — facture ${p.reference}`;

  const bodies: Record<RelanceLevel, string> = {
    friendly: `Bonjour,

Sauf erreur de notre part, la facture ${p.reference}, d'un montant restant dû de ${amount}, ${context}.

Si le règlement est déjà parti, merci de ne pas tenir compte de ce message. Dans le cas contraire, nous vous remercions de bien vouloir procéder au paiement.

Nous restons à votre disposition pour tout justificatif.

Cordialement,
${p.organizationName}`,

    reminder_1: `Bonjour,

Nous n'avons pas encore enregistré le règlement de la facture ${p.reference}, d'un montant de ${amount}, qui ${context}.

Pouvez-vous nous indiquer la date de paiement prévue ? Si une difficulté particulière retarde ce règlement, dites-le-nous : nous trouverons une solution ensemble.

Cordialement,
${p.organizationName}`,

    reminder_2: `Bonjour,

Malgré notre précédente relance, la facture ${p.reference} reste impayée pour un montant de ${amount}. Elle ${context}.

Nous vous demandons de procéder au règlement sous huit jours, ou de nous communiquer un échéancier précis.

Cordialement,
${p.organizationName}`,

    final_notice: `Bonjour,

En l'absence de règlement de la facture ${p.reference}, d'un montant de ${amount} qui ${context}, nous vous mettons en demeure de procéder au paiement sous quinze jours.

Passé ce délai, et sans réponse de votre part, nous engagerons une procédure de recouvrement, avec les frais et intérêts de retard applicables.

Nous préférons évidemment une solution amiable : contactez-nous avant cette échéance.

Cordialement,
${p.organizationName}`,
  };

  return `Objet : ${subject}\n\n${bodies[p.level]}`;
}

function whatsappTemplate(p: RelanceTemplateParams): string {
  const amount = money(p.amountRemaining, p.currency);
  const context = situation(p);

  const bodies: Record<RelanceLevel, string> = {
    friendly: `Bonjour, ici ${p.organizationName}. Petit rappel : la facture ${p.reference} (${amount}) ${context}. Si le paiement est déjà fait, merci de nous l'indiquer. Bonne journée.`,
    reminder_1: `Bonjour, ${p.organizationName}. La facture ${p.reference} (${amount}) ${context} et n'apparaît pas encore comme réglée. Pouvez-vous nous confirmer la date de paiement prévue ? Merci.`,
    reminder_2: `Bonjour, ${p.organizationName}. Deuxième relance pour la facture ${p.reference} (${amount}), ${context}. Merci de régulariser sous huit jours ou de nous proposer un échéancier.`,
    final_notice: `Bonjour, ${p.organizationName}. La facture ${p.reference} (${amount}) ${context} et reste impayée malgré nos relances. Sans règlement sous quinze jours, le dossier passera au recouvrement. Contactez-nous avant, nous préférons une solution amiable.`,
  };

  return bodies[p.level];
}

function phoneTemplate(p: RelanceTemplateParams): string {
  const amount = money(p.amountRemaining, p.currency);
  const context = situation(p);

  const openings: Record<RelanceLevel, string> = {
    friendly: "Appel de courtoisie, ton détendu.",
    reminder_1: "Relance ferme mais cordiale : obtenir une date.",
    reminder_2: "Relance appuyée : obtenir un engagement écrit.",
    final_notice: "Dernier appel avant procédure : rester factuel, sans menace.",
  };

  return `Script d'appel — ${LEVEL_TITLES[p.level]}
${openings[p.level]}

1. Se présenter : « Bonjour, [votre nom] de ${p.organizationName}. Je vous appelle au sujet d'une facture. »
2. Exposer les faits : facture ${p.reference}, montant restant dû ${amount}, qui ${context}.
3. Poser la question ouverte : « Pouvez-vous me confirmer la date à laquelle le règlement sera effectué ? »
4. Écouter la réponse et noter l'objection éventuelle (litige, trésorerie, facture non reçue).
5. Conclure sur un engagement daté et le reformuler : « Si je comprends bien, vous réglez avant le [date]. »
6. Annoncer la suite : « Je vous envoie un récapitulatif par écrit. »

À noter après l'appel : le résultat obtenu (promesse, paiement annoncé, contestation, sans réponse).`;
}

/**
 * Compose le brouillon de relance à partir des données de la facture.
 */
export function buildRelanceTemplate(params: RelanceTemplateParams): string {
  switch (params.channel) {
    case "whatsapp":
      return whatsappTemplate(params);
    case "phone":
      return phoneTemplate(params);
    case "email":
    default:
      return emailTemplate(params);
  }
}
