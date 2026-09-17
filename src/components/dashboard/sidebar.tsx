"use client";

/**
 * @file sidebar.tsx
 * @description Barre de navigation latérale (Sidebar) pour Solvia SaaS.
 * Conçue selon la Maquette 1 : fond épuré, navigation structurée par catégories,
 * icônes Lucide SVG exclusives (zéro emoji), pastille active Indigo et boutons accessibles.
 *
 * @module components/dashboard/sidebar
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import {
  LayoutDashboard,
  FileText,
  Users,
  Send,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  Bot,
  LogOut,
  Shield,
  HelpCircle,
} from "lucide-react";

/**
 * Structure d'un élément de navigation.
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

/**
 * Groupes de navigation métier.
 */
const mainNav: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/invoices", label: "Factures & Impayés", icon: FileText },
  { href: "/clients", label: "Clients & Débiteurs", icon: Users },
  { href: "/relances", label: "Plans de Relance", icon: Send },
  { href: "/import", label: "Importer CSV / Excel", icon: FileSpreadsheet, badge: "Nouveau" },
];

const settingsNav: NavItem[] = [
  { href: "/scoring", label: "Scoring de Risque", icon: Sliders },
  { href: "/settings/team", label: "Équipe & Permissions", icon: ShieldCheck },
  { href: "/settings/ai-provider", label: "Moteur IA (BYOK)", icon: Bot },
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
    <aside className="flex h-screen w-64 flex-col border-r border-[#E2E8F0] bg-white">
      {/* En-tête avec Logo Solvia */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[#E2E8F0] px-6">
        <img src="/logo.png" alt="Solviaa" className="h-8 w-auto object-contain" />
      </div>

      {/* Navigation principale */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        {/* Section Gestion */}
        <div className="mb-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Gestion
          </p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-[#4F46E5]" : "text-[#94A3B8]")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#4F46E5]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section Configuration */}
        <div className="mb-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Configuration
          </p>
          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[#4F46E5]" : "text-[#94A3B8]")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bloc d'aide & support */}
        <div className="mt-auto rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
          <div className="flex items-center gap-2 text-[#0F172A] font-semibold mb-1">
            <HelpCircle className="h-4 w-4 text-[#4F46E5]" />
            <span>Support & Documentation</span>
          </div>
          <p className="text-[11px] text-[#64748B] mb-3">
            Besoin d&apos;aide pour configurer vos relances automatiques ?
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] font-semibold text-[#4F46E5] hover:underline"
          >
            Consulter les guides &rarr;
          </a>
        </div>
      </div>

      {/* Pied de sidebar */}
      <div className="border-t border-[#E2E8F0] p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-[#64748B] transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
