# Sécurité

## Principes non négociables

| Principe | Implémentation |
|---|---|
| Validation stricte inputs | Zod dans chaque module (`schemas.ts`) |
| Pas de SQL concaténé | Prisma uniquement |
| Secrets en env vars | Jamais en dur, jamais en logs |
| Chiffrement PII | AES-256-GCM (`src/shared/crypto/encryption.ts`) |
| Audit actions sensibles | `audit_logs` table |
| Clés LLM chiffrées | `ai_provider_configs.api_key_encrypted` |
| API stateless | JWT/cookies Supabase, pas de session mémoire |

## Chiffrement PII

### Algorithme

- **AES-256-GCM** côté application
- Clé : `ENCRYPTION_KEY` (32 bytes hex = 64 caractères)
- Format stocké : `IV (12) + AuthTag (16) + Ciphertext` → colonne `BYTEA`

### Données chiffrées

| Donnée | Table.Colonne |
|---|---|
| Identité client (nom, siret…) | `clients.identity_encrypted` |
| Contact client (email, tel…) | `clients.contact_encrypted` |
| Téléphone user | `users.phone_encrypted` |
| Clé API LLM | `ai_provider_configs.api_key_encrypted` |
| WhatsApp user | `notification_preferences.whatsapp_number_encrypted` |

### Recherche sans déchiffrement

`clients.email_hash` = SHA-256(email normalisé lowercase) — utilisé pour dédup import.

### Fichiers

```
src/shared/crypto/encryption.ts
  encryptPii(plaintext) → Uint8Array
  decryptPii(ciphertext) → string
  hashEmail(email) → hex SHA-256
```

## Journal d'audit

Table `audit_logs` — actions tracées :

| Action | Déclencheur |
|---|---|
| `login` | Connexion (à brancher) |
| `client_create`, `client_update` | CRUD clients |
| `invoice_create/update/delete` | CRUD factures |
| `payment_create` | Paiement + FIFO |
| `relance_create`, `relance_send` | Relances |
| `import_complete` | Import CSV/Excel |
| `scoring_update` | Config scoring |
| `ai_config_update` | Config BYOK |
| `user_permission_update` | Admin équipe |

Chaque entrée : `user_id`, `organization_id`, `entity_type`, `entity_id`, `metadata`, `created_at`.

## RLS Supabase

Fichier `supabase/rls.sql` :

1. `ENABLE ROW LEVEL SECURITY` sur toutes les tables métier
2. Fonction `auth_org_id()` extrait `org_id` du JWT
3. Policies `FOR ALL USING (organization_id = auth_org_id())`

**Prérequis :** enrichir le JWT Supabase avec claim `org_id` à la connexion.

## BYOK (Bring Your Own Key)

- Clé LLM stockée **chiffrée** en base (org level)
- Jamais retournée en clair par l'API (`hasApiKey: true` seulement)
- Validation clé avant stockage (`validateApiKey()` par provider)
- Jamais loguée

## Middleware & CORS

- Routes API protégées par session Supabase
- Cron protégé par `CRON_SECRET` (Bearer token)
- Pas de clés secrètes dans les variables `NEXT_PUBLIC_*`

## Checklist sécurité déploiement

- [ ] `ENCRYPTION_KEY` identique si même DB local/prod
- [ ] `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur (pas NEXT_PUBLIC)
- [ ] `.env.local` dans `.gitignore` (vérifié)
- [ ] RLS appliqué sur Supabase production
- [ ] `CRON_SECRET` fort et unique par environnement
- [ ] URLs redirect Supabase limitées à `solviaa.vercel.app` + localhost
- [ ] Rotation clés LLM possible via re-PUT `/api/v1/ai/config`

## Ce qui n'est PAS chiffré

| Donnée | Raison |
|---|---|
| Montants factures | Agrégats dashboard, scoring |
| Références factures | Recherche, affichage |
| Statuts, dates | Filtrage, cron |
| Rôle user | RBAC middleware |
| Critères scoring (JSON) | Config non sensible |
