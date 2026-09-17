# Solvia — fonctionnalités de l'application

> Inventaire réalisé à partir du code source du projet. Il distingue les fonctions **opérationnelles** (interface ou API réellement branchée) de ce qui est **prévu par le modèle métier mais pas encore fini dans l'interface**.

## En une phrase

Solvia est une application web multi-entreprise de suivi de recouvrement pour PME : elle centralise les clients et les factures, suit les impayés, affecte les paiements, calcule un score de risque, aide à préparer les relances et alerte l'équipe aux échéances importantes.

## Parcours principal

```text
Connexion → import CSV/Excel ou création via API → clients + factures
          → suivi des échéances / impayés → score de risque
          → relance manuelle et brouillon IA → suivi des résultats
          → alertes internes à l'équipe
```

## Fonctionnalités accessibles dans l'interface

| Espace | Ce que l'utilisateur peut faire | État |
|---|---|---|
| Connexion | Se connecter avec email/mot de passe, Google ou GitHub ; se déconnecter | Opérationnel, sous réserve de la configuration Supabase des fournisseurs OAuth |
| Tableau de bord | Voir les compteurs de factures en retard, à venir, partiellement payées et payées ; consulter les prochaines échéances et les clients à risque | Opérationnel |
| Import | Télécharger des modèles CSV/XLSX, déposer ou choisir un CSV/XLS/XLSX, lancer l'import et consulter le bilan/liste des lignes en erreur | Opérationnel |
| Clients | Rechercher, créer, modifier, supprimer et consulter les débiteurs, leurs coordonnées, leur code, leurs factures, le reste dû et leur score de risque | Opérationnel |
| Factures | Créer, consulter, modifier et supprimer les factures ; accéder à leur fiche détaillée | Opérationnel |
| Fiche facture | Voir le client, les montants total/payé/restant, les dates, le statut et le risque client ; enregistrer un paiement et une relance | Opérationnel |
| Relances | Consulter l'historique des relances, leur canal, niveau, résultat, brouillon et date ; composer, générer et enregistrer une relance depuis une facture | Opérationnel |
| Scoring | Activer/désactiver des critères, modifier leur nom, métrique et poids, fixer le seuil de risque puis enregistrer | Opérationnel pour les rôles autorisés |
| Équipe | Consulter les membres et autoriser chacun à recevoir les alertes ou à gérer les relances | Opérationnel pour l'administrateur |
| IA / BYOK | Choisir OpenAI, Gemini, Anthropic ou Grok et enregistrer la clé de l'organisation | Opérationnel pour les rôles autorisés |

## Gestion des données de recouvrement

### Clients et débiteurs

- Création, lecture, modification et suppression disponibles via l'API.
- Chaque client peut comporter un code externe, identité/société, SIRET, email et téléphone.
- Les données personnelles du client sont chiffrées en base ; l'email est aussi haché afin de permettre la déduplication.
- À l'import, Solvia retrouve d'abord le client par code externe, sinon par email, et évite ainsi les doublons.
- Toutes les données métier sont isolées par organisation : un utilisateur ne travaille que dans sa PME.

### Factures et impayés

- Création, lecture, modification et suppression disponibles via l'API.
- Une facture contient une référence, un client, un montant, la date d'émission et la date d'échéance.
- Les statuts gérés sont : **à venir**, **en retard**, **payée**, **partiellement payée** et **annulée**.
- Le tableau de bord rassemble les compteurs par statut et les prochaines échéances.
- La fiche facture affiche le montant encaissé et le solde restant à recouvrer.

### Paiements

- L'API permet d'enregistrer un paiement avec date, montant, client et référence optionnelle.
- Un paiement est affecté automatiquement selon une règle **FIFO** : les factures ouvertes les plus anciennes sont réglées en premier.
- L'affectation met à jour les montants payés et les statuts des factures concernées, y compris les paiements partiels.
- La fiche facture affiche les paiements affectés à la facture.

## Import de données

- Formats pris en charge : **CSV**, **XLS** et **XLSX**.
- Import par glisser-déposer ou sélecteur de fichier.
- Modèles CSV et Excel téléchargeables directement depuis l'écran d'import.
- Colonnes standard : `client_name`, `client_email`, `client_phone`, `external_code`, `invoice_reference`, `invoice_amount`, `invoice_issued_at`, `invoice_due_at`.
- Un mapping de colonnes personnalisé est également pris en charge par l'API.
- Le rapport d'import indique les nouveaux clients, les clients existants, les factures créées et les erreurs ligne par ligne.

