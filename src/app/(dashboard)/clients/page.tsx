"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import type { ClientDTO } from "@/modules/clients/types";
import type { Invoice } from "@prisma/client";
import type { ScoringResult } from "@/modules/scoring/types";

interface EnrichedClient extends ClientDTO {
  invoiceCount: number;
  totalAmountDue: number;
  riskScore: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsRes, invoicesRes, scoresRes] = await Promise.all([
          fetch("/api/v1/clients"),
          fetch("/api/v1/invoices"),
          fetch("/api/v1/scoring/clients"),
        ]);

        const clientsData = await clientsRes.json();
        const invoicesData = await invoicesRes.json();
        const scoresData = await scoresRes.json();

        const enriched = (clientsData.items ?? []).map((client: ClientDTO) => {
          const clientInvoices = (invoicesData.items ?? []).filter(
            (inv: { clientId: string }) => inv.clientId === client.id
          );
          
          const totalAmountDue = clientInvoices.reduce(
            (sum: number, inv: { amountRemaining: number | string }) => sum + Number(inv.amountRemaining),
            0
          );
          
          const scoreEntry = scoresData.find((s: { clientId: string }) => s.clientId === client.id);
          const riskScore = scoreEntry ? scoreEntry.result.score : 0;

          return {
            ...client,
            invoiceCount: clientInvoices.length,
            totalAmountDue,
            riskScore,
          };
        });

        setClients(enriched);
      } catch (err) {
        console.error("Failed to load clients data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Clients & Débiteurs</h1>
          <p className="text-xs text-[#64748B]">Gérez votre base client et surveillez les risques</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA]">
          <Plus className="h-4 w-4" />
          <span>Ajouter un client</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Rechercher un client, email ou code..."
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-9 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/10 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="px-6 py-4">Nom / Contact</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Factures</th>
                <th className="px-6 py-4">Montant Dû</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-[#94A3B8]">
                    Chargement des clients...
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#0F172A]">{c.identity.name}</p>
                      <p className="text-[11px] text-[#64748B]">{c.contact.email || c.contact.phone || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#64748B]">
                      {c.externalCode ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-bold text-[#4F46E5]">
                        {c.invoiceCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0F172A]">
                      {c.totalAmountDue.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge score={c.riskScore} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/clients/${c.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs text-[#94A3B8]">
                    Aucun client enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
