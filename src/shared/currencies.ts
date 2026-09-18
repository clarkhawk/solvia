/**
 * @file currencies.ts
 * @description Devises de facturation proposées à une organisation.
 * Défini hors des fichiers `route.ts`, qui n'acceptent que les exports réservés
 * de Next.js, afin d'être partagé entre l'API et l'interface.
 *
 * @module shared/currencies
 */

export const SUPPORTED_CURRENCIES = ["XOF", "XAF", "EUR", "USD", "GHS", "NGN", "MAD", "CAD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  XOF: "Franc CFA — UEMOA (F CFA)",
  XAF: "Franc CFA — CEMAC (FCFA)",
  EUR: "Euro (€)",
  USD: "Dollar américain ($)",
  GHS: "Cedi ghanéen (₵)",
  NGN: "Naira nigérian (₦)",
  MAD: "Dirham marocain",
  CAD: "Dollar canadien",
};

/**
 * Formate un montant dans la devise de l'organisation (jamais une devise en dur).
 * Utilisé partout où un montant doit être affiché en dehors de l'UI React
 * (notifications, brouillons de relance, exports…).
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Code devise invalide/inconnu d'Intl (ex. valeur corrompue en base) :
    // on ne casse jamais une alerte pour un problème de formatage.
    return `${amount.toFixed(0)} ${currency}`;
  }
}