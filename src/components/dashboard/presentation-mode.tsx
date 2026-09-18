"use client";

/**
 * @file presentation-mode.tsx
 * @description Bascule « Mode présentation » : agrandit la typographie de l'application
 * pour une lecture confortable depuis le fond d'une salle, sans modifier les couleurs,
 * les composants ni la mise en page.
 *
 * Le choix est conservé dans le navigateur, et l'accès à ce stockage est protégé :
 * un navigateur en navigation privée peut le refuser.
 *
 * @module components/dashboard/presentation-mode
 */

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const STORAGE_KEY = "solvia:presentation-mode";
const CLASS_NAME = "presentation-mode";

export function PresentationModeToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "1") {
      document.documentElement.classList.add(CLASS_NAME);
      setActive(true);
    }
  }, []);

  function toggle() {
    const next = !active;
    setActive(next);
    document.documentElement.classList.toggle(CLASS_NAME, next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Stockage indisponible : la bascule reste valable pour la session en cours.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      title="Agrandit l'affichage pour la projection"
      className={
        active
          ? "inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA]"
          : "inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
      }
    >
      {active ? (
        <Minimize2 className="h-3.5 w-3.5" />
      ) : (
        <Maximize2 className="h-3.5 w-3.5 text-[#4F46E5]" />
      )}
      <span>{active ? "Affichage normal" : "Mode présentation"}</span>
    </button>
  );
}
