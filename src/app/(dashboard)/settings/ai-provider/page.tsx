"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProviderId = "openai" | "gemini" | "anthropic" | "grok";

const providers: Array<{ id: ProviderId; name: string; product: string; description: string; keyUrl: string; mark: string; markClass: string }> = [
  { id: "openai", name: "OpenAI", product: "GPT-4o mini", description: "Rapide et fiable pour vos relances.", keyUrl: "https://platform.openai.com/api-keys", mark: "◌", markClass: "bg-[#101010] text-white" },
  { id: "gemini", name: "Google Gemini", product: "Gemini 2.5 Flash", description: "Le modèle Google, rapide et polyvalent.", keyUrl: "https://aistudio.google.com/app/apikey", mark: "✦", markClass: "bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#34A853] text-white" },
  { id: "anthropic", name: "Anthropic", product: "Claude Haiku", description: "Un style soigné pour les échanges clients.", keyUrl: "https://console.anthropic.com/settings/keys", mark: "AI", markClass: "bg-[#D97757] text-white" },
  { id: "grok", name: "xAI", product: "Grok", description: "Le modèle conversationnel de xAI.", keyUrl: "https://console.x.ai/", mark: "𝕏", markClass: "bg-[#111827] text-white" },
];

export default function AIProviderSettingsPage() {
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [configuredProvider, setConfiguredProvider] = useState<ProviderId | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/v1/ai/config").then((response) => response.ok ? response.json() : null).then((data) => { if (data?.provider && providers.some((item) => item.id === data.provider)) { setProvider(data.provider); setConfiguredProvider(data.hasApiKey ? data.provider : null); } }).catch(() => setError("Impossible de charger la configuration IA.")); }, []);
  const selected = useMemo(() => providers.find((item) => item.id === provider)!, [provider]);
  const hasKeyForSelection = configuredProvider === provider;

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    const response = await fetch("/api/v1/ai/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey }) });
    const data = await response.json().catch(() => ({})); setSaving(false);
    if (!response.ok) { setError(data.error ?? "La clé n'a pas pu être validée."); return; }
    setConfiguredProvider(provider); setSaved(true); setApiKey(""); setTimeout(() => setSaved(false), 2500);
  }

  return <div className="mx-auto max-w-5xl space-y-7"><div><div className="flex items-center gap-2 text-sm font-semibold text-[#4F46E5]"><Sparkles className="h-4 w-4" /> Intelligence artificielle</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A]">Configurez votre assistant IA</h1><p className="mt-2 text-sm text-[#64748B]">Choisissez votre fournisseur et utilisez votre propre clé API. Elle est chiffrée et isolée par entreprise.</p></div>
    <Card className="border-[#E2E8F0] shadow-sm"><CardHeader><CardTitle>Choisir un fournisseur</CardTitle><CardDescription>Sélectionnez le modèle qui rédigera les brouillons de relance.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{providers.map((item) => { const active = item.id === provider; const configured = item.id === configuredProvider; return <button key={item.id} type="button" onClick={() => { setProvider(item.id); setSaved(false); setError(""); }} className={`relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${active ? "border-[#4F46E5] bg-[#EEF2FF] ring-1 ring-[#4F46E5]" : "border-[#E2E8F0] bg-white hover:border-[#A5B4FC] hover:bg-[#F8FAFC]"}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${item.markClass}`}>{item.mark}</span><span className="min-w-0"><span className="flex items-center gap-2 font-semibold text-[#0F172A]">{item.name}{configured && <Check className="h-4 w-4 text-[#10B981]" />}</span><span className="mt-0.5 block text-xs font-medium text-[#4F46E5]">{item.product}</span><span className="mt-1 block text-xs text-[#64748B]">{item.description}</span></span>{active && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />}</button>; })}</div></CardContent></Card>
    <Card className="border-[#E2E8F0] shadow-sm"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-[#4F46E5]" /> Clé API {selected.name}</CardTitle><CardDescription className="mt-1">{hasKeyForSelection ? "Une clé est déjà configurée. Saisissez-en une nouvelle seulement pour la remplacer." : `Aucune clé ${selected.name} n'est encore configurée.`}</CardDescription></div>{hasKeyForSelection && <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#059669]"><Check className="h-3.5 w-3.5" /> Configurée</span>}</div></CardHeader><CardContent className="max-w-xl space-y-4">{!hasKeyForSelection && <a href={selected.keyUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] p-4 text-sm text-[#312E81] transition hover:bg-[#E0E7FF]"><span><span className="block font-semibold">Vous n&apos;avez pas encore de clé ?</span><span className="mt-0.5 block text-xs text-[#5B5FC7]">Créer une clé sur {selected.name}, puis revenez ici.</span></span><ExternalLink className="h-4 w-4 shrink-0" /></a>}<label className="block text-sm font-semibold text-[#0F172A]">Clé API<input type="password" autoComplete="off" placeholder={hasKeyForSelection ? "Nouvelle clé API (facultatif)" : "Collez votre clé API"} className="mt-2 w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>{error && <p className="rounded-xl bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}<Button onClick={() => void handleSave()} disabled={!apiKey || saving}>{saving ? "Validation de la clé..." : saved ? "Clé enregistrée ✓" : hasKeyForSelection ? "Remplacer la clé" : "Valider et enregistrer"}</Button><p className="flex items-center gap-1.5 text-xs text-[#64748B]"><ShieldCheck className="h-4 w-4 text-[#10B981]" /> La clé est validée avant enregistrement, puis chiffrée.</p></CardContent></Card>
  </div>;
}
