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
