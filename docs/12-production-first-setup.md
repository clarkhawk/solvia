# Mise en production — sans localhost

Guide pour tester et utiliser Solvia **uniquement** via [https://solviaa.vercel.app](https://solviaa.vercel.app).

Ordre strict — ne pas sauter d'étape.

---

## Vue d'ensemble

```
GitHub (main) → Vercel build → solviaa.vercel.app
                    ↓
              Supabase (DB + Auth)
```

Tout se configure dans **Supabase Dashboard** + **Vercel Dashboard**. Pas besoin de `npm run dev`.

---

## Étape 1 — Pousser le code sur `main`

Le login auth doit être déployé sur Vercel. Vérifier que `main` contient :

- `src/app/(auth)/login/page.tsx` (vrai login Supabase)
- `src/app/auth/callback/route.ts`
- `src/shared/auth/supabase-browser.ts`

Vercel redéploie automatiquement à chaque push sur `main`.

---

## Étape 2 — Variables Vercel (obligatoire)

[Vercel → Project solvia → Settings → Environment Variables](https://vercel.com)

Cocher **Production** pour chaque variable :

| Variable | Où la trouver |
|---|---|
| `DATABASE_URL` | Supabase → Database → Connection string → **Transaction pooler** (6543) |
| `DIRECT_URL` | Supabase → Database → **Session mode** ou **Direct** (5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (**secret**) |
| `ENCRYPTION_KEY` | Générer une clé 64 hex (une fois, ne pas changer) |
| `CRON_SECRET` | Générer un secret aléatoire |
| `NEXT_PUBLIC_APP_URL` | `https://solviaa.vercel.app` |

Variables optionnelles : `EMAIL_*`, `TWILIO_*`

**Après ajout → Redeploy** (Vercel → Deployments → ⋯ → Redeploy).

---

## Étape 3 — Base de données Supabase

### 3a. Créer les tables (une seule fois)

Supabase → **SQL Editor** → New query

1. Copier tout `prisma/migrations/20250916000000_init/migration.sql`
2. **Run**

### 3b. Seed organisation demo

1. Copier `supabase/seed-demo.sql`
2. **Run**

### 3c. (Optionnel) RLS

Copier `supabase/rls.sql` → **Run** (quand JWT `org_id` sera configuré)

---

## Étape 4 — Supabase Auth

### 4a. Provider Email

[Authentication → Providers → Email](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/providers)

- Email : **ON**
- **Confirm email : OFF** pour tester rapidement (ON en prod finale avec SMTP)

### 4b. URLs (critique pour solviaa.vercel.app)

[Authentication → URL Configuration](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/url-configuration)

| Champ | Valeur exacte |
|---|---|
| **Site URL** | `https://solviaa.vercel.app` |
| **Redirect URLs** | `https://solviaa.vercel.app/**` |

Ne pas oublier le `/**` à la fin des Redirect URLs.

URLs de callback utilisées par l'app :

- `https://solviaa.vercel.app/auth/callback`
- `https://solviaa.vercel.app/login`

---

## Étape 5 — Créer votre compte

1. [Authentication → Users → Add user](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/users)
2. Email + mot de passe
3. Cocher **Auto Confirm User**
4. **Copier l'UUID** (User UID)

---

## Étape 6 — Lier Auth → table `users`

Supabase → **SQL Editor** :

```sql
INSERT INTO users (
  id, organization_id, auth_user_id, role, email,
  can_receive_alerts, can_relance_clients,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'COLLEZ-UUID-AUTH-ICI',
  'admin',
  'votre@email.com',
  true,
  true,
  NOW(),
  NOW()
);
```

Remplacez `COLLEZ-UUID-AUTH-ICI` et l'email.

---

## Étape 7 — Tester sur production

1. Ouvrir [https://solviaa.vercel.app](https://solviaa.vercel.app)
2. Redirect automatique → `/login`
3. Email + mot de passe (étape 5)
4. Dashboard `/` si tout est OK

### Vérifications

| Test | URL attendue |
|---|---|
| Login | `https://solviaa.vercel.app/login` |
| Dashboard | `https://solviaa.vercel.app/` |
| API (connecté) | DevTools → Network → `/api/v1/invoices/dashboard` → 200 |

---

## Dépannage production

| Symptôme | Cause | Fix |
|---|---|---|
| Page blanche / 500 | Env vars manquantes sur Vercel | Étape 2 + Redeploy |
| Redirect loop `/login` | User Auth OK mais pas dans `users` | Étape 6 |
| `Invalid login credentials` | User non confirmé ou mauvais MDP | Auto Confirm + reset password |
| CORS / redirect error | Redirect URLs Supabase incorrectes | `https://solviaa.vercel.app/**` |
| API 401 | Session expirée | Re-login |
| API 403 `USER_NOT_FOUND` | Étape 6 non faite | SQL insert users |
| Auth désactivée | N'arrive qu'en dev local | En prod, env Supabase obligatoire |

---

## Checklist finale

- [ ] Code auth poussé sur `main`, Vercel déployé
- [ ] 8 variables Vercel en Production (+ redeploy)
- [ ] Tables créées (`migration.sql`)
- [ ] Org demo (`seed-demo.sql`)
- [ ] Supabase Site URL = `https://solviaa.vercel.app`
- [ ] Redirect URLs = `https://solviaa.vercel.app/**`
- [ ] User Auth créé + Auto Confirm
- [ ] User lié dans table `users`
- [ ] Login OK sur [solviaa.vercel.app](https://solviaa.vercel.app)

---

## Générer ENCRYPTION_KEY et CRON_SECRET (sans terminal local)

Utilisez n'importe quel générateur en ligne de confiance, ou Supabase SQL :

```sql
SELECT encode(gen_random_bytes(32), 'hex');  -- ENCRYPTION_KEY
SELECT encode(gen_random_bytes(32), 'hex');  -- CRON_SECRET
```

Copiez les résultats dans Vercel Environment Variables.
