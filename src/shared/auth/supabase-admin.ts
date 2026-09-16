/**
 * @file supabase-admin.ts
 * @description Fournit un client d'administration Supabase via SUPABASE_SERVICE_ROLE_KEY.
 * Utilisé exclusivement côté serveur pour les opérations requérant des droits élevés,
 * notamment l'onboarding SaaS (création directe d'utilisateurs confirmés sans attente d'email).
 *
 * @module shared/auth/supabase-admin
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Crée et retourne une instance du client Supabase d'administration.
 *
 * @throws {Error} Si l'URL ou la clé secrète Supabase ne sont pas configurées.
 * @returns {import("@supabase/supabase-js").SupabaseClient} Client Supabase configuré sans persistance de session
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_SUPABASE_URL n'est pas définie.");
  }

  // En priorité la clé secrète service_role, avec fallback sur la clé anon
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Configuration manquante : aucune clé Supabase (SERVICE_ROLE ou ANON) n'est définie.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

