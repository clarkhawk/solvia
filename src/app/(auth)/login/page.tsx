"use client";

/**
 * @file page.tsx
 * @description Page d'authentification Solvia structurée exactement selon la spécification de l'utilisateur :
 * - Conteneur .login-page avec fond dégradé vibrant
 * - Carte .login-card de 1000px avec bordure arrondie de 30px
 * - Volet gauche .left-side (35%, #8d9cf0) avec logo .brand, texte .tagline et illustration découpée transparente (.illustration)
 * - Volet droit .right-side (65%, fond blanc, arrondi 30px) avec sélecteur .language et formulaire .form-container
 * - Interface interactive et dynamique ("pas figé") : micro-animations douces, soulignement d'input réactif, bilingue FR/EN
 * - Fonctions réelles préservées : Inscription atomique SaaS, Connexion Supabase Auth, Google OAuth, Accès Démo en 1-clic
 *
 * @module app/(auth)/login
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import { CozyCharacter } from "@/components/auth/cozy-character";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Sparkles,
  Zap,
} from "lucide-react";

type AuthMode = "signup" | "signin";
type Language = "en" | "fr";

export default function LoginPage() {
  const router = useRouter();

  // Mode Inscription ou Connexion
  const [mode, setMode] = useState<AuthMode>("signup");

  // Langue active (par défaut English comme sur la maquette, basculable en Français)
  const [lang, setLang] = useState<Language>("en");

  // Champs de saisie
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [showPassword, setShowPassword] = useState(false);

  // États de chargement et retours
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  // Textes bilingues
  const t = {
    en: {
      brandTagline: "A Buddy for all your cash collection and invoice recovery.",
      badge: "AI Cash Collection",
      langSelect: "English (UK)",
      createTitle: "Create Account",
      loginTitle: "Welcome Back",
      googleBtn: "Sign Up with Google",
      facebookBtn: "1-Click Demo",
      orDivider: "— OR —",
      namePlaceholder: "Full Name",
      emailPlaceholder: "Email Address",
      passwordPlaceholder: "Password",
      submitCreate: "Create Account",
      submitLogin: "Log In",
      hasAccount: "Already have an account?",
      noAccount: "Don't have an account?",
      loginLink: "Log In",
      signupLink: "Sign Up",
      demoLoaded: "Demo credentials pre-filled.",
    },
    fr: {
      brandTagline: "Votre allié pour piloter et automatiser tout votre recouvrement.",
      badge: "Recouvrement IA",
      langSelect: "Français (FR)",
      createTitle: "Créer un compte",
      loginTitle: "Bon retour parmi nous",
      googleBtn: "S'inscrire avec Google",
      facebookBtn: "Accès Démo 1-Clic",
      orDivider: "— OU —",
      namePlaceholder: "Nom complet ou Entreprise",
      emailPlaceholder: "Adresse email professionnelle",
      passwordPlaceholder: "Mot de passe",
      submitCreate: "Créer un compte",
      submitLogin: "Se connecter",
      hasAccount: "Vous avez déjà un compte ?",
      noAccount: "Pas encore de compte ?",
      loginLink: "Connexion",
      signupLink: "Créer un compte",
      demoLoaded: "Identifiants de démonstration appliqués.",
    },
  }[lang];

  // Connexion Supabase
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
          setErrorMessage(
            lang === "fr"
              ? "Identifiants incorrects. Vérifiez votre email et mot de passe."
              : "Invalid credentials. Please check your email and password."
          );
        } else {
          setErrorMessage(authError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage(
        lang === "fr"
          ? "Erreur de communication avec le serveur. Veuillez réessayer."
          : "Network error. Please try again."
      );
      setLoading(false);
    }
  }

  // Inscription atomique multi-tenant
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
          companyName: companyName.trim() || "Entreprise",
          email: email.trim(),
          password,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Impossible de finaliser l'inscription.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        lang === "fr"
          ? "Compte créé avec succès ! Connexion en cours..."
          : "Account created! Signing you in..."
      );

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setMode("signin");
        setSuccessMessage(
          lang === "fr"
            ? "Compte créé. Veuillez vous connecter."
            : "Account created. Please sign in."
        );
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage(
        lang === "fr"
          ? "Le serveur d'inscription est momentanément indisponible."
          : "Signup server is unreachable."
      );
      setLoading(false);
    }
  }

  // Connexion Google OAuth
  async function handleGoogleAuth() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
      }
    } catch {
      setErrorMessage("Impossible d'initialiser Google OAuth.");
    }
  }

  // Accès démo pré-rempli
  function handleDemoAccess() {
    setEmail("admin@demo.solvia.app");
    setPassword("SolviaDemo2026!");
    setSuccessMessage(t.demoLoaded);
  }

  return (
    <main className="login-page relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#7941F2] via-[#5244E6] to-[#3B65FF] p-4 sm:p-8 overflow-hidden">
      {/* Halos lumineux d'ambiance pour une page vivante */}
      <div className="absolute top-1/4 left-1/12 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/12 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      {/* ===================================================================== */}
      {/* CARTE PRINCIPALE (.login-card)                                        */}
      {/* ===================================================================== */}
      <div className="login-card relative flex w-full max-w-[1000px] min-h-[600px] rounded-[30px] bg-[#8d9cf0] shadow-[0_30px_80px_rgba(20,10,80,0.32)] flex-col md:flex-row overflow-visible">
        {/* =================================================================== */}
        {/* PARTIE GAUCHE (.left-side) - 35%, #8d9cf0, arrondi 30px 0 0 30px     */}
        {/* =================================================================== */}
        <section className="left-side relative w-full md:w-[35%] bg-[#8d9cf0] md:rounded-l-[30px] p-8 sm:p-10 flex flex-col justify-between text-white z-20">
          <div>
            {/* Logo (.brand) */}
            <div className="brand flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white select-none">
                solvia
              </h2>
            </div>

            {/* Accroche (.tagline) */}
            <div className="mt-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                <Zap className="h-3 w-3 text-amber-300" />
                {t.badge}
              </span>
              <p className="tagline mt-3 text-xs sm:text-sm font-medium text-white/95 leading-relaxed max-w-[230px]">
                {t.brandTagline}
              </p>
            </div>
          </div>

          {/* Espace vide où vient s'ancrer l'illustration */}
          <div className="h-48 md:h-64" />

          {/* Illustration découpée transparente (.illustration) qui déborde par-dessus à 120% */}
          <div className="illustration hidden md:block absolute bottom-6 md:bottom-8 left-[48%] -translate-x-1/2 w-[125%] max-w-none z-30 pointer-events-none">
            <CozyCharacter />
          </div>
        </section>

        {/* =================================================================== */}
        {/* PARTIE DROITE (.right-side) - 65%, blanc, arrondi 30px               */}
        {/* =================================================================== */}
        <section className="right-side relative z-10 w-full md:w-[65%] bg-white md:rounded-[30px] p-8 sm:p-12 md:pl-28 flex flex-col justify-between shadow-xs">
          {/* Langue (.language) */}
          <div className="language flex items-center justify-end">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <span>{t.langSelect}</span>
              <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180 duration-300" />
            </button>
          </div>

          {/* Formulaire & Contenu (.form-container) */}
          <div className="form-container my-auto max-w-[370px] w-full">
            {/* Titre (h1) */}
            <div className="mb-6 transition-all duration-300">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {mode === "signup" ? t.createTitle : t.loginTitle}
              </h1>
            </div>

            {/* Connexion sociale (.social-buttons) */}
            <div className="social-buttons mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {/* Icône Google vectorielle officielle */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="truncate">{t.googleBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleDemoAccess}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-xs hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#1877F2] text-[9px] font-black text-white">
                  f
                </div>
                <span className="truncate">{t.facebookBtn}</span>
              </button>
            </div>

            {/* Séparateur (.separator) */}
            <div className="separator relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {t.orDivider}
              </span>
            </div>

            {/* Formulaire Inscription */}
            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4 transition-all duration-300">
                {/* Full Name */}
                <div className="group relative">
                  <input
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border-b border-slate-300 bg-transparent pb-2 pt-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#7086FD] focus:outline-none"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#7086FD] transition-all duration-300 group-focus-within:w-full" />
                </div>

                {/* Email Address */}
                <div className="group relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-slate-300 bg-transparent pb-2 pt-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#7086FD] focus:outline-none"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#7086FD] transition-all duration-300 group-focus-within:w-full" />
                </div>

                {/* Password */}
                <div className="group relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b border-slate-300 bg-transparent pb-2 pt-1 pr-8 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#7086FD] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Afficher ou masquer le mot de passe"
                    className="absolute right-0 top-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#7086FD] transition-all duration-300 group-focus-within:w-full" />
                </div>

                {/* Sélecteur de devise */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Devise :</span>
                  <div className="flex gap-1">
                    {["EUR", "USD", "CHF", "CAD"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                          currency === c
                            ? "bg-[#7086FD] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages de retour */}
                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-[11px] font-medium text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Bouton Create Account */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#899BF4] hover:bg-[#7287F0] py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-200/80 hover:shadow-indigo-300 transition-all transform active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{t.submitCreate}</span>
                  )}
                </button>
              </form>
            )}

            {/* Formulaire Connexion */}
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4 transition-all duration-300">
                {/* Email Address */}
                <div className="group relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-slate-300 bg-transparent pb-2 pt-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#7086FD] focus:outline-none"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#7086FD] transition-all duration-300 group-focus-within:w-full" />
                </div>

                {/* Password */}
                <div className="group relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b border-slate-300 bg-transparent pb-2 pt-1 pr-8 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#7086FD] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Afficher ou masquer le mot de passe"
                    className="absolute right-0 top-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#7086FD] transition-all duration-300 group-focus-within:w-full" />
                </div>

                {/* Messages de retour */}
                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-[11px] font-medium text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Bouton Sign In */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#899BF4] hover:bg-[#7287F0] py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-200/80 hover:shadow-indigo-300 transition-all transform active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>{t.submitLogin}</span>
                  )}
                </button>
              </form>
            )}

            {/* Lien bascule (.login-link) */}
            <div className="login-link mt-6 text-center text-xs text-slate-500">
              {mode === "signup" ? (
                <p>
                  {t.hasAccount}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-bold text-[#7086FD] hover:text-[#5244E6] hover:underline transition-colors cursor-pointer"
                  >
                    {t.loginLink}
                  </button>
                </p>
              ) : (
                <p>
                  {t.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-bold text-[#7086FD] hover:text-[#5244E6] hover:underline transition-colors cursor-pointer"
                  >
                    {t.signupLink}
                  </button>
                </p>
              )}
            </div>
          </div>

          <div />
        </section>
      </div>
    </main>
  );
}
