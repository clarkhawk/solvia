# Modules métier

Chaque module vit dans `src/modules/{nom}/` avec la structure :

```
types.ts          Contrats publics (DTO, input)
schemas.ts        Validation Zod
repository.ts     Accès Prisma (optionnel)
service.ts        Logique métier
__tests__/        Tests unitaires
```

---

## `clients/`

**Responsabilité :** CRUD clients, chiffrement PII, dédup import.

| Fichier | Rôle |
|---|---|
| `repository.ts` | Chiffre/déchiffre identity + contact, emailHash |
| `service.ts` | CRUD + audit + dédup (externalCode → emailHash) |

**Dédup import :** `externalCode` prioritaire, sinon hash email.

---

## `factures/`

**Responsabilité :** CRUD factures, calcul statut, dashboard KPIs.

| Fichier | Rôle |
|---|---|
| `status.ts` | `computeInvoiceStatus()` — pure function |
| `repository.ts` | Requêtes Prisma + filtres |
| `service.ts` | CRUD + transitions + `getDashboardSummary()` |

**Export public :** `InvoiceService.updateStatusFromPayment()` — appelé par `paiements/`.

---

## `paiements/`

**Responsabilité :** Création paiement + allocation FIFO.

| Fichier | Rôle |
|---|---|
| `allocation.service.ts` | `createAndAllocate()` — trie factures par `dueAt ASC` |

**Flux :**
1. Valide client
2. Récupère factures ouvertes (FIFO)
3. Crée `Payment` + `PaymentAllocation[]`
4. Délègue mise à jour statut à `factures/`

---

## `relances/`

**Responsabilité :** Relances manuelles + génération message LLM.

| Fichier | Rôle |
|---|---|
| `service.ts` | CRUD + `generateMessage()` via `ai-providers/` |

**V1 :** enregistrement + brouillon LLM. Pas d'envoi automatique au client.

---

## `scoring/` (extractible)

**Responsabilité :** Score de risque déterministe configurable.

| Fichier | Rôle |
|---|---|
| `types.ts` | `ScoringInput`, `ScoringResult`, `ScoringCriterion` |
| `metrics/index.ts` | Catalogue 5 métriques déterministes |
| `calculator.service.ts` | `compute()` — pure function, testable |
| `config.service.ts` | CRUD config org + `computeAllClients()` |

### Métriques disponibles

| metricType | Description |
|---|---|
| `montant_en_retard` | Somme impayée |
| `anciennete_retard` | Jours de retard max |
| `taux_retard_historique` | Ratio factures en retard / total |
| `nombre_factures_impayees` | Compteur |
| `montant_total_exposition` | Exposition totale |

Score normalisé 0–100. `isAtRisk = score >= riskThreshold`.

---

## `ai-providers/`

**Responsabilité :** Interface abstraite LLM + BYOK org.

| Fichier | Rôle |
|---|---|
| `types.ts` | Interface `AIProvider` |
| `factory.ts` | `AIProviderFactory.create(type, apiKey)` |
| `providers/*.ts` | OpenAI, Gemini, Anthropic, Grok |
| `config.service.ts` | Upsert config chiffrée + `generateMessage()` |
| `prompt.ts` | Construction prompt relance (FR) |

### Ajouter un 5e provider

1. Créer `providers/mon-provider.provider.ts` implémentant `AIProvider`
2. Ajouter case dans `factory.ts`
3. Ajouter enum `AIProviderType` dans Prisma + migration

---

## `alerts/`

**Responsabilité :** Moteur alertes + notifiers équipe interne.

| Fichier | Rôle |
|---|---|
| `engine.service.ts` | Détection J-7/J/J+7, upsert idempotent |
| `notifiers/in-app.notifier.ts` | Insert `in_app_notifications` |
| `notifiers/email.notifier.ts` | Resend API |
| `notifiers/whatsapp.notifier.ts` | Twilio WhatsApp |

**Destinataires :** users avec `canReceiveAlerts = true` + préférences canal.

---

## `import/`

**Responsabilité :** Parser CSV/Excel + import en base.

| Fichier | Rôle |
|---|---|
| `parser.service.ts` | PapaParse (CSV) + SheetJS (Excel) |
| `mapper.service.ts` | `findOrCreateByImport()` + création factures |

**Template fixe** + mapping optionnel via paramètre `mapping` JSON.

---

## Shared (`src/shared/`)

| Dossier | Rôle |
|---|---|
| `db/prisma.ts` | Singleton PrismaClient (pooler) |
| `auth/` | Supabase SSR, RBAC, `getAuthContext()` |
| `crypto/encryption.ts` | AES-256-GCM encrypt/decrypt PII |
| `audit/audit-log.ts` | `logAuditEvent()` |
| `api/handler.ts` | `withAuth()`, `jsonOk()` |
| `errors/app-error.ts` | Erreurs typées HTTP |
| `validation/common.ts` | Helpers Zod (pagination, uuid) |
