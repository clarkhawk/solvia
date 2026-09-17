"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Invitation = { email: string; role: string; organizationName: string };
const roleLabels: Record<string, string> = { dirigeant: "dirigeant", comptable: "comptable", commercial: "commercial" };

/** Public entry point: creates a first administrator, or accepts a role-bound invitation. */
export default function SignUpPage() {
  const router = useRouter(); const searchParams = useSearchParams(); const token = searchParams.get("token") ?? "";
  const [step, setStep] = useState(1); const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [form, setForm] = useState({ companyName: "", currency: "EUR", email: "", password: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => { if (!token) return; void (async () => { const response = await fetch(`/api/v1/invitations/validate?token=${encodeURIComponent(token)}`); const data = await response.json().catch(() => ({})); if (!response.ok) setError(data.error ?? "Cette invitation n'est pas valide."); else { setInvitation(data); setForm((value) => ({ ...value, email: data.email })); } setLoading(false); })(); }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (step === 1 && !invitation) { if (!form.companyName.trim()) setError("Indiquez le nom de votre entreprise."); else setStep(2); return; }
    if (!form.email || form.password.length < 8) { setError("Utilisez un e-mail valide et un mot de passe d'au moins 8 caractères."); return; }
    setLoading(true);
    const endpoint = invitation ? "/api/v1/auth/accept-invitation" : "/api/v1/auth/signup";
    const body = invitation ? { token, password: form.password } : form;
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) { setError(data.error ?? "Création du compte impossible."); return; }
    router.push("/login?created=1");
  }

  const title = invitation ? `Rejoindre ${invitation.organizationName}` : "Créer votre entreprise";
  return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 py-10"><section className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"><div className="p-8"><img src="/logo.png" alt="Solvia" className="mb-8 h-10 w-auto" /><p className="text-sm font-semibold text-[#4F46E5]">{invitation ? `Invitation · ${roleLabels[invitation.role] ?? invitation.role}` : `Étape ${step} sur 2`}</p><h1 className="mt-2 text-2xl font-bold text-[#0F172A]">{title}</h1><p className="mt-2 text-sm text-[#64748B]">{invitation ? "Créez votre accès sécurisé à l'espace de votre équipe." : "Vous deviendrez l'administrateur de ce nouvel espace."}</p>{error && <p className="mt-4 rounded-xl bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">{error}</p>}
    {token && !invitation ? <p className="mt-6 text-sm text-[#64748B]">{loading ? "Vérification de l'invitation…" : "Demandez une nouvelle invitation à votre administrateur."}</p> : <form onSubmit={submit} className="mt-6 overflow-hidden"><div className="flex transition-transform duration-300" style={{ transform: `translateX(-${(step - 1) * 100}%)` }}>
      {!invitation && <div className="w-full shrink-0 space-y-4"><input required placeholder="Nom de l'entreprise" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full rounded-xl border p-3 text-sm" /><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="w-full rounded-xl border p-3 text-sm"><option value="EUR">EUR — Euro</option><option value="XOF">XOF — Franc CFA</option><option value="USD">USD — Dollar</option></select><button className="w-full rounded-xl bg-[#4F46E5] p-3 font-semibold text-white">Suivant</button></div>}
      <div className="w-full shrink-0 space-y-4"><input required type="email" readOnly={Boolean(invitation)} placeholder="Email professionnel" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border p-3 text-sm read-only:bg-slate-50" /><input required minLength={8} type="password" placeholder="Mot de passe (8 caractères minimum)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border p-3 text-sm" /><div className="flex gap-3">{!invitation && <button type="button" onClick={() => setStep(1)} className="rounded-xl border px-4 py-3 text-sm font-semibold">Retour</button>}<button disabled={loading} className="flex-1 rounded-xl bg-[#4F46E5] p-3 font-semibold text-white disabled:opacity-60">{loading ? "Création..." : invitation ? "Créer mon compte" : "Créer mon espace"}</button></div></div>
    </div></form>}</div><div className="border-t bg-[#F8FAFC] px-8 py-4 text-center text-sm text-[#64748B]">Déjà un compte ? <Link href="/login" className="font-semibold text-[#4F46E5]">Se connecter</Link></div></section></main>;
}
