# Déploiement Vercel

## Production

| Paramètre | Valeur |
|---|---|
| **URL** | [https://solviaa.vercel.app](https://solviaa.vercel.app) |
| **Plateforme** | Vercel |
| **Framework** | Next.js 15 (auto-détecté) |
| **Branche** | `main` |

> **Guide pas à pas sans localhost :** [12-production-first-setup.md](./12-production-first-setup.md)

## Étapes de déploiement

### 1. Connecter le repo GitHub

1. [vercel.com/new](https://vercel.com/new)
2. Importer `clarkhawk/solvia`
3. Framework Preset : **Next.js** (auto)

### 2. Variables d'environnement Vercel

Dans **Project Settings → Environment Variables**, ajouter **toutes** les variables de `.env.example` :

| Variable | Environnements |
|---|---|
| `DATABASE_URL` | Production, Preview |
| `DIRECT_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only |
| `ENCRYPTION_KEY` | Production, Preview |
| `CRON_SECRET` | Production only |
| `EMAIL_PROVIDER_API_KEY` | Production (optionnel) |
| `EMAIL_FROM` | Production (optionnel) |
| `TWILIO_*` | Production (optionnel) |
| `NEXT_PUBLIC_APP_URL` | Production : `https://solviaa.vercel.app` |

> `ENCRYPTION_KEY` : générer **une fois**, identique si vous partagez la même base Supabase. Ne jamais commiter.

### 3. Build

Vercel exécute automatiquement :

```bash
npm install        # postinstall → prisma generate
npm run build      # next build
```

### 4. Migrations base de données

**Sans localhost** — Supabase SQL Editor :

1. Coller `prisma/migrations/20250916000000_init/migration.sql` → Run
2. Coller `supabase/seed-demo.sql` → Run

Voir [12-production-first-setup.md](./12-production-first-setup.md).

### 5. Domaine custom

Le domaine **`solviaa.vercel.app`** est le domaine Vercel du projet.

Pour un domaine personnalisé futur :
- Vercel → Project → **Settings → Domains**
- Ajouter `solvia.fr` (ex.) + configurer DNS

### 6. Cron Jobs (alertes)

Configuré dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 5 * * *"
    }
  ]
}
```

| Paramètre | Valeur |
|---|---|
| Schedule | `0 5 * * *` (05:00 UTC = 06:00/07:00 Paris selon DST) |
| Endpoint | `GET /api/cron/alerts` |
| Auth | Header `Authorization: Bearer {CRON_SECRET}` |

Vercel envoie automatiquement le header `Authorization` avec `CRON_SECRET` pour les crons — configurer `CRON_SECRET` dans les env vars Vercel.

### 7. Supabase Auth — URLs autorisées

Dans Supabase → **Authentication → URL Configuration** :

| Champ | Valeur |
|---|---|
| Site URL | `https://solviaa.vercel.app` |
| Redirect URLs | `https://solviaa.vercel.app/**` |

## Preview deployments

Chaque PR sur `main` génère un preview Vercel. Utiliser la **même base Supabase** ou une base staging dédiée.

## Checklist post-déploiement

- [ ] Site accessible sur [solviaa.vercel.app](https://solviaa.vercel.app)
- [ ] Login Supabase fonctionne
- [ ] API `/api/v1/invoices/dashboard` retourne des données
- [ ] Cron exécuté (Vercel → Project → Cron Jobs → logs)
- [ ] RLS appliqué (`supabase/rls.sql`)
- [ ] Variables sensibles **non** exposées côté client (seules les `NEXT_PUBLIC_*`)
