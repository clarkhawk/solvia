# Base de données

## Stack

- **PostgreSQL 15+** hébergé sur Supabase
- **Prisma 6** comme ORM (pas de SQL concaténé)
- **pgcrypto** activé pour chiffrement futur côté SQL
- **RLS** Supabase pour isolation multi-tenant (defense-in-depth)

## Schéma — entités principales

```
Organization (1 PME)
├── User[]              RBAC + permissions alertes
├── Client[]            Identité/contact chiffrés
│   ├── Invoice[]       Factures + statut
│   │   ├── Relance[]   Relances manuelles
│   │   ├── PaymentAllocation[]
│   │   └── AlertEvent[]
│   └── Payment[]       Paiements + allocation FIFO
├── ScoringConfig       Critères configurables (JSON)
├── AIProviderConfig    BYOK chiffré
├── AuditLog[]          Journal actions sensibles
└── InAppNotification[]
```

## Tables (14)

| Table | Description |
|---|---|
| `organizations` | PME, timezone, devise, seuil risque |
| `users` | Lien Supabase Auth, rôle, permissions alertes |
| `clients` | Clients avec PII chiffrée (BYTEA) |
| `invoices` | Factures, montants, statut, échéances |
| `payments` | Paiements reçus |
| `payment_allocations` | Lien paiement ↔ facture (FIFO) |
| `relances` | Relances manuelles + brouillon LLM |
| `scoring_configs` | Critères JSON + seuil par org |
| `ai_provider_configs` | Fournisseur LLM + clé chiffrée |
| `alert_events` | Alertes J-7/J/J+7 (idempotentes) |
| `audit_logs` | Traçabilité actions sensibles |
| `notification_preferences` | Préférences canal par user |
| `in_app_notifications` | Notifications UI |

## Enums

```prisma
UserRole          dirigeant | comptable | admin | commercial
InvoiceStatus     upcoming | overdue | paid | partially_paid | cancelled
RelanceChannel    whatsapp | phone | email
RelanceLevel      friendly | reminder_1 | reminder_2 | final_notice
RelanceResult     response_received | payment_promise | to_follow_up | payment_received | no_response
AlertType         due_in_7 | due_today | overdue_7
AIProviderType    openai | gemini | anthropic | grok
```

## Statuts facture — transitions automatiques

Calculées dans `src/modules/factures/status.ts` :

| Condition | Statut |
|---|---|
| `amountPaid >= amount` | `paid` |
| `amountPaid > 0` | `partially_paid` |
| Échéance passée, impayé | `overdue` |
| Échéance future, impayé | `upcoming` |
| Explicite | `cancelled` |

## Chiffrement PII

Colonnes `BYTEA` chiffrées côté application (AES-256-GCM) :

| Table | Colonne |
|---|---|
| `clients` | `identity_encrypted`, `contact_encrypted` |
| `users` | `phone_encrypted` |
| `ai_provider_configs` | `api_key_encrypted` |
| `notification_preferences` | `whatsapp_number_encrypted` |

Recherche/dédup email sans déchiffrement : `clients.email_hash` (SHA-256).

## Indexes critiques

- `clients(organization_id, external_code)` — unique
- `clients(organization_id, email_hash)` — dédup import
- `invoices(organization_id, due_at, status)` — dashboard + cron
- `alert_events(invoice_id, alert_type)` — unique, idempotence cron

## Migrations

| Fichier | Description |
|---|---|
| `prisma/migrations/20250916000000_init/migration.sql` | Schéma initial complet |
| `prisma/schema.prisma` | Source de vérité Prisma |

### Commandes

```bash
npx prisma migrate dev --name ma_migration   # dev (crée migration)
npx prisma migrate deploy                  # prod (applique migrations)
npx prisma generate                        # regénère le client
npx prisma studio                          # UI explorateur DB
```

## Seed

`prisma/seed.ts` — exécuté via `npm run db:seed` :

- Organisation « Demo PME » (`00000000-0000-0000-0000-000000000001`)
- User admin demo
- ScoringConfig par défaut (3 critères)
- Client Acme SARL + facture FAC-2025-001 en retard

## RLS Supabase

Fichier : `supabase/rls.sql`

- Active RLS sur toutes les tables métier
- Policy : `organization_id = auth_org_id()` (claim JWT `org_id`)
- À appliquer **après** migration initiale
- Service role bypass RLS pour le cron Vercel

## Allocation FIFO (paiements)

Quand un paiement est créé (`POST /api/v1/payments`) :

1. Récupère factures ouvertes du client triées par `dueAt ASC`
2. Répartit le montant sur les factures (plus anciennes d'abord)
3. Crée des `PaymentAllocation`
4. Met à jour `amountPaid` et statut de chaque facture
