# Dépannage — production hors service (17 septembre 2026)

## Symptôme

Toutes les routes de l'API renvoient `500 {"error":"Internal server error"}`, sur
`solviaa.vercel.app` comme sur le déploiement `solvia-git-main-…`.
Le tableau de bord affiche 0 € partout, l'import échoue, et la connexion redirige
parfois vers `/login?error=auth_callback_failed`.

Routes vérifiées : `GET /api/v1/import`, `/api/v1/clients`, `/api/v1/invoices/dashboard`,
`/api/v1/scoring`, `/api/v1/notifications`, `/api/v1/ai/config` — toutes en 500.

## Cause

Journal Vercel (export du 17/09/2026, déploiement `dpl_EXgc4X2Y7HcfAKewMfMPvdGbF7KE`) :

```
Error [PrismaClientInitializationError]
Invalid `prisma.user.findUnique()` invocation:
Error querying the database:
FATAL: (ENOTFOUND) tenant/user postgres.bgrwqqwfxvrocxdzhhef not found
```

Le message vient du pooler Supabase (Supavisor), pas de PostgreSQL : le locataire
demandé par `DATABASE_URL` est introuvable. **L'application n'a donc aucune base
de données.** Toutes les routes passent par `withAuth` → `getAuthContext()` →
`prisma.user.findUnique`, d'où le 500 généralisé.

Vérifications déjà faites :

- La référence de projet est cohérente : l'application et `DATABASE_URL` utilisent
  toutes deux `bgrwqqwfxvrocxdzhhef`.
- Le projet Supabase n'est pas en pause : `https://bgrwqqwfxvrocxdzhhef.supabase.co`
  répond « No API key found in request », réponse normale d'un projet actif.

Il reste donc la chaîne de connexion elle-même :

1. hôte régional du pooler obsolète ou erroné (`aws-0-…` / `aws-1-…`) ;
2. format d'utilisateur inadapté au port : `postgres.<référence>` sur le pooler de
   transaction (6543), `postgres` sur la connexion directe (5432) ;
3. mot de passe de base réinitialisé et non reporté dans les variables Vercel.

## Correction (accès Vercel + Supabase requis)

1. Supabase → projet → **Connect** : copier la chaîne *Transaction pooler* (6543)
   et la chaîne *Session pooler* ou *Direct connection* (5432).
2. Vercel → Settings → Environment Variables (Production) :
   - `DATABASE_URL` = chaîne 6543 + `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL` = chaîne 5432
   Vérifier aussi `ENCRYPTION_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
3. Vercel → Deployments → **Redeploy** (les variables ne sont lues qu'au déploiement).
4. Vérifier : `GET https://solviaa.vercel.app/api/health`
   - `{"status":"ok"}` → base joignable et schéma présent ;
   - `503` + `database: "unreachable"` → la chaîne est toujours fausse ;
   - `503` + `schema: "missing"` → appliquer les migrations : `npm run db:migrate:deploy`.
5. Charger les données de démonstration, puis refaire un import de contrôle.

## Ce que cette branche apporte

- `src/app/api/health/route.ts` — sonde publique de santé : état de la base et du
  schéma, sans exposer la moindre chaîne de connexion. Sert à valider l'étape 4.
- `src/shared/api/handler.ts` — les erreurs Prisma sont traduites en réponses
  explicites (P2002 → 409, P2025 → 404, P2021/P2022 → « migrations non appliquées »,
  initialisation → 503) avec un `code` et un `requestId`. Le message brut ne sort
  qu'hors production. Une panne comme celle-ci sera diagnosticable en une requête.
- `src/modules/import/parser.service.ts` — quatre défauts corrigés :
  `XLSX.read` recevait un `ArrayBuffer` au lieu d'un `Uint8Array` (les `.xlsx`
  échouaient) ; `replace(",", ".")` cassait « 1 250,50 » ; `new Date("15/03/2026")`
  est invalide en JavaScript ; et un `.filter()` supprimait silencieusement toute
  ligne fautive. Les lignes rejetées remontent maintenant avec leur numéro et leur raison.
- `src/modules/import/mapper.service.ts` — une requête au lieu d'une par ligne pour
  les références existantes, cache client par import (sans code externe ni e-mail le
  même client était recréé à chaque ligne), journal d'audit non bloquant.
- `src/app/api/v1/import/route.ts` — `runtime nodejs`, `dynamic force-dynamic`,
  limite à 4 Mo (Vercel refuse au-delà de ~4,5 Mo), réponse 422 détaillée quand aucune
  ligne n'est exploitable, messages en français.
- `src/app/api/cron/alerts/route.ts` — sans `CRON_SECRET` défini, l'en-tête
  `Bearer undefined` était accepté : n'importe qui pouvait déclencher les alertes.
  La route est désormais fermée en l'absence de secret, et la comparaison se fait
  en temps constant.
- `src/modules/import/__tests__/parser.test.ts` — 6 tests sur les montants, les dates,
  le modèle officiel, les lignes fautives et les en-têtes tolérants.

Aucun composant d'interface ni élément du design system n'a été modifié.

## Points relevés, non corrigés ici

- `src/modules/paiements/allocation.service.ts` : le commentaire annonce un verrou sur
  les factures, mais `findMany` ne verrouille rien. Deux paiements concurrents peuvent
  s'imputer sur le même solde. Utiliser `SELECT … FOR UPDATE` ou une transaction sérialisable.
- Statuts de facture calculés uniquement à l'écriture : une facture échue depuis la
  dernière modification reste affichée « à venir ». À recalculer dans le cron quotidien.
- `src/modules/factures/status.ts` compare avec l'heure locale du serveur alors que les
  dates sont en `@db.Date` : comparer en UTC.
- `src/shared/db/prisma.ts` : client mis en cache global uniquement hors production.
- `/api/v1/auth/signup` : l'utilisateur Supabase est créé avant l'organisation en base.
  Vérifier qu'un échec supprime bien l'utilisateur Auth, sinon des comptes orphelins
  restent bloqués en 403.
