"use client";

/**
 * @file page.tsx
 * @description Paramètres de l'entreprise : raison sociale et devise de facturation.
 * La devise choisie s'applique à l'affichage de tous les montants ; elle ne convertit
 * aucun montant déjà enregistré.
 *
 * @module app/(dashboard)/settings/organization
 */

import { useEffect, useState } from "react";
import { Building2, Check, Loader2 } from "lucide-react";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from "@/shared/currencies";

interface Organization {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  riskThreshold: number;
}

const CURRENCIES = SUPPORTED_CURRENCIES.map((code) => ({ code, label: CURRENCY_LABELS[code] }));

const SAMPLE_AMOUNT = 1_250_000;

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/organization")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Organization | null) => {
        if (!data) return;
        setOrganization(data);
        setName(data.name);
        setCurrency(data.currency);
      })
      .catch(() => setError("Impossible de charger les paramètres de l'entreprise."));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Enregistrement impossible.");
      }
      setOrganization(await response.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const preview = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(SAMPLE_AMOUNT);

  const dirty = organization !== null && (name !== organization.name || currency !== organization.currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Entreprise &amp; devise</h1>
        <p className="text-xs text-[#64748B]">
          Raison sociale et devise utilisées dans les factures, les relances et le tableau de bord
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Identité et facturation</h2>
            <p className="text-xs text-[#64748B]">Visible par toute votre équipe</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="org-name" className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
              Raison sociale
            </label>
            <input
              id="org-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#4F46E5]"
              placeholder="Nom de votre entreprise"
            />
            <p className="mt-1.5 text-[11px] text-[#64748B]">
              Ce nom signe les messages de relance envoyés à vos clients.
            </p>
          </div>

          <div>
            <label htmlFor="org-currency" className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
              Devise de facturation
            </label>
            <select
              id="org-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#4F46E5]"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.label}
                </option>
              ))}
            </select>

            <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3">
              <p className="text-[11px] text-[#64748B]">Aperçu d&apos;un montant</p>
              <p className="text-xl font-bold tracking-tight text-[#0F172A]">{preview}</p>
            </div>

            <p className="mt-2 text-[11px] text-[#64748B]">
              Le changement de devise modifie l&apos;affichage, pas les montants enregistrés :
              aucune conversion n&apos;est appliquée aux factures existantes.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#991B1B]">{error}</p>
          )}

          <div className="flex items-center gap-3 border-t border-[#E2E8F0] pt-5">
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving || name.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>Enregistrer</span>
            </button>

            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
                <Check className="h-3.5 w-3.5" />
                Enregistré
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
