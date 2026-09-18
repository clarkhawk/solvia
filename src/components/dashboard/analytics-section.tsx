"use client";

/**
 * @file analytics-section.tsx
 * @description Bloc statistique du tableau de bord : balance âgée, efficacité des
 * relances, encaissements des six derniers mois et principaux débiteurs.
 *
 * Aucune bibliothèque de graphiques : barres en CSS et courbe en SVG, avec les
 * composants et la palette existants (Maquette 1).
 *
 * @module components/dashboard/analytics-section
 */

import { useEffect, useState } from "react";
import { BarChart3, Clock4, Loader2, TrendingUp, Users } from "lucide-react";

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

interface RelanceOutcome {
  result: string;
  label: string;
  count: number;
}

interface MonthlyCollection {
  month: string;
  label: string;
  amount: number;
}

interface TopDebtor {
  clientId: string;
  name: string;
  outstanding: number;
  invoiceCount: number;
  oldestDays: number;
}

interface Analytics {
  currency: string;
  aging: AgingBucket[];
  relanceOutcomes: RelanceOutcome[];
  monthlyCollections: MonthlyCollection[];
  topDebtors: TopDebtor[];
  totals: {
    outstanding: number;
    overdue: number;
    relances: number;
    recoveryRate: number;
  };
}

/** Montant lisible : « 285,3 M F CFA » plutôt que « 285 250 000,00 ». */
function formatCompact(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatFull(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const AGING_COLORS = ["#818CF8", "#4F46E5", "#F59E0B", "#FB7185", "#EF4444"];

const OUTCOME_COLORS: Record<string, string> = {
  payment_received: "#10B981",
  payment_promise: "#4F46E5",
  response_received: "#818CF8",
  to_follow_up: "#F59E0B",
  no_response: "#94A3B8",
};

export function DashboardAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/v1/invoices/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (mounted && json) setData(json);
      })
      .catch((error) => console.error("Statistiques indisponibles :", error))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white p-10 text-xs text-[#64748B] shadow-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Calcul des statistiques…
      </div>
    );
  }

  if (!data) return null;

  const agingMax = Math.max(...data.aging.map((b) => b.amount), 1);
  const outcomeMax = Math.max(...data.relanceOutcomes.map((o) => o.count), 1);
  const collectionMax = Math.max(...data.monthlyCollections.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance âgée */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Balance âgée</h3>
              <p className="text-xs text-[#64748B]">Encours réparti par ancienneté du retard</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Clock4 className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            {data.aging.map((bucket, index) => (
              <div key={bucket.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-[#0F172A]">{bucket.label}</span>
                  <span className="text-xs text-[#64748B]">
                    <span className="font-bold text-[#0F172A]">
                      {formatCompact(bucket.amount, data.currency)}
                    </span>
                    {" · "}
                    {bucket.count} facture{bucket.count > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, (bucket.amount / agingMax) * 100)}%`,
                      backgroundColor: AGING_COLORS[index],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
            Total dû :{" "}
            <span className="font-bold text-[#0F172A]">
              {formatFull(data.totals.outstanding, data.currency)}
            </span>
            {data.totals.overdue > 0 && (
              <>
                {" · dont "}
                <span className="font-bold text-[#EF4444]">
                  {formatFull(data.totals.overdue, data.currency)}
                </span>{" "}
                en retard
              </>
            )}
          </p>
        </div>

        {/* Efficacité des relances */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Efficacité des relances</h3>
              <p className="text-xs text-[#64748B]">
                {data.totals.relances} relance{data.totals.relances > 1 ? "s" : ""} enregistrée
                {data.totals.relances > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#10B981]">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>

          {data.relanceOutcomes.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#64748B]">
              Aucune relance enregistrée pour le moment.
            </p>
          ) : (
            <>
              <div className="space-y-3.5">
                {data.relanceOutcomes.map((outcome) => (
                  <div key={outcome.result}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-semibold text-[#0F172A]">{outcome.label}</span>
                      <span className="text-xs font-bold text-[#0F172A]">{outcome.count}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(2, (outcome.count / outcomeMax) * 100)}%`,
                          backgroundColor: OUTCOME_COLORS[outcome.result] ?? "#4F46E5",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                <span className="text-xs text-[#64748B]">Relances suivies d&apos;un effet</span>
                <span className="text-2xl font-bold tracking-tight text-[#10B981]">
                  {data.totals.recoveryRate}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Encaissements mensuels */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Encaissements</h3>
              <p className="text-xs text-[#64748B]">Six derniers mois</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="flex h-44 items-end justify-between gap-3">
            {data.monthlyCollections.map((month) => (
              <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-[#0F172A]">
                  {month.amount > 0 ? formatCompact(month.amount, data.currency) : "—"}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-[#4F46E5] transition-all"
                    style={{
                      height: `${Math.max(3, (month.amount / collectionMax) * 100)}%`,
                      opacity: month.amount > 0 ? 1 : 0.15,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#64748B]">{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Principaux débiteurs */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Principaux débiteurs</h3>
              <p className="text-xs text-[#64748B]">Les cinq plus gros encours</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#EF4444]">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2.5">
            {data.topDebtors.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#64748B]">Aucun encours ouvert.</p>
            ) : (
              data.topDebtors.map((debtor, index) => (
                <div
                  key={debtor.clientId}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-[#4F46E5]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{debtor.name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {debtor.invoiceCount} facture{debtor.invoiceCount > 1 ? "s" : ""}
                        {debtor.oldestDays > 0 && ` · ${debtor.oldestDays} j de retard`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {formatFull(debtor.outstanding, data.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
