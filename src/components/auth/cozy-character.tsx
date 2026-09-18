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

      {/* Illustration découpée transparente */}
      <div className="relative">
        <Image
          src="/images/illustration_decoupee_transparente_fixed.png"
          alt="Solviaa - Anticipez l'impayé, assurez l'avenir"
          width={415}
          height={310}
          priority
          unoptimized
          className="h-auto w-full object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
