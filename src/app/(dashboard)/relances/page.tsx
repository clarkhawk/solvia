"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Relance {
  id: string;
  channel: string;
  level: string;
  result: string;
  messageDraft: string | null;
  createdAt: string;
}

export default function RelancesPage() {
  const [relances, setRelances] = useState<Relance[]>([]);

  useEffect(() => {
    fetch("/api/v1/relances")
      .then((r) => r.json())
      .then((d) => setRelances(d.items ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relances</h1>
      <Card>
        <CardHeader>
          <CardTitle>Historique des relances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {relances.map((r) => (
            <div key={r.id} className="rounded-md border p-4">
              <div className="mb-2 flex gap-2">
                <Badge variant="outline">{r.channel}</Badge>
                <Badge variant="secondary">{r.level}</Badge>
                <Badge>{r.result}</Badge>
              </div>
              {r.messageDraft && <p className="text-sm whitespace-pre-wrap">{r.messageDraft}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
          {!relances.length && <p className="text-muted-foreground">Aucune relance enregistrée</p>}
        </CardContent>
      </Card>
    </div>
  );
}
