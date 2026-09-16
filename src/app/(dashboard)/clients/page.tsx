"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Client {
  id: string;
  externalCode: string | null;
  identity: { name: string; companyName?: string };
  contact: { email?: string; phone?: string };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("/api/v1/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.items ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clients</h1>
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Nom</th>
                <th className="pb-2">Code externe</th>
                <th className="pb-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.identity.name}</td>
                  <td className="py-2">{c.externalCode ?? "—"}</td>
                  <td className="py-2">{c.contact.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!clients.length && <p className="text-muted-foreground">Aucun client</p>}
        </CardContent>
      </Card>
    </div>
  );
}
