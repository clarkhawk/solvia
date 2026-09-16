"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ScoringCriterion } from "@/modules/scoring/types";

interface ScoringConfig {
  criteria: ScoringCriterion[];
  riskThreshold: number;
}

export default function ScoringPage() {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v1/scoring")
      .then((r) => r.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  async function handleSave() {
    if (!config) return;
    await fetch("/api/v1/scoring", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <p>Chargement…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuration du scoring</h1>
      <Card>
        <CardHeader>
          <CardTitle>Critères de risque</CardTitle>
          <CardDescription>Composez votre score à partir du catalogue de métriques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.criteria.map((c, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 rounded-md border p-4">
              <input
                className="rounded border px-2 py-1"
                value={c.name}
                onChange={(e) => {
                  const criteria = [...config.criteria];
                  criteria[i] = { ...c, name: e.target.value };
                  setConfig({ ...config, criteria });
                }}
              />
              <select
                className="rounded border px-2 py-1"
                value={c.metricType}
                onChange={(e) => {
                  const criteria = [...config.criteria];
                  criteria[i] = { ...c, metricType: e.target.value as ScoringCriterion["metricType"] };
                  setConfig({ ...config, criteria });
                }}
              >
                <option value="montant_en_retard">Montant en retard</option>
                <option value="anciennete_retard">Ancienneté retard</option>
                <option value="taux_retard_historique">Taux retard historique</option>
                <option value="nombre_factures_impayees">Nb factures impayées</option>
                <option value="montant_total_exposition">Exposition totale</option>
              </select>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="rounded border px-2 py-1"
                value={c.weight}
                onChange={(e) => {
                  const criteria = [...config.criteria];
                  criteria[i] = { ...c, weight: parseFloat(e.target.value) };
                  setConfig({ ...config, criteria });
                }}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => {
                    const criteria = [...config.criteria];
                    criteria[i] = { ...c, enabled: e.target.checked };
                    setConfig({ ...config, criteria });
                  }}
                />
                Actif
              </label>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <label>
              Seuil à risque :
              <input
                type="number"
                min="0"
                max="100"
                className="ml-2 rounded border px-2 py-1 w-20"
                value={config.riskThreshold}
                onChange={(e) => setConfig({ ...config, riskThreshold: parseInt(e.target.value) })}
              />
            </label>
            <Button onClick={handleSave}>{saved ? "Enregistré ✓" : "Enregistrer"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
