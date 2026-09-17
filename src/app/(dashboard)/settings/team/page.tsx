"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamUser { id: string; email: string; role: string; canReceiveAlerts: boolean; canRelanceClients: boolean; }
interface Invitation { id: string; email: string; role: string; status: string; expiresAt: string; }

const roleLabels: Record<string, string> = { dirigeant: "Dirigeant", comptable: "Comptable", commercial: "Commercial" };

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"dirigeant" | "comptable" | "commercial">("comptable");
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [teamResponse, invitationResponse] = await Promise.all([fetch("/api/v1/team"), fetch("/api/v1/invitations")]);
    if (teamResponse.ok) setUsers(await teamResponse.json());
    if (invitationResponse.ok) setInvitations(await invitationResponse.json());
  }
  useEffect(() => { void load(); }, []);

  async function createInvitation(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage(""); setInviteUrl("");
    const response = await fetch("/api/v1/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
    const data = await response.json().catch(() => ({})); setLoading(false);
    if (!response.ok) { setMessage(data.error ?? "Création de l'invitation impossible."); return; }
    setEmail(""); setInviteUrl(data.invitationUrl);
    setMessage(data.emailSent ? "Invitation envoyée par e-mail." : "Invitation créée. Copiez le lien ci-dessous pour la partager.");
    await load();
  }

  async function revoke(invitationId: string) {
    const response = await fetch(`/api/v1/invitations/${invitationId}`, { method: "DELETE" });
    if (!response.ok) { setMessage("Révocation impossible."); return; }
    await load();
  }

  async function updatePermissions(user: TeamUser) {
    const response = await fetch("/api/v1/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
    if (!response.ok) setMessage("Mise à jour des permissions impossible.");
  }

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold">Gestion de l&apos;équipe</h1><p className="mt-1 text-sm text-muted-foreground">Invitez les membres de votre entreprise et gérez leurs droits.</p></div>
    <Card><CardHeader><CardTitle>Inviter un membre</CardTitle><CardDescription>Les comptes dirigeant, comptable et commercial sont créés uniquement depuis une invitation.</CardDescription></CardHeader><CardContent>
      <form onSubmit={createInvitation} className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@entreprise.com" className="rounded-md border px-3 py-2 text-sm" /><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="rounded-md border px-3 py-2 text-sm"><option value="dirigeant">Dirigeant</option><option value="comptable">Comptable</option><option value="commercial">Commercial</option></select><Button disabled={loading}>{loading ? "Création..." : "Envoyer l'invitation"}</Button></form>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      {inviteUrl && <div className="mt-3 rounded-md bg-muted p-3"><p className="mb-1 text-xs font-medium">Lien d&apos;invitation (affiché une seule fois)</p><input readOnly value={inviteUrl} className="w-full bg-transparent text-xs" onFocus={(event) => event.currentTarget.select()} /></div>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Invitations</CardTitle><CardDescription>Les liens expirent après 7 jours et ne peuvent être utilisés qu&apos;une fois.</CardDescription></CardHeader><CardContent className="space-y-3">{invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"><div><p className="font-medium">{invitation.email}</p><p className="text-muted-foreground">{roleLabels[invitation.role] ?? invitation.role} · {invitation.status} · expire le {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}</p></div>{invitation.status === "pending" && <Button variant="outline" size="sm" onClick={() => void revoke(invitation.id)}>Révoquer</Button>}</div>)}{!invitations.length && <p className="text-sm text-muted-foreground">Aucune invitation envoyée.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Permissions alertes & relances</CardTitle><CardDescription>Réservé aux administrateurs</CardDescription></CardHeader><CardContent className="space-y-4">{users.map((user, index) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4"><div><p className="font-medium">{user.email}</p><p className="text-sm text-muted-foreground capitalize">{user.role}</p></div><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={user.canReceiveAlerts} onChange={(event) => { const next = [...users]; next[index] = { ...user, canReceiveAlerts: event.target.checked }; setUsers(next); }} />Alertes</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={user.canRelanceClients} onChange={(event) => { const next = [...users]; next[index] = { ...user, canRelanceClients: event.target.checked }; setUsers(next); }} />Relances</label><Button size="sm" onClick={() => void updatePermissions(users[index])}>Sauver</Button></div></div>)}{!users.length && <p className="text-muted-foreground">Aucun utilisateur</p>}</CardContent></Card>
  </div>;
}
