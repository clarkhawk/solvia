# Solvia

Plateforme web de recouvrement pour PME — suivi des échéances, impayés, relances et scoring de risque.

## Stack

- **Next.js 15** (App Router, TypeScript strict)
- **PostgreSQL** via Supabase + Prisma
- **Supabase Auth** (RBAC : dirigeant, comptable, admin, commercial)
- **Vercel Cron** — alertes J-7 / J / J+7
- **Tailwind CSS + shadcn/ui**

## Architecture modulaire

```
src/modules/
├── clients/       # CRUD clients, chiffrement PII
├── factures/      # CRUD factures, transitions statut
├── paiements/     # Allocation FIFO
├── relances/      # Relances manuelles + génération LLM
├── scoring/       # Score déterministe configurable
├── ai-providers/  # Interface AIProvider (OpenAI, Gemini, Claude, Grok)
├── alerts/        # Moteur d'alertes + notifiers
└── import/        # Import CSV/Excel
```

## Démarrage

```bash
cp .env.example .env
# Renseigner DATABASE_URL (pooler), DIRECT_URL, Supabase, ENCRYPTION_KEY

npm install
npx prisma migrate deploy
npx prisma db seed   # optionnel — données demo

npm run dev
```

## Variables d'environnement

Voir [.env.example](.env.example).

## API (v1)

| Route | Description |
|---|---|
| `GET/POST /api/v1/clients` | CRUD clients |
| `GET/POST /api/v1/invoices` | CRUD factures |
| `GET /api/v1/invoices/dashboard` | KPIs dashboard |
| `POST /api/v1/payments` | Paiement + allocation FIFO |
| `GET/POST /api/v1/relances` | Relances |
| `POST /api/v1/relances/:id/generate` | Génération message LLM |
| `GET/PUT /api/v1/scoring` | Config scoring dirigeant |
| `GET /api/v1/scoring/clients` | Scores tous clients |
| `PUT /api/v1/ai/config` | BYOK fournisseur LLM |
| `POST /api/v1/import` | Import CSV/Excel |
| `GET/PATCH /api/v1/team` | Permissions alertes (admin) |
| `GET /api/cron/alerts` | Cron Vercel (Bearer CRON_SECRET) |

## Tests

```bash
npm test
```

## RLS Supabase

Appliquer [`supabase/rls.sql`](supabase/rls.sql) après migration. JWT enrichi avec `org_id`.

## Template import

Colonnes : `client_name`, `client_email`, `client_phone`, `external_code`, `invoice_reference`, `invoice_amount`, `invoice_issued_at`, `invoice_due_at`

Mapping optionnel via paramètre `mapping` (JSON) à l'import.
