# API REST v1

Base URL production : `https://solviaa.vercel.app/api/v1`

## Authentification

Toutes les routes v1 (sauf cron) requièrent une **session Supabase** active (cookie).

Le handler `withAuth(permission, fn)` dans `src/shared/api/handler.ts` :
1. Résout `AuthContext` via `getAuthContext()`
2. Vérifie la permission RBAC
3. Exécute le handler ou retourne 401/403

### Réponses d'erreur

```json
{ "error": "Unauthorized", "code": "UNAUTHORIZED" }        // 401
{ "error": "Permission denied: invoices:write" }            // 403
{ "error": "Client not found", "code": "CLIENT_NOT_FOUND" } // 404
```

---

## Clients

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/clients?page=1&limit=20` | `clients:read` | Liste paginée |
| POST | `/clients` | `clients:write` | Créer |
| GET | `/clients/:id` | `clients:read` | Détail |
| PATCH | `/clients/:id` | `clients:write` | Modifier |
| DELETE | `/clients/:id` | `clients:write` | Supprimer |

### POST /clients — body

```json
{
  "externalCode": "CLI-001",
  "identity": { "name": "Acme SARL", "companyName": "Acme", "siret": "12345678901234" },
  "contact": { "email": "contact@acme.fr", "phone": "+33600000000" }
}
```

---

## Factures

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/invoices?status=overdue&clientId=...` | `invoices:read` | Liste |
| POST | `/invoices` | `invoices:write` | Créer |
| GET | `/invoices/:id` | `invoices:read` | Détail |
| PATCH | `/invoices/:id` | `invoices:write` | Modifier |
| DELETE | `/invoices/:id` | `invoices:write` | Supprimer |
| GET | `/invoices/dashboard` | `invoices:read` | KPIs dashboard |

### POST /invoices — body

```json
{
  "clientId": "uuid",
  "reference": "FAC-2025-001",
  "amount": 1500.00,
  "issuedAt": "2025-08-01",
  "dueAt": "2025-09-01"
}
```

---

## Paiements

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/payments?page=1&limit=20` | `invoices:read` | Liste |
| POST | `/payments` | `payments:write` | Créer + allocation FIFO |

### POST /payments — body

```json
{
  "clientId": "uuid",
  "amount": 500.00,
  "paidAt": "2025-09-10",
  "reference": "VIR-12345"
}
```

---

## Relances

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/relances?invoiceId=...` | `relances:read` | Liste |
| POST | `/relances` | `relances:write` | Créer (manuel) |
| GET | `/relances/:id` | `relances:read` | Détail |
| PATCH | `/relances/:id` | `relances:write` | Modifier |
| POST | `/relances/:id/generate` | `relances:write` | Générer message LLM |

### POST /relances — body

```json
{
  "invoiceId": "uuid",
  "channel": "email",
  "level": "reminder_1",
  "result": "to_follow_up"
}
```

---

## Scoring

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/scoring` | `scoring:configure` | Config org |
| PUT | `/scoring` | `scoring:configure` | Mettre à jour critères |
| GET | `/scoring/clients` | `invoices:read` | Scores tous clients |

### PUT /scoring — body

```json
{
  "riskThreshold": 70,
  "criteria": [
    { "name": "Montant en retard", "metricType": "montant_en_retard", "weight": 0.5, "enabled": true },
    { "name": "Ancienneté", "metricType": "anciennete_retard", "weight": 0.3, "enabled": true },
    { "name": "Historique", "metricType": "taux_retard_historique", "weight": 0.2, "enabled": true }
  ]
}
```

---

## IA (BYOK)

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/ai/config` | `ai:configure` | Config (sans clé en clair) |
| PUT | `/ai/config` | `ai:configure` | Configurer provider + clé |

### PUT /ai/config — body

```json
{
  "provider": "openai",
  "apiKey": "sk-..."
}
```

---

## Import

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/import` | `import:execute` | Template colonnes |
| POST | `/import` | `import:execute` | Upload CSV/Excel |

### POST /import — multipart/form-data

| Champ | Type | Description |
|---|---|---|
| `file` | File | `.csv`, `.xlsx`, `.xls` |
| `mapping` | JSON string (optionnel) | Mapping colonnes custom |

Colonnes template : `client_name`, `client_email`, `client_phone`, `external_code`, `invoice_reference`, `invoice_amount`, `invoice_issued_at`, `invoice_due_at`

---

## Équipe (admin)

| Méthode | Route | Permission | Description |
|---|---|---|---|
| GET | `/team` | `team:manage` | Liste users + permissions |
| PATCH | `/team` | `team:manage` | Modifier permissions alertes |

### PATCH /team — body

```json
{
  "userId": "uuid",
  "canReceiveAlerts": true,
  "canRelanceClients": false
}
```

---

## Cron (interne Vercel)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/cron/alerts` | `Bearer {CRON_SECRET}` | Moteur alertes J-7/J/J+7 |

Réponse :

```json
{ "processed": 1, "alerts": 3 }
```
