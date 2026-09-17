# Invitations et création des comptes

## Modèle d'accès

1. Une inscription sans jeton crée une organisation et son premier utilisateur `admin`.
2. L'admin ouvre **Équipe & Permissions**, choisit l'e-mail et le rôle d'un membre.
3. Solvia génère un lien à usage unique, valable sept jours, et l'envoie par e-mail si Resend est configuré.
4. Le destinataire ouvre ce lien et ne peut créer que le compte associé à l'e-mail et au rôle indiqués.

Les rôles pouvant être invités sont `dirigeant`, `comptable` et `commercial`. Le rôle `admin` n'est jamais attribué par l'API d'invitation.

## Sécurité et cycle de vie

- La base ne contient que le SHA-256 du jeton, jamais le lien brut.
- Créer une nouvelle invitation pour le même e-mail annule l'invitation encore en attente.
- Une invitation peut être révoquée par un admin, expire automatiquement, et est consommée de manière atomique.
- Le jeton ne donne aucun accès applicatif : il sert seulement à créer un compte Supabase et son profil Solvia.
- Si le profil Solvia ne peut pas être créé, le compte Supabase créé pendant la tentative est supprimé.

## Base de données et déploiement

La migration `20260917000000_add_invitations` crée la table `invitations` et enrichit l'audit. À appliquer avant le déploiement applicatif :

```bash
npm run db:migrate:deploy
```

Pour les liens envoyés, configurer `NEXT_PUBLIC_APP_URL`, `EMAIL_PROVIDER_API_KEY` et `EMAIL_FROM`. Sans fournisseur e-mail, l'admin peut copier le lien affiché une seule fois dans l'interface.

## API

- `GET /api/v1/invitations` : liste les invitations de l'organisation (admin).
- `POST /api/v1/invitations` : crée une invitation (admin).
- `DELETE /api/v1/invitations/:id` : révoque une invitation en attente (admin).
- `GET /api/v1/invitations/validate?token=…` : prépare le formulaire public.
- `POST /api/v1/auth/accept-invitation` : crée le compte à partir du jeton.
