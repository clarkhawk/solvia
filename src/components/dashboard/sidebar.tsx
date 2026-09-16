"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Factures" },
  { href: "/relances", label: "Relances" },
  { href: "/scoring", label: "Scoring" },
  { href: "/settings/team", label: "Équipe" },
  { href: "/settings/ai-provider", label: "IA (BYOK)" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-slate-950 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-xl font-bold tracking-tight">Solvia</h1>
        <p className="text-xs text-slate-400">Recouvrement PME</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-800",
              pathname === link.href && "bg-slate-800 font-medium",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
