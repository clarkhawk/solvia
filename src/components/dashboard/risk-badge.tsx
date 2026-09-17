import React from "react";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  score: number;
}

export function RiskBadge({ score }: RiskBadgeProps) {
  let label = "Excellent";
  let colorClass = "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"; // Green

  if (score >= 70) {
    label = "Critique";
    colorClass = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"; // Red
  } else if (score >= 40) {
    label = "À surveiller";
    colorClass = "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"; // Yellow
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
        colorClass
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label} ({score})
    </span>
  );
}

