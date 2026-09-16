# Déploiement Vercel

## Production

| Paramètre | Valeur |
|---|---|
| **URL** | [https://solviaa.vercel.app](https://solviaa.vercel.app) |
| **Plateforme** | Vercel |
| **Framework** | Next.js 15 (auto-détecté) |
| **Branche** | `main` |

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

> Utilisez les **mêmes valeurs** qu'en local pour Supabase. `ENCRYPTION_KEY` doit être **identique** entre local et prod si vous partagez la même base.

### 3. Build

Vercel exécute automatiquement :

```bash
npm install        # postinstall → prisma generate
npm run build      # next build
```

### 4. Migrations base de données

Après le premier déploiement, appliquer les migrations **une fois** :

```bash
# En local, avec DATABASE_URL prod dans .env
npx prisma migrate deploy
```

Ou via CI / script manuel pointant vers la DB Supabase production.

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
| Redirect URLs | `https://solviaa.vercel.app/**`, `http://localhost:3000/**` |

## Preview deployments

Chaque PR sur `main` génère un preview Vercel. Utiliser la **même base Supabase** ou une base staging dédiée.

## Checklist post-déploiement

- [ ] Site accessible sur [solviaa.vercel.app](https://solviaa.vercel.app)
- [ ] Login Supabase fonctionne
- [ ] API `/api/v1/invoices/dashboard` retourne des données
- [ ] Cron exécuté (Vercel → Project → Cron Jobs → logs)
- [ ] RLS appliqué (`supabase/rls.sql`)
- [ ] Variables sensibles **non** exposées côté client (seules les `NEXT_PUBLIC_*`)
