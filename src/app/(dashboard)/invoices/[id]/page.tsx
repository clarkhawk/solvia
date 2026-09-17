"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Send } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import type { InvoiceDTO } from "@/modules/factures/types";
import type { ClientDTO } from "@/modules/clients/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [riskScore, setRiskScore] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);

  const [relanceChannel, setRelanceChannel] = useState("whatsapp");
  const [relanceLevel, setRelanceLevel] = useState("aimable");
  const [messageDraft, setMessageDraft] = useState(
    "Bonjour,\n\nSauf erreur ou omission de notre part, il semblerait que la facture reste à ce jour impayée. Nous vous saurions gré de bien vouloir procéder à son règlement dans les meilleurs délais.\n\nCordialement."
  );

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const invRes = await fetch(`/api/v1/invoices/${id}`);
        const invData = await invRes.json();
        setInvoice(invData);

        if (invData?.clientId) {
          const [clientRes, scoringRes] = await Promise.all([
            fetch(`/api/v1/clients/${invData.clientId}`),
            fetch("/api/v1/scoring/clients")
          ]);
          
          if (clientRes.ok) {
            setClient(await clientRes.json());
          }
          
          if (scoringRes.ok) {
            const scoringData = await scoringRes.json();
            const scoreEntry = scoringData.find((s: { clientId: string, result: { score: number } }) => s.clientId === invData.clientId);
            if (scoreEntry) {
              setRiskScore(scoreEntry.result.score);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="text-sm text-[#64748B] p-6">Chargement des détails...</div>;
  }

  if (!invoice) {
    return <div className="text-sm text-[#EF4444] p-6">Facture introuvable.</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1280px] mx-auto">
      
      {/* LEFT PANEL - 65% */}
      <div className="w-full lg:w-[65%] space-y-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-6 mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A] mb-2">
                Détail de Facture
              </h2>
              <p className="text-sm font-mono text-[#64748B]">{invoice.reference}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Client</p>
                <p className="text-sm font-bold text-[#0F172A]">{client?.identity.name ?? "Inconnu"}</p>
                <p className="text-xs text-[#64748B] mt-1">{client?.contact.email ?? "—"}</p>
                <p className="text-xs text-[#64748B]">{client?.contact.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Émission</p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {new Date(invoice.issuedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Échéance</p>
                <p className="text-sm font-medium text-[#0F172A]">
                  {new Date(invoice.dueAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-right">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Montant Total</p>
                <p className="text-2xl font-bold text-[#0F172A] mb-4">
                  {invoice.amount.toFixed(2)} €
                </p>
                
                <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Montant Payé</span>
                    <span className="font-semibold text-[#10B981]">{invoice.amountPaid.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Reste Dû</span>
                    <span className="font-bold text-[#EF4444]">{invoice.amountRemaining.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex justify-between items-center">
                <p className="text-xs font-semibold text-[#0F172A]">Scoring IA Client</p>
                <RiskBadge score={riskScore} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Historique de Paiements</h3>
          {invoice.amountPaid > 0 ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs text-[#64748B] italic">Historique des paiements alloués apparaîtra ici.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-xs text-[#94A3B8]">
              Aucun paiement enregistré pour cette facture.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - 35% */}
      <div className="w-full lg:w-[35%]">
        <div className="sticky top-24 rounded-2xl border border-[#1E1B4B]/10 bg-[#1E1B4B] p-6 shadow-md text-white">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="rounded-md bg-white/10 p-1.5"><Send className="h-4 w-4" /></span>
            Relance Composer
          </h3>

          <div className="space-y-6">
            {/* Canaux */}
            <div>
              <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 block">Canal d&apos;envoi</label>
              <div className="flex gap-2">
                {[
                  { id: "whatsapp", label: "WhatsApp", activeClass: "bg-[#10B981] text-white border-[#10B981]" },
                  { id: "email", label: "Email", activeClass: "bg-[#4F46E5] text-white border-[#4F46E5]" },
                  { id: "phone", label: "Téléphone", activeClass: "bg-[#0F172A] text-white border-[#0F172A]" }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setRelanceChannel(c.id)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      relanceChannel === c.id ? c.activeClass : "border-white/20 bg-white/5 text-[#CBD5E1] hover:bg-white/10"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau */}
            <div>
              <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 block">Ton de la relance</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "aimable", label: "Aimable" },
                  { id: "rappel_1", label: "Rappel 1" },
                  { id: "rappel_2", label: "Rappel 2" },
                  { id: "mise_en_demeure", label: "Mise en demeure" }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setRelanceLevel(l.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      relanceLevel === l.id ? "border-white bg-white text-[#1E1B4B]" : "border-white/20 bg-transparent text-[#94A3B8] hover:border-white/50 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">Message (Draft)</label>
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#818CF8] hover:text-white transition-colors">
                  <Bot className="h-3 w-3" /> Générer IA
                </button>
              </div>
              <textarea
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                className="w-full h-40 rounded-xl border border-white/20 bg-white/5 p-3 text-xs text-white placeholder-white/30 focus:border-[#818CF8] focus:bg-white/10 focus:outline-none transition-all resize-none"
                placeholder="Rédigez votre message ici..."
              />
            </div>

            <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#4338CA]">
              Envoyer la relance
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
