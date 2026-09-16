"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamUser {
  id: string;
  email: string;
  role: string;
  canReceiveAlerts: boolean;
  canRelanceClients: boolean;
}

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);

  useEffect(() => {
    fetch("/api/v1/team")
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  async function updatePermissions(user: TeamUser) {
    await fetch("/api/v1/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        canReceiveAlerts: user.canReceiveAlerts,
        canRelanceClients: user.canRelanceClients,
      }),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestion de l&apos;équipe</h1>
      <Card>
        <CardHeader>
          <CardTitle>Permissions alertes & relances</CardTitle>
          <CardDescription>Réservé aux administrateurs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user, i) => (
            <div key={user.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={user.canReceiveAlerts}
                    onChange={(e) => {
                      const updated = [...users];
                      updated[i] = { ...user, canReceiveAlerts: e.target.checked };
                      setUsers(updated);
                    }}
                  />
                  Alertes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={user.canRelanceClients}
                    onChange={(e) => {
                      const updated = [...users];
                      updated[i] = { ...user, canRelanceClients: e.target.checked };
                      setUsers(updated);
                    }}
                  />
                  Relances
                </label>
                <Button size="sm" onClick={() => updatePermissions(users[i])}>
                  Sauver
                </Button>
              </div>
            </div>
          ))}
          {!users.length && <p className="text-muted-foreground">Aucun utilisateur</p>}
        </CardContent>
      </Card>
    </div>
  );
}
