# Vue d'ensemble

## Mission

**Solvia** aide les PME à piloter le recouvrement de créances sans logiciel comptable avancé :

- Suivre les échéances de paiement
- Identifier les impayés
- Prioriser les clients à risque (scoring déterministe)
- Automatiser les alertes internes (J-7, J, J+7)
- Générer des brouillons de relance via LLM (BYOK)

## URL de production

| Environnement | URL |
|---|---|
| Production | [https://solviaa.vercel.app](https://solviaa.vercel.app) |
| Local | `http://localhost:3000` |

## Périmètre MVP (V1)

| In scope | Hors scope |
|---|---|
| Import CSV/Excel | App mobile / desktop |
| CRUD clients, factures, paiements, relances | ML / LLM dans le score |
| Dashboard échéances | Classification auto des réponses clients |
| Cron alertes J-7 / J / J+7 | Fine-tuning modèle local |
| Scoring configurable (formule déterministe) | Envoi auto WhatsApp/email aux clients |
| Messages relance via LLM (BYOK org) | |

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Route Handlers Next.js (API stateless) |
| ORM | Prisma 6 + migrations versionnées |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth + RBAC applicatif |
| Hébergement | Vercel |
| Cron | Vercel Cron Jobs |
| Tests | Vitest |

## Modèle multi-tenant

- **1 PME = 1 organisation** (`Organization`)
- **1 utilisateur = 1 org max**
- Isolation stricte par `organizationId` sur toutes les tables métier

## Rôles utilisateurs

| Rôle | Description |
|---|---|
| `admin` | Gestion équipe, permissions alertes, config technique |
| `dirigeant` | Vue globale, scoring, config LLM |
| `comptable` | Saisie, import, factures, paiements |
| `commercial` | Relances clients (si autorisé) |

## Décisions produit clés

- **Paiements partiels** : allocation FIFO (factures les plus anciennes d'abord)
- **Relances V1** : enregistrement manuel + génération texte LLM (pas d'envoi auto client)
- **Alertes** : in-app + email + WhatsApp vers l'équipe interne uniquement
- **BYOK** : clé LLM au niveau organisation, chiffrée en base
- **Scoring** : critères configurables par dirigeant depuis un catalogue de métriques déterministes
