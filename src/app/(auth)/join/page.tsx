"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinOrganizationPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch("/api/v1/join-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationName }) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) { setMessage(data.error ?? "Demande impossible."); return; }
    if (data.status === "member") { router.push("/"); return; }
    setMessage("Demande envoyée. Vous recevrez l'accès après validation par l'administrateur.");
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-[#0F172A]">Rejoindre une entreprise</h1><p className="mt-2 text-sm text-[#64748B]">Votre identité est vérifiée. Indiquez maintenant l&apos;entreprise que vous souhaitez rejoindre.</p><label className="mt-6 block text-sm font-medium">Nom de l&apos;entreprise<input required value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="Ex. Yas" /></label><button disabled={loading} className="mt-5 w-full rounded-xl bg-[#4F46E5] p-3 font-semibold text-white disabled:opacity-60">{loading ? "Envoi..." : "Envoyer ma demande"}</button>{message && <p className="mt-4 text-sm text-[#64748B]">{message}</p>}</form></main>;
}
