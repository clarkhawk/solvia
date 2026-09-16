# Auth & RBAC

## Flux d'authentification

```
1. User se connecte via Supabase Auth (email/password)
2. Supabase pose un cookie de session
3. middleware.ts → createServerClient → getUser()
   ├── Pas de session → redirect /login
   └── Session OK → accès dashboard
4. Route Handler API → getAuthContext()
   ├── Lookup users WHERE auth_user_id = session.user.id
   └── Retourne AuthContext (userId, organizationId, role, permissions)
5. requirePermission(ctx, "invoices:write")
```

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/middleware.ts` | Garde frontière : session + redirect |
| `src/shared/auth/supabase-server.ts` | Client Supabase SSR (cookies) |
| `src/shared/auth/get-auth-context.ts` | Résolution user DB ↔ auth Supabase |
| `src/shared/auth/rbac.ts` | Matrice permissions par rôle |
| `src/shared/auth/types.ts` | `AuthContext`, `Permission` |

## Rôles et permissions

### Matrice RBAC

| Permission | admin | dirigeant | comptable | commercial |
|---|---|---|---|---|
| `clients:read` | ✅ | ✅ | ✅ | ✅ |
| `clients:write` | ✅ | ✅ | ✅ | ❌ |
| `invoices:read` | ✅ | ✅ | ✅ | ✅ (lecture) |
| `invoices:write` | ✅ | ✅ | ✅ | ❌ |
| `payments:write` | ✅ | ✅ | ✅ | ❌ |
| `relances:read` | ✅ | ✅ | ✅ | ✅ |
| `relances:write` | ✅ | ✅ | ✅ | ⚠️ si `canRelanceClients` |
| `import:execute` | ✅ | ✅ | ✅ | ❌ |
| `scoring:configure` | ✅ | ✅ | ❌ | ❌ |
| `ai:configure` | ✅ | ✅ | ❌ | ❌ |
| `team:manage` | ✅ | ❌ | ❌ | ❌ |
| `alerts:receive` | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

⚠️ = nécessite le flag `canReceiveAlerts` ou `canRelanceClients` activé par l'admin.

### Permissions configurables (admin)

Via `PATCH /api/v1/team` ou page **Settings → Équipe** :

| Flag | Effet |
|---|---|
| `canReceiveAlerts` | Reçoit alertes J-7/J/J+7 (in-app, email, WhatsApp) |
| `canRelanceClients` | Commercial peut créer/modifier des relances |

Seul le rôle `admin` peut modifier ces flags.

## Middleware — comportement dev vs prod

```typescript
// src/middleware.ts
getSupabaseConfig() → null si URL invalide ou placeholder [project-ref]

// Dev  : bypass auth + warning console
// Prod : 500 "Supabase configuration missing"
```

## Lier Auth Supabase ↔ table users

Supabase Auth (`auth.users`) et table applicative `users` sont **liées manuellement** :

| Colonne `users` | Source |
|---|---|
| `auth_user_id` | UUID de `auth.users.id` |
| `organization_id` | Org PME |
| `role` | Enum Prisma `UserRole` |
| `email` | Email de connexion |

Sans entrée dans `users`, l'API retourne `403 USER_NOT_FOUND`.

## Supabase — URLs production

Configurer dans Supabase → Authentication → URL Configuration :

- **Site URL :** `https://solviaa.vercel.app`
- **Redirect URLs :** `https://solviaa.vercel.app/**`, `http://localhost:3000/**`

## RLS (Row Level Security)

Couche supplémentaire côté Supabase (`supabase/rls.sql`) :

- Policy : `organization_id = auth_org_id()`
- Nécessite claim JWT custom `org_id` (à enrichir via Supabase hook ou edge function)
- Defense-in-depth en plus du RBAC applicatif

## Cron — auth séparée

`/api/cron/alerts` bypass le middleware auth utilisateur.

Auth via header :
```
Authorization: Bearer {CRON_SECRET}
```

Utilise le service role Prisma (pas de session user).
