"use client";

/**
 * @file cozy-character.tsx
 * @description Composant vectoriel intégrant le PNG découpé transparent fourni par l'utilisateur
 * (illustration_decoupee_transparente.png) représentant le personnage dans son fauteuil,
 * positionné en calque par-dessus la démarcation gauche/droite avec micro-animations vivantes ("pas figé").
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
      <div className="absolute -bottom-4 left-1/4 h-20 w-44 rounded-full bg-[#7086FD]/25 blur-2xl" />

      {/* Illustration découpée transparente avec flottement subtil */}
      <div className="relative transition-transform duration-700 ease-out hover:scale-[1.02] animate-float-soft">
        <Image
          src="/images/illustration_decoupee_transparente.png"
          alt="Solvia - Illustration transparente relaxe et automatisée"
          width={415}
          height={310}
          priority
          unoptimized
          className="h-auto w-full object-contain select-none pointer-events-none"
        />

        {/* Micro-bulle vivante au-dessus de l'ordinateur */}
        <div className="absolute top-[18%] left-[56%] flex flex-col gap-1 pointer-events-none animate-pulse-glow">
          <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 shadow-md shadow-indigo-950/10 border border-indigo-50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[9px] font-bold text-slate-700">Relance auto</span>
          </div>
        </div>
      </div>
    </div>
  );
}
