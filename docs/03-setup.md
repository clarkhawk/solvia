# Installation & configuration

## Prérequis

- Node.js 20+
- npm
- Compte [Supabase](https://supabase.com) (projet créé)
- Compte [Vercel](https://vercel.com) (pour déploiement)

## 1. Cloner et installer

```bash
git clone https://github.com/clarkhawk/solvia.git
cd solvia
npm install
```

## 2. Variables d'environnement

Copier le template :

```bash
cp .env.example .env.local
```

### Variables obligatoires

| Variable | Description | Où la trouver |
|---|---|---|
| `DATABASE_URL` | Connexion pooler (pgbouncer, port 6543) | Supabase → Settings → Database → Connection string → Transaction pooler |
| `DIRECT_URL` | Connexion directe (port 5432) | Supabase → Connection string → Session/Direct |
| `NEXT_PUBLIC_SUPABASE_URL` | URL API Supabase | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (cron, admin) | Supabase → Settings → API → service_role key |
| `ENCRYPTION_KEY` | Clé AES-256 (64 hex) | Générer : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CRON_SECRET` | Secret Bearer pour `/api/cron/alerts` | Générer aléatoirement |

### Variables optionnelles (alertes équipe)

| Variable | Description |
|---|---|
| `EMAIL_PROVIDER_API_KEY` | Clé API [Resend](https://resend.com) |
| `EMAIL_FROM` | Adresse expéditeur (ex. `alerts@votredomaine.com`) |
| `TWILIO_ACCOUNT_SID` | Compte Twilio |
| `TWILIO_AUTH_TOKEN` | Token Twilio |
| `TWILIO_WHATSAPP_FROM` | Numéro WhatsApp Twilio (format `whatsapp:+...`) |

### Exemple `.env.local` (structure)

```bash
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

ENCRYPTION_KEY="..."   # 64 caractères hex
CRON_SECRET="..."      # secret aléatoire
```

> **Attention :** l'URL Supabase ne doit **pas** contenir le placeholder `[project-ref]`. Utilisez la vraie ref du projet (ex. `bgrwqqwfxvrocxdzhhef`).

## 3. Créer la base de données

### Option A — Prisma (recommandé)

```bash
npx prisma migrate deploy
```

### Option B — Éditeur SQL Supabase

1. Supabase → **SQL Editor** → New query
2. Copier tout le contenu de `prisma/migrations/20250916000000_init/migration.sql`
3. **Run**

Voir [Base de données](./05-database.md) pour le détail du schéma.

## 4. Seed (données demo)

```bash
npm run db:seed
```

Crée une org « Demo PME », un admin, un client Acme et une facture en retard.

## 5. RLS Supabase (production)

Après migration, exécuter `supabase/rls.sql` dans l'éditeur SQL Supabase. Voir [Sécurité](./09-security.md).

## 6. Lancer en local

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Comportement middleware en dev

Si Supabase n'est pas configuré (URL invalide ou placeholder), le middleware **désactive l'auth en dev** avec un avertissement console — l'app reste accessible pour travailler sur l'UI.

## 7. Lier un utilisateur Supabase Auth

1. Supabase → **Authentication** → **Users** → Add user
2. Copier l'`id` UUID de l'utilisateur auth
3. Insérer dans la table `users` :

```sql
INSERT INTO users (id, organization_id, auth_user_id, role, email, can_receive_alerts, can_relance_clients, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',  -- org du seed
  'UUID-AUTH-SUPABASE-ICI',
  'admin',
  'votre@email.com',
  true,
  true,
  NOW(),
  NOW()
);
```

## 8. Tests

```bash
npm test          # une fois
npm run test:watch  # mode watch
```

## Dépannage courant

| Erreur | Cause | Solution |
|---|---|---|
| `Invalid supabaseUrl` | URL placeholder dans `.env.local` | Corriger `NEXT_PUBLIC_SUPABASE_URL` |
| `Prisma connection refused` | Mauvais mot de passe DB | Reset password Supabase → Database |
| `Permission denied` | User absent de table `users` | Lier auth_user_id (étape 7) |
| `ENCRYPTION_KEY required` | Variable manquante | Générer et ajouter dans `.env.local` |
