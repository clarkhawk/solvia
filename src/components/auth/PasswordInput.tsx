"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PasswordInput({ value, onChange, disabled }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#0F172A]">
          Mot de passe
        </label>
        <a 
          href="#" 
          className="text-sm font-semibold text-[#4F46E5] hover:underline"
          tabIndex={-1}
        >
          Mot de passe oublié ?
        </a>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-[#64748B]" strokeWidth={1.5} />
        </div>
        
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Mot de passe"
          disabled={disabled}
          required
          className="w-full h-[54px] pl-12 pr-12 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#0F172A] focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  );
}
