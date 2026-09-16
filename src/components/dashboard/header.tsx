"use client";

/**
 * @file header.tsx
 * @description Barre de navigation supérieure (Header) pour le tableau de bord Solvia.
 * Affiche l'organisation courante, la barre de recherche globale, la date du jour en français,
 * le raccourci d'importation de fichiers et le profil utilisateur.
 *
 * Conforme à la Maquette 1 : design flat, zéro emoji, zéro dégradé.
 *
 * @module components/dashboard/header
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import {
  Search,
  Bell,
  UploadCloud,
  LogOut,
  Building,
} from "lucide-react";

interface HeaderProps {
  organizationName?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Composant Header supérieur.
 */
export function Header({
  organizationName = "Mon Entreprise",
  userEmail = "utilisateur@solvia.app",
  userRole = "admin",
}: HeaderProps) {
  const router = useRouter();

  // Date du jour formatée en français sans emoji
  const todayFormatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Capitalisation de la première lettre
  const displayDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Initiales pour l'avatar
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "SO";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
      {/* Partie gauche : Organisation & Date */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5">
          <Building className="h-4 w-4 text-[#4F46E5]" />
          <span className="text-xs font-semibold text-[#0F172A]">{organizationName}</span>
          <span className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4F46E5]">
            {userRole}
          </span>
        </div>

        <div className="hidden lg:block text-xs font-medium text-[#64748B]">
          {displayDate}
        </div>
      </div>

      {/* Partie centrale : Barre de recherche inspirée de la Maquette 1 */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher une facture, un client, un montant..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pl-9 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/10"
          />
        </div>
      </div>

      {/* Partie droite : Raccourci Import, Notifications & Profil */}
      <div className="flex items-center gap-3">
        {/* Bouton d'action rapide vers l'import */}
        <Link
          href="/import"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Importer CSV / Excel</span>
        </Link>

        {/* Cloche de notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#EF4444]" />
        </button>

        {/* Profil utilisateur & Déconnexion */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-xs font-bold text-[#4F46E5]">
            {initials}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-[#0F172A] leading-tight truncate max-w-[140px]">
              {userEmail}
            </p>
            <p className="text-[10px] text-[#64748B] leading-tight">Connecté</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Déconnexion"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#FEF2F2] hover:border-[#FEE2E2] hover:text-[#EF4444]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
