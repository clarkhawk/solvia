# Documentation Solvia

Plateforme de recouvrement pour PME — documentation technique et fonctionnelle.

**Production :** [https://solviaa.vercel.app](https://solviaa.vercel.app)

## Sommaire

| Document | Description |
|---|---|
| [Vue d'ensemble](./01-overview.md) | Vision produit, périmètre MVP, stack |
| [Architecture](./02-architecture.md) | Monolithe modulaire, flux de données, dépendances |
| [Installation & config](./03-setup.md) | Environnement local, Supabase, variables `.env` |
| [Déploiement](./04-deployment.md) | Vercel, cron, domaine `solviaa.vercel.app` |
| [Base de données](./05-database.md) | Schéma Prisma, migrations, seed, RLS |
| [API REST](./06-api.md) | Routes v1, auth, exemples |
| [Modules métier](./07-modules.md) | Détail de chaque module domaine |
| [Auth & RBAC](./08-auth-rbac.md) | Rôles, permissions, middleware |
| [Sécurité](./09-security.md) | Chiffrement, audit, bonnes pratiques |
| [UI & Design](./10-ui-design.md) | Templates Finly, logos, charte visuelle |

## Démarrage rapide

```bash
cp .env.example .env.local
# Remplir DATABASE_URL, DIRECT_URL, clés Supabase, ENCRYPTION_KEY

npm install
npx prisma migrate deploy
npm run db:seed   # optionnel
npm run dev
```

## Commandes utiles

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm test` | Tests unitaires (Vitest) |
| `npx prisma migrate deploy` | Appliquer migrations |
| `npm run db:seed` | Données de démonstration |

## Structure du repo

```
solvia/
├── docs/                    ← Cette documentation
├── prisma/                  ← Schéma, migrations, seed
├── supabase/                ← Policies RLS
├── src/
│   ├── app/                 ← Pages + Route Handlers API
│   ├── modules/             ← Domaines métier isolés
│   ├── shared/              ← Infra transversale
│   └── components/          ← UI, templates, logos
├── vercel.json              ← Cron alertes
└── .env.example             ← Template variables d'environnement
```
