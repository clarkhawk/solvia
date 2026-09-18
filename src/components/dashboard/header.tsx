"use client";

/**
 * @file header.tsx
 * @description Barre de navigation supérieure (Header) pour le tableau de bord Solvia.
 * Affiche l'organisation courante, la date du jour en français, les notifications
 * et l'avatar utilisateur.
 *
 * Conforme à la Maquette 1 : design flat, zéro emoji, zéro dégradé.
 *
 * @module components/dashboard/header
 */

import { useEffect, useRef, useState } from "react";
import {
  Bell,
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
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/notifications")
      .then((response) => (response.ok ? response.json() : []))
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!notificationPanel.current?.contains(event.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function markAllNotificationsRead() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  // Date du jour formatée en français sans emoji
  const todayFormatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Capitalisation de la première lettre
  const displayDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

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

      {/* Partie droite : Notifications & Profil */}
      <div className="flex items-center gap-3">
        {/* Cloche de notifications */}
        <div className="relative" ref={notificationPanel}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <Bell className="h-4 w-4" />
            {notifications.some((notification) => !notification.read) && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#EF4444]" />}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F172A]">Notifications</p>
                <button onClick={markAllNotificationsRead} className="text-[11px] font-semibold text-[#4F46E5] hover:underline">Tout lire</button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {notifications.length ? notifications.map((notification) => (
                  <button key={notification.id} onClick={() => { void fetch("/api/v1/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notification.id }) }); setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item)); }} className={`block w-full rounded-lg p-3 text-left text-xs ${notification.read ? "bg-white" : "bg-[#EEF2FF]"}`}>
                    <p className="font-semibold text-[#0F172A]">{notification.title}</p>
                    <p className="mt-1 text-[#64748B]">{notification.message}</p>
                  </button>
                )) : <p className="p-4 text-center text-xs text-[#64748B]">Aucune notification.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Avatar utilisateur */}
        <div className="border-l border-[#E2E8F0] pl-2">
          <div
            aria-label={`Profil de ${userEmail}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-xs font-bold text-[#4F46E5]"
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
