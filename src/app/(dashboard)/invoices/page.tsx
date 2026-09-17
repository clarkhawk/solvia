"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { InvoiceDTO } from "@/modules/factures/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);

  useEffect(() => {
    fetch("/api/v1/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.items ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Factures</h1>
      <Card className="rounded-2xl border-[#E2E8F0] shadow-sm">
        <CardHeader>
          <CardTitle>Toutes les factures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Reste dû</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-semibold text-[#0F172A]">{inv.reference}</td>
                    <td className="px-4 py-3">{Number(inv.amount).toFixed(2)} €</td>
                    <td className="px-4 py-3">{Number(inv.amountRemaining).toFixed(2)} €</td>
                    <td className="px-4 py-3">{new Date(inv.dueAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center rounded-xl bg-white border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-sm"
                      >
                        Voir détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!invoices.length && <p className="text-muted-foreground p-4 text-center">Aucune facture</p>}
        </CardContent>
      </Card>
    </div>
  );
}
