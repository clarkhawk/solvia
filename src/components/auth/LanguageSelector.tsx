"use client";

import { Globe } from "lucide-react";

export function LanguageSelector() {
  return (
    <div className="absolute top-6 right-6 xl:top-8 xl:right-8 z-50">
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none">
          <Globe className="w-4 h-4 text-[#64748B]" />
        </div>
        <select 
          defaultValue="fr"
          className="appearance-none w-auto min-w-[130px] rounded-[12px] border border-[#E2E8F0] bg-white text-[#64748B] font-medium pl-9 pr-8 py-2.5 h-auto focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <div className="absolute right-3 pointer-events-none text-[#64748B]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
