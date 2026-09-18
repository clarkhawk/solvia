# UI & Design

## Production

**URL :** [https://solviaa.vercel.app](https://solviaa.vercel.app)

## Inspiration : template Finly

Les maquettes de référence sont dans `src/components/templates/` :

| Fichier | Contenu |
|---|---|
| `66f929125acd698c229c5938c0b9724e.jpg` | Dashboard Finly — **mode clair** |
| `b6e757a36ab4cd0e2688117c2596ea53.jpg` | Dashboard Finly — variante |
| `edae459d270dd9c9420b96258ae1e753.jpg` | Dashboard Finly — **mode sombre** |

### Éléments Finly à transposer pour Solvia

| Composant Finly | Équivalent Solvia |
|---|---|
| Sidebar + logo | Nav : Dashboard, Clients, Factures, Relances, Scoring, Settings |
| Boutons `+ Add income/expense` | `+ Import CSV`, `+ Facture`, `+ Relance` |
| KPI cards (Balance, Salary, Savings) | À venir, En retard, Partielles, Payées |
| Graphique Income vs Expenses | Échéances vs encaissements (30j) |
| Bloc « Your cards » | Top clients à risque (score) |
| Bloc « Goals » | Relances actives par niveau |
| Recent Transaction (panneau droit) | Dernières relances / paiements |
| Donut Expense categories | Répartition impayés par statut |
| Header (Bonjour, search, date, theme) | Header Solvia + notifications in-app |
| Toggle light/dark | Theme switch (à implémenter) |

## Assets marque Solvia

Dossier `src/components/Logo solvia/` :

| Fichier | Usage |
|---|---|
| `logo-horizontal.svg` | Logo clair (sidebar, header) |
| `logo-horizontal-dark.svg` | Logo mode sombre |
| `icon.svg` | Icône seule |
| `icon-1024.png` | Favicon / app icon |
| `apercu.png` | Aperçu visuel marque |

## Stack UI actuelle

| Technologie | Rôle |
|---|---|
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Composants (`src/components/ui/`) |
| Radix UI | Primitives accessibles |
| Lucide React | Icônes (à généraliser) |
| CVA | Variants composants (Button, Badge) |

### Composants existants

```
src/components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── badge.tsx
├── dashboard/
│   ├── sidebar.tsx       Nav latérale (basique)
│   └── status-badge.tsx  Badges statut facture
```

## Charte couleurs proposée

| Token | Usage Solvia | Valeur actuelle |
|---|---|---|
| `primary` | Actions, liens | `#2563eb` (bleu) |
| `destructive` | En retard, alertes | `#ef4444` (rouge) |
| `success` | Payée, promesse | `#16a34a` (vert) |
| `warning` | Partiellement payée | `#ca8a04` (jaune) |
| `secondary` | À venir, neutre | `#f1f5f9` (gris clair) |

Variables CSS dans `src/app/globals.css` (`@theme inline`).

## Badges statut facture

Composant `StatusBadge` (`src/components/dashboard/status-badge.tsx`) :

| Statut | Label FR | Variant |
|---|---|---|
| `upcoming` | À venir | secondary |
| `overdue` | En retard | destructive |
| `paid` | Payée | success |
| `partially_paid` | Partielle | warning |
| `cancelled` | Annulée | secondary |

## Layout dashboard actuel

```
src/app/(dashboard)/layout.tsx
├── Sidebar (fixed, dark slate-950)
└── Main content (bg-slate-50, padding)
```

Pages :
- `/` — Dashboard KPIs + échéances + clients à risque
- `/clients` — Table clients
- `/invoices` — Table factures
- `/relances` — Cards relances
- `/scoring` — Config critères (dirigeant)
- `/settings/team` — Permissions admin
- `/settings/ai-provider` — BYOK LLM

## Roadmap UI (Finly-like)

### Phase 1 — Shell
- [ ] Header avec greeting, search, date, theme toggle, avatar
- [ ] Sidebar avec logo Solvia (SVG) + actions rapides
- [ ] Light/dark mode toggle

### Phase 2 — Dashboard
- [ ] KPI cards style Finly (rounded-2xl, ombres)
- [ ] Graphique échéances (Recharts ou similar)
- [ ] Panneau droit activité récente
- [ ] Donut répartition impayés

### Phase 3 — Pages métier
- [ ] Tables avec filtres, tri, pagination
- [ ] Fiches client (score, factures, relances)
- [ ] Modal création facture/relance
- [ ] Page import drag & drop

### Phase 4 — Polish
- [ ] Responsive mobile
- [ ] Notifications in-app (badge header)
- [ ] Empty states illustrés

## RBAC visuel

Masquer/afficher selon rôle :

| Élément UI | Visible si |
|---|---|
| Bouton Import | `import:execute` |
| Config Scoring | `scoring:configure` |
| Settings IA | `ai:configure` |
| Settings Équipe | `team:manage` |
| Bouton + Relance (commercial) | `canRelanceClients` |

## Références

- Templates : `src/components/templates/*.jpg`
- Logos : `src/components/Logo solvia/`
- Styles globaux : `src/app/globals.css`
- Composants : `src/components/`
