"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import { Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !email || !password) return;

    setLoading(true);
    setError(null);
    const response = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, email, password, currency }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Impossible de créer votre espace.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  function switchMode(nextMode: "login" | "signup") {
    if (nextMode === "signup") {
      router.push("/signup");
      return;
    }
    setMode(nextMode);
    setError(null);
  }

  return (
    <div className="w-full max-w-[480px] mx-auto z-10 flex flex-col justify-center">
      
      {/* Header */}
      <div className="mb-10 text-left">
        <h2 className="text-[38px] font-bold text-[#0F172A] tracking-tight mb-3 leading-tight">
          {mode === "login" ? "Se connecter" : "Créer votre espace"}
        </h2>
        <p className="text-[#64748B] font-medium text-[16px]">
          {mode === "login" ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}
          <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="text-[#4F46E5] font-semibold hover:underline">
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-[12px] bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-600 text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-5">
        {mode === "signup" && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0F172A]">Nom de l&apos;entreprise</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Votre entreprise" disabled={loading} required className="w-full h-[54px] px-4 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0F172A]">Devise</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={loading} className="w-full h-[54px] px-4 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#4F46E5]">
                <option value="EUR">EUR — Euro</option><option value="XOF">XOF — Franc CFA</option><option value="USD">USD — Dollar</option>
              </select>
            </div>
          </>
        )}
        
        {/* Email Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#0F172A]">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-[#64748B]" strokeWidth={1.5} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              disabled={loading}
              required
              className="w-full h-[54px] pl-12 pr-4 rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password Field Component */}
        <PasswordInput 
          value={password} 
          onChange={setPassword} 
          disabled={loading} 
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[54px] mt-4 rounded-[12px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[16px] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group hover:-translate-y-[1px] shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {mode === "login" ? "Connexion en cours..." : "Création en cours..."}
            </>
          ) : (
            <>
              {mode === "login" ? "Se connecter" : "Créer mon espace"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Footer Text */}
      <div className="mt-12 text-center">
        <p className="text-[14px] font-medium text-[#64748B]">
          En créant un compte, vous acceptez nos{" "}
          <a href="/cgu" className="text-[#4F46E5] hover:underline font-semibold">
            CGU
          </a>
        </p>
        <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="mt-3 text-[14px] font-semibold text-[#4F46E5] hover:underline">
          {mode === "login" ? "Créer votre espace" : "Revenir à la connexion"}
        </button>
      </div>
      
    </div>
  );
}
