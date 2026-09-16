# Architecture

## Principe : monolithe modulaire

Solvia est un **monolithe Next.js** découpé en **modules domaine isolés**. Aucune logique métier ne traverse les frontières de module sans passer par des types/contrats publics.

```
┌─────────────────────────────────────────────────────────────┐
│                        App Layer                             │
│  src/app/(dashboard)/   Pages UI                            │
│  src/app/api/v1/        Route Handlers (minces)             │
│  src/middleware.ts      Auth Supabase + redirect              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Modules domaine                          │
│  clients │ factures │ paiements │ relances │ scoring        │
│  ai-providers │ alerts │ import                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Shared                                  │
│  db/prisma │ auth/rbac │ crypto │ audit │ api/handler       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL (Supabase) + pgcrypto                  │
└─────────────────────────────────────────────────────────────┘
```

## Règles d'isolation inter-modules

| Autorisé | Interdit |
|---|---|
| `factures/` → importe types de `clients/` | `factures/` → importe `relances/` |
| `paiements/` → délègue statut à `factures/` | `scoring/` → importe `ai-providers/` |
| Route Handler → appelle un service module | Logique métier dans les Route Handlers |

## Modules extractibles

### `scoring/`

Contrat public pur — entrée `ScoringInput`, sortie `ScoringResult`. Zéro dépendance aux autres modules métier. Conçu pour extraction future en microservice.

### `ai-providers/`

Interface `AIProvider` + factory. Ajouter un 5e fournisseur = 1 fichier provider + 1 ligne factory. Zéro import métier.

## Flux typique d'une requête API

```
1. Route Handler (src/app/api/v1/...)
2. withAuth(permission, handler)     → getAuthContext() + requirePermission()
3. Validation Zod (schemas du module)
4. Service métier (src/modules/*/service.ts)
5. Repository (Prisma) + audit log si action sensible
6. Réponse JSON
```

## Flux cron alertes

```
Vercel Cron (05:00 UTC)
  → GET /api/cron/alerts (Bearer CRON_SECRET)
  → alertEngineService.runForAllOrganizations()
  → Scan factures J-7 / J / J+7
  → Upsert AlertEvent (idempotent)
  → Notifie users canReceiveAlerts=true
     ├── InAppNotifier
     ├── EmailNotifier (Resend)
     └── WhatsAppNotifier (Twilio)
```

## Connexions base de données

| Usage | URL | Port |
|---|---|---|
| Runtime (Route Handlers, Prisma) | `DATABASE_URL` (pooler pgbouncer) | 6543 |
| Migrations Prisma | `DIRECT_URL` (connexion directe) | 5432 |

**Jamais** de connexion directe non poolée depuis les handlers serverless en production.

## Arborescence détaillée

```
src/
├── app/
│   ├── (auth)/login/           Page connexion
│   ├── (dashboard)/            Pages protégées
│   │   ├── page.tsx            Dashboard KPIs
│   │   ├── clients/
│   │   ├── invoices/
│   │   ├── relances/
│   │   ├── scoring/
│   │   └── settings/team|ai-provider/
│   └── api/
│       ├── v1/                 API REST versionnée
│       └── cron/alerts/        Job planifié
├── modules/                    Domaines métier
├── shared/                     Infra transversale
├── components/
│   ├── ui/                     shadcn/ui
│   ├── dashboard/              Sidebar, badges
│   ├── templates/              Références design Finly
│   └── Logo solvia/            Assets marque
└── middleware.ts               Auth globale
```
