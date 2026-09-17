# Configuration Supabase Auth

> **Tester sur production ?** Suivez plutôt [12-production-first-setup.md](./12-production-first-setup.md) — guide sans localhost pour [solviaa.vercel.app](https://solviaa.vercel.app).

## Principe

Solvia utilise **deux couches** :

1. **Supabase Auth** — session cookie (email/mot de passe)
2. **Table `users`** — rôle RBAC, org, permissions

Sans entrée dans `users` → `403 USER_NOT_FOUND` sur l'API.

---

## Supabase Dashboard

### Providers

[Authentication → Providers → Email](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/providers) — activer Email.

### Google OAuth

1. Dans Google Cloud Console, créer un client OAuth Web et ajouter l'URL de rappel fournie par Supabase :
   `https://bgrwqqwfxvrocxdzhhef.supabase.co/auth/v1/callback`.
2. Dans **Authentication → Providers → Google** de Supabase, activer Google et renseigner le Client ID et le Client Secret Google.
3. Conserver `https://solviaa.vercel.app/auth/callback` dans les Redirect URLs ci-dessous.

Le bouton Google est disponible sur `/login`. Après le retour OAuth, Solviaa vérifie que le compte Supabase est déjà rattaché à un utilisateur et à une organisation. Les comptes doivent donc être créés par l'inscription Solviaa ou une invitation avant leur première connexion Google ; cela évite toute session sans organisation ni permissions.

### URLs (production)

[Authentication → URL Configuration](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/url-configuration)

| Champ | Valeur |
|---|---|
| Site URL | `https://solviaa.vercel.app` |
| Redirect URLs | `https://solviaa.vercel.app/**` |

### Créer un user

[Authentication → Users](https://supabase.com/dashboard/project/bgrwqqwfxvrocxdzhhef/auth/users) → Add user → Auto Confirm → copier UUID.

### Lier à `users`

Voir SQL dans [12-production-first-setup.md](./12-production-first-setup.md#étape-6--lier-auth--table-users).

---

## Variables (Vercel Production)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://solviaa.vercel.app
```

Le code utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clé `anon` JWT), pas uniquement la publishable key.

---

## Code auth

| Route / Fichier | Rôle |
|---|---|
| `/login` | `signInWithPassword` |
| `/signup` | Création d'une organisation et de son premier administrateur |
| `/auth/callback` | Confirmation email / OAuth |
| `middleware.ts` | Garde session + redirect |
| `getAuthContext()` | Session → user DB → RBAC |

Voir aussi [08-auth-rbac.md](./08-auth-rbac.md).

## Inscription d'une nouvelle entreprise

L'utilisateur ouvre `/signup`, renseigne le nom de l'entreprise, son email, son mot de passe et sa devise, puis est redirigé vers `/login`.

La route crée le compte dans **Supabase Auth** et crée dans PostgreSQL l'organisation, le profil administrateur applicatif et la configuration de scoring initiale. Le mot de passe n'est jamais écrit dans la table applicative `users` : Supabase Auth le conserve de façon sécurisée.

`SUPABASE_SERVICE_ROLE_KEY` est obligatoire côté serveur pour ce parcours et ne doit jamais être exposée au navigateur.
