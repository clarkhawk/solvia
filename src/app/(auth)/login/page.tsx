"use client";

/**
 * @file page.tsx
 * @description Écran d'authentification Solvia selon la maquette exacte fournie :
 * - Carte globale arrondie unifiée (rounded-[32px])
 * - Volet gauche bleu Indigo (#4F46E5) : logo blanc, phrase d'accroche élégante et illustration
 * - Volet droit blanc : sélecteur de langue, titre fort, inputs épurés, toggle œil mot de passe,
 *   bouton d'action pilule et lien de bascule Connexion / Créer un compte.
 *
 * @module app/(auth)/login
 */

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import {
  Shield,
  Eye,
  EyeOff,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Globe,
} from "lucide-react";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMessage("Identifiants incorrects. Vérifiez votre email et mot de passe.");
        } else {
          setErrorMessage(authError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim(),
          password,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Impossible de créer l'entreprise.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Compte entreprise créé ! Connexion en cours...");

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setMode("signin");
        setSuccessMessage("Compte créé. Connectez-vous avec vos identifiants.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Impossible de contacter le serveur d'inscription.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F1F4F9] px-4 py-8 sm:px-6">
      {/* Taches de lumière douce d'arrière-plan comme la maquette */}
      <div className="pointer-events-none absolute left-10 top-10 h-96 w-96 rounded-full bg-[#818CF8]/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-96 w-96 rounded-full bg-[#C7D2FE]/25 blur-[120px]" />

      {/* Carte globale arrondie unifiée (exactement comme votre maquette) */}
      <div className="relative z-10 flex w-full max-w-[980px] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_25px_60px_-15px_rgba(79,70,229,0.12)] md:flex-row md:items-stretch">
        {/* =================================================================== */}
        {/* VOLET GAUCHE : BLEU SOLVIA (#4F46E5) AVEC LOGO & ILLUSTRATION       */}
        {/* =================================================================== */}
        <div className="flex flex-col justify-between bg-[#4F46E5] p-8 sm:p-10 text-white md:w-[45%]">
          {/* Logo blanc */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">solvia</span>
          </div>

          {/* Accroche inspirante */}
          <div className="my-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-white">
              Votre allié pour toutes vos relances clients.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-indigo-100 leading-relaxed font-normal">
              Suivez vos factures échues, anticipez les défauts de paiement et sécurisez votre trésorerie au quotidien.
            </p>
          </div>

          {/* Illustration 3D intégrée en bas */}
          <div className="mt-auto flex items-center justify-center overflow-hidden rounded-2xl">
            <Image
              src="/images/login-hero-3d.jpg"
              alt="Illustration Recouvrement Solvia"
              width={340}
              height={340}
              priority
              className="h-auto w-full max-w-[260px] rounded-2xl object-contain shadow-lg shadow-indigo-900/20 transition-transform duration-300 hover:scale-[1.03]"
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* VOLET DROIT : FORMULAIRE ÉPURÉ, CLAIR ET ACCESSIBLE                 */}
        {/* =================================================================== */}
        <div className="flex flex-1 flex-col justify-between bg-white p-8 sm:p-12 md:w-[55%]">
          {/* En-tête : Sélecteur de langue */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer">
              <Globe className="h-3.5 w-3.5" />
              <span>Français (FR)</span>
            </div>
          </div>

          {/* Cœur du formulaire */}
          <div className="my-auto max-w-sm w-full mx-auto py-4">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {mode === "signin" ? "Connexion" : "Créer un compte"}
              </h1>
              <p className="mt-1 text-xs text-[#64748B]">
                {mode === "signin"
                  ? "Accédez à votre espace de gestion Solvia"
                  : "Inscrivez votre entreprise en moins de 2 minutes"}
              </p>
            </div>

            {/* Formulaire : Connexion */}
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A]">
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nom@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#0F172A]">
                      Mot de passe
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        setErrorMessage("Contactez votre administrateur pour réinitialiser vos identifiants.");
                      }}
                      className="text-[11px] font-medium text-[#4F46E5] hover:underline"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-10 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher ou masquer le mot de passe"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-2.5 text-xs text-[#991B1B]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#DCFCE7] bg-[#ECFDF5] p-2.5 text-xs text-[#065F46]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 transition-all hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Formulaire : Création d'entreprise */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A]">
                    Nom de l&apos;entreprise
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Acme Recouvrement"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-3.5 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A]">
                    Email administrateur
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="direction@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-3.5 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-[#0F172A]">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="8 car. min"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-9 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Afficher ou masquer le mot de passe"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#0F172A]">
                      Devise
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 px-2.5 text-xs text-[#0F172A] transition-all focus:border-[#4F46E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="XOF">XOF (CFA)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-2.5 text-xs text-[#991B1B]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#DCFCE7] bg-[#ECFDF5] p-2.5 text-xs text-[#065F46]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 transition-all hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création de l&apos;entreprise...</span>
                    </>
                  ) : (
                    <>
                      <span>Créer mon entreprise et démarrer</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Lien de bascule comme sur la maquette : Already have an account? Log In */}
            <div className="mt-6 text-center text-xs text-[#64748B]">
              {mode === "signin" ? (
                <p>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-bold text-[#4F46E5] hover:underline"
                  >
                    Créer une entreprise
                  </button>
                </p>
              ) : (
                <p>
                  Vous avez déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-bold text-[#4F46E5] hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Pied de page informatif */}
          <div className="text-center text-[11px] text-[#94A3B8]">
            Plateforme sécurisée &bull; Chiffrement bancaire AES-256 &bull; Conforme RGPD
          </div>
        </div>
      </div>
    </div>
  );
}
