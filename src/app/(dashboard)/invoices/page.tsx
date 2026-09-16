"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";

interface Invoice {
  id: string;
  reference: string;
  amount: number;
  amountRemaining: number;
  dueAt: string;
  status: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch("/api/v1/invoices")
      .then((r) => r.json())
      .then((d) => setInvoices(d.items ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Factures</h1>
      <Card>
        <CardHeader>
          <CardTitle>Toutes les factures</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Référence</th>
                <th className="pb-2">Montant</th>
                <th className="pb-2">Reste dû</th>
                <th className="pb-2">Échéance</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2">{inv.reference}</td>
                  <td className="py-2">{inv.amount.toFixed(2)} EUR</td>
                  <td className="py-2">{inv.amountRemaining.toFixed(2)} EUR</td>
                  <td className="py-2">{new Date(inv.dueAt).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!invoices.length && <p className="text-muted-foreground">Aucune facture</p>}
        </CardContent>
      </Card>
    </div>
  );
}
