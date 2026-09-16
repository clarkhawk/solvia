"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";

interface DashboardData {
  counts: {
    upcoming: number;
    overdue: number;
    paid: number;
    partiallyPaid: number;
  };
  dueSoon: Array<{
    id: string;
    reference: string;
    amountRemaining: number;
    dueAt: string;
    status: string;
  }>;
}

interface AtRiskClient {
  clientId: string;
  result: { score: number; isAtRisk: boolean };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskClient[]>([]);

  useEffect(() => {
    fetch("/api/v1/invoices/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);

    fetch("/api/v1/scoring/clients")
      .then((r) => r.json())
      .then((results: AtRiskClient[]) => setAtRisk(results.filter((r) => r.result.isAtRisk).slice(0, 5)))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble des échéances et impayés</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>À venir</CardDescription>
            <CardTitle className="text-3xl">{data?.counts.upcoming ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En retard</CardDescription>
            <CardTitle className="text-3xl text-red-600">{data?.counts.overdue ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partiellement payées</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{data?.counts.partiallyPaid ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payées</CardDescription>
            <CardTitle className="text-3xl text-green-600">{data?.counts.paid ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochaines échéances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.dueSoon ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{inv.reference}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inv.dueAt).toLocaleDateString("fr-FR")} — {inv.amountRemaining.toFixed(2)} EUR
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
              {!data?.dueSoon?.length && <p className="text-sm text-muted-foreground">Aucune échéance à venir</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients à risque</CardTitle>
            <CardDescription>Score ≥ seuil configuré</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRisk.map((c) => (
                <div key={c.clientId} className="flex items-center justify-between rounded-md border p-3">
                  <p className="font-mono text-sm">{c.clientId.slice(0, 8)}…</p>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    Score {c.result.score}
                  </span>
                </div>
              ))}
              {!atRisk.length && <p className="text-sm text-muted-foreground">Aucun client à risque</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
