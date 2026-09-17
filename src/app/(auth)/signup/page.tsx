"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", email: "", password: "", currency: "EUR" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/v1/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) { setError(data.error ?? "Inscription impossible."); return; }
    router.push("/login");
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm"><img src="/logo.png" alt="Solvia" className="mb-8 h-10 w-auto" /><h1 className="text-2xl font-bold text-[#0F172A]">Créer votre espace Solvia</h1><p className="mt-2 text-sm text-[#64748B]">Configurez votre entreprise et votre compte administrateur.</p>{error && <p className="mt-4 rounded-xl bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">{error}</p>}<div className="mt-6 space-y-4"><input required placeholder="Nom de l'entreprise" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full rounded-xl border p-3 text-sm" /><input required type="email" placeholder="Email professionnel" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border p-3 text-sm" /><input required minLength={8} type="password" placeholder="Mot de passe (8 caractères minimum)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border p-3 text-sm" /><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-xl border p-3 text-sm"><option value="EUR">EUR — Euro</option><option value="XOF">XOF — Franc CFA</option><option value="USD">USD — Dollar</option></select><button disabled={loading} className="w-full rounded-xl bg-[#4F46E5] p-3 font-semibold text-white disabled:opacity-60">{loading ? "Création..." : "Créer mon espace"}</button></div><p className="mt-6 text-center text-sm text-[#64748B]">Déjà un compte ? <Link href="/login" className="font-semibold text-[#4F46E5]">Se connecter</Link></p></form></main>;
}
