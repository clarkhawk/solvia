"use client";

/**
 * @file page.tsx
 * @description Écran d'authentification et d'onboarding SaaS Solvia haute performance.
 * Architecture en double panneau (Split-Screen) inspirée des standards des meilleures fintechs (Stripe, Qonto, Pennylane).
 *
 * Directives strictes appliquées :
 * - Zéro emoji (utilisation exclusive d'icônes vectorielles Lucide).
 * - Zéro dégradé parasite (palette flat, surfaces nettes, contrastes élevés).
 * - Palette Maquette 1 : Indigo (#4F46E5), Nuit Profonde (#1E1B4B), Ardoise (#0F172A, #64748B).
 * - Double mode fluide : Connexion utilisateur / Inscription d'entreprise instantanée.
 * - Vitrine produit intégrée : Aperçu dynamique des fonctionnalités clés de recouvrement.
 *
 * @module app/(auth)/login
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/auth/supabase-browser";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  TrendingUp,
  MessageSquare,
  Clock,
  Sparkles,
  LockKeyhole,
} from "lucide-react";

/**
 * Modes d'authentification disponibles.
 */
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  // Mode actif (Connexion ou Inscription)
  const [mode, setMode] = useState<AuthMode>("signin");

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

  /**
   * Bascule entre connexion et inscription avec remise à zéro des états d'erreur.
   */
  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  /**
   * Connexion via Supabase Auth.
   */
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
          setErrorMessage("Identifiants incorrects. Vérifiez votre adresse email et votre mot de passe.");
        } else {
          setErrorMessage(authError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Une erreur de communication est survenue. Veuillez vérifier votre réseau.");
      setLoading(false);
    }
  }

  /**
   * Inscription d'une nouvelle entreprise et de son compte administrateur.
   */
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
        setErrorMessage(data.error || "Impossible de créer votre entreprise.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Entreprise créée avec succès ! Initialisation de votre espace...");

      // Connexion automatique immédiate
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setMode("signin");
        setSuccessMessage("Compte créé. Veuillez entrer vos identifiants pour vous connecter.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Impossible de joindre le serveur d'inscription. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* PANNEAU GAUCHE : FORMULAIRE D'AUTHENTIFICATION & ONBOARDING               */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 lg:max-w-[540px] xl:px-16">
        {/* En-tête : Logo et Identité */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">solvia</span>
              <span className="ml-2 rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">
                SaaS B2B
              </span>
            </div>
          </div>
        </div>

        {/* Cœur du formulaire */}
        <div className="my-auto py-8">
          {/* Titre & Sous-titre contextuels */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              {mode === "signin" ? "Heureux de vous revoir" : "Créez votre entreprise"}
            </h1>
            <p className="mt-1.5 text-xs text-[#64748B] sm:text-sm">
              {mode === "signin"
                ? "Connectez-vous pour piloter vos encaissements et relances clients."
                : "Démarrez en libre-service sans carte bancaire requise."}
            </p>
          </div>

          {/* Sélecteur d'onglets (Segmented Pill Switch) */}
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-lg py-2.5 transition-all ${
                mode === "signin"
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg py-2.5 transition-all ${
                mode === "signup"
                  ? "bg-white text-[#4F46E5] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Créer une entreprise
            </button>
          </div>

          {/* Formulaire : Connexion */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="prenom.nom@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Mot de passe
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrorMessage("Veuillez contacter votre administrateur d'organisation pour réinitialiser vos identifiants.");
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
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-11 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
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
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-xs text-[#991B1B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#DCFCE7] bg-[#ECFDF5] p-3 text-xs text-[#065F46]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                  <span className="leading-tight">{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4338CA] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à mon tableau de bord</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Formulaire : Création d'entreprise */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                  Nom de l&apos;entreprise
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Altura Conseil &amp; Associés"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                  Email administrateur
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="direction@votre-entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="8 caractères min."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-11 text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
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

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                    Devise
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 px-3 text-xs text-[#0F172A] transition-all focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="XOF">XOF (CFA)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-xs text-[#991B1B]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#DCFCE7] bg-[#ECFDF5] p-3 text-xs text-[#065F46]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                  <span className="leading-tight">{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4338CA] focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Création de votre entreprise...</span>
                  </>
                ) : (
                  <>
                    <span>Créer l&apos;organisation et démarrer</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Pied de panneau : Garanties & Sécurité */}
        <div className="border-t border-[#E2E8F0] pt-6">
          <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <LockKeyhole className="h-3.5 w-3.5 text-[#10B981]" />
              <span>Chiffrement AES-256</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#4F46E5]" />
              <span>Conformité RGPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANNEAU DROIT : VITRINE PRODUIT SAAS (STYLE FINNOVA / MAQUETTE 1)         */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-[#1E1B4B] p-12 text-white xl:p-16">
        {/* En-tête du volet vitrine */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#818CF8]" />
            <span>Moteur de recouvrement intelligent</span>
          </div>
          <span className="text-xs text-[#94A3B8]">Solvia OS v1.0</span>
        </div>

        {/* Message d'impact & Accroche métier */}
        <div className="my-auto max-w-lg space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl leading-tight">
            Récupérez votre trésorerie bloquée sans détériorer la relation client.
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Solvia analyse les habitudes de paiement de vos débiteurs, calcule leur score de risque et orchestre des relances multicanales intelligentes (Email, WhatsApp, Téléphone).
          </p>

          {/* Cartes interactives Bento / Maquette 1 */}
          <div className="space-y-3.5 pt-4">
            {/* Carte 1 : Relance intelligente simulée */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981]/20 text-[#10B981]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-white">Relance IA ciblée</span>
                </div>
                <span className="rounded-md bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                  Délai moyen -62%
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                « Bonjour Marc, suite à notre échange du 12, voici le lien de règlement de la facture FAC-2026-088. »
              </p>
            </div>

            {/* Carte 2 : Métriques de flux */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
                  <Clock className="h-3.5 w-3.5 text-[#818CF8]" />
                  <span>Délai de règlement</span>
                </div>
                <p className="text-2xl font-bold text-white">16 jours</p>
                <p className="text-[10px] text-[#10B981] mt-1 flex items-center gap-1 font-semibold">
                  <TrendingUp className="h-3 w-3" />
                  <span>-8 jours vs mois précédent</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-1">
                  <Shield className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>Précision du scoring</span>
                </div>
                <p className="text-2xl font-bold text-white">94,2%</p>
                <p className="text-[10px] text-[#94A3B8] mt-1 font-semibold">
                  Anticipation des défauts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Témoignage / Preuve sociale */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs italic text-[#CBD5E1] leading-relaxed">
            « En important nos factures sur Solvia, nous avons récupéré 42 000 € d&apos;impayés dès le premier mois grâce aux relances séquencées. »
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Directeur Administratif &amp; Financier</span>
            <span className="text-[#818CF8]">PME Industrie &bull; 80 collaborateurs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
