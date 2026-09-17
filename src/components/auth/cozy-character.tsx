"use client";

/**
 * @file cozy-character.tsx
 * @description Composant vectoriel et illustré représentant le personnage détendu dans son fauteuil
 * avec ordinateur portable, chat qui s'étire et bulles d'interaction.
 * Positionné en calque par-dessus la démarcation entre le volet bleu lavande et le volet blanc,
 * avec micro-animations douces pour rendre l'interface vivante et dynamique ("pas figé").
 *
 * @module components/auth/cozy-character
 */

import Image from "next/image";

interface CozyCharacterProps {
  className?: string;
}

export function CozyCharacter({ className = "" }: CozyCharacterProps) {
  return (
    <div className={`relative select-none pointer-events-none ${className}`}>
      {/* Halo lumineux ambiant doux sous l'illustration */}
      <div className="absolute -bottom-6 left-1/4 h-24 w-48 rounded-full bg-[#7086FD]/20 blur-2xl" />

      {/* Illustration maîtresse haute fidélité */}
      <div className="relative transition-transform duration-700 ease-out hover:scale-[1.02] animate-float-soft">
        <Image
          src="/images/cozy_couch_seamless.png"
          alt="Illustration Solvia - Gestion sereine et automatisée du recouvrement"
          width={420}
          height={391}
          priority
          unoptimized
          className="h-auto w-full object-contain object-bottom select-none pointer-events-none"
        />

        {/* Micro-bulles interactives vivantes au-dessus de l'ordinateur */}
        <div className="absolute top-[18%] left-[58%] flex flex-col gap-1.5 pointer-events-none animate-pulse-glow">
          {/* Petite bulle de statut en temps réel */}
          <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 shadow-md shadow-indigo-950/10 border border-indigo-50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-bold text-slate-700">Relance auto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