## Relances et intelligence artificielle

### Relances

- Le système métier gère les canaux **email**, **WhatsApp** et **téléphone**.
- Les niveaux disponibles sont : relance aimable, rappel 1, rappel 2 et mise en demeure.
- Pour chaque relance, le résultat peut être suivi : réponse reçue, promesse de paiement, à suivre, paiement reçu ou absence de réponse.
- L'API permet de créer, consulter et modifier les relances.
- L'interface présente l'historique, et la fiche facture permet de créer une relance, générer son brouillon IA, le sauvegarder puis la marquer comme envoyée manuellement.

### Génération IA (BYOK)

- L'organisation apporte sa propre clé API ; elle est chiffrée avant stockage.
- Fournisseurs pris en charge : **OpenAI**, **Google Gemini**, **Anthropic Claude** et **Grok/xAI**.
- Le service peut générer un brouillon de message de relance en français à partir des données de la facture/client et du niveau de relance.
- La V1 ne prévoit pas l'envoi automatique d'email ou WhatsApp au client : la relance est un enregistrement manuel et le message IA est un brouillon.

## Score de risque client

- Score déterministe normalisé de **0 à 100** — ce n'est pas un modèle de machine learning.
- Le seuil de déclenchement du risque est configurable par organisation (70 par défaut).
- Les métriques disponibles sont :
  - montant en retard ;
  - ancienneté maximale du retard ;
  - taux historique de retards ;
  - nombre de factures impayées ;
  - montant total d'exposition.
- Les critères peuvent être activés/désactivés et pondérés ; l'interface signale lorsque les poids actifs ne totalisent pas 100 %.
- Les résultats sont utilisés dans le tableau des clients, la fiche facture et la liste des clients prioritaires du tableau de bord.

## Alertes internes

- Moteur d'alertes pour les échéances à **J-7**, à échéance (**J**) et à **J+7** de retard.
- Les alertes sont adressées à l'équipe interne, jamais automatiquement au client.
- Canaux prévus : notification dans l'application, email (Resend) et WhatsApp (Twilio).
- L'administrateur choisit quels collaborateurs peuvent recevoir les alertes.
- Le cron Vercel exécute le moteur avec une protection par secret ; les événements sont idempotents pour éviter les doublons.

## Comptes, organisations et droits

- Authentification Supabase par email/mot de passe et OAuth Google/GitHub.
- Une API d'inscription crée en une opération l'organisation, le compte administrateur, la configuration de scoring par défaut et une trace d'audit.
- Rôles : **administrateur**, **dirigeant**, **comptable**, **commercial**.
- Les droits encadrent notamment les écritures sur les clients/factures/paiements, l'import, le scoring, l'IA, l'équipe et les relances.
- Un commercial peut gérer les relances uniquement si l'administrateur active son autorisation dédiée.
- Les opérations importantes (création/modification de facture ou client, paiement, import, configuration, etc.) sont tracées dans un journal d'audit.

## Sécurité et exploitation

- Application Next.js avec API REST, PostgreSQL via Supabase/Prisma et déploiement prévu sur Vercel.
- Isolation multi-tenant par `organizationId` dans les requêtes métier ; une politique RLS Supabase est également fournie comme couche complémentaire.
- Les clés IA, coordonnées et identités sensibles sont chiffrées avec AES-256-GCM.
- Validation des entrées avec Zod, contrôle des sessions et vérification des permissions sur les routes API.

## Éléments présents mais pas encore finalisés dans l'interface

Ces éléments ne doivent pas être présentés comme utilisables de bout en bout aujourd'hui :

- La recherche globale du bandeau n'est pas encore branchée à une recherche transversale.
- Le sélecteur de langue ne traduit pas encore l'interface.
- L'interface de liste des relances n'offre pas encore l'édition directe ; celle-ci se fait depuis la fiche facture.

## Hors périmètre V1

- Application mobile ou desktop native.
- Envoi automatique de relances aux clients.
- Scoring fondé sur du machine learning, fine-tuning ou classification automatique des réponses.
