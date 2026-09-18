# Charger le jeu de démonstration

Le classeur `data/03_Impayes.xlsx` contient quatre feuilles : 60 clients, 250 factures,
200 paiements, 180 relances. L'écran d'import de l'application ne lit qu'une feuille à plat
(clients + facture sur la même ligne) et ne gère ni les paiements ni les relances : ce script
charge l'ensemble directement en base.

## Utilisation

```bash
npm run db:seed:demo -- --file data/03_Impayes.xlsx --email <e-mail d'un utilisateur de l'organisation>
```

Variantes :

```bash
# organisation désignée par son identifiant
npm run db:seed:demo -- --file data/03_Impayes.xlsx --org <organizationId>

# simulation : aucune écriture, affiche seulement ce qui serait fait
npm run db:seed:demo -- --file data/03_Impayes.xlsx --dry-run
```

Sans `--org` ni `--email`, le script utilise l'unique organisation présente ; s'il y en a
plusieurs, il les liste et s'arrête.

Le script lit `.env.local` (`DATABASE_URL`, `ENCRYPTION_KEY`) via `node --env-file`.

## Garanties

- **Idempotent** : les clients sont reconnus par leur code externe, les factures par leur
  référence, les paiements par leur identifiant, les relances par le quadruplet
  facture + canal + niveau + date. Relancer le script ne crée pas de doublon.
- **Ne supprime rien.** Aucune donnée existante n'est écrasée.
- **Cohérence des montants** : le fichier contient 54 factures dont les paiements cumulés
  dépassent le montant dû. Chaque imputation est plafonnée au reste dû, et le script indique
  combien de paiements ont été plafonnés.
- **Statuts recalculés** : `paid`, `partially_paid`, `overdue` ou `upcoming` selon le montant
  encaissé et la date d'échéance, comparées en UTC.

## Correspondances appliquées

| Fichier | Base |
|---|---|
| canal : Email, WhatsApp, Téléphone | `email`, `whatsapp`, `phone` |
| niveau : Rappel amical, Relance 1, Relance 2, Dernier rappel | `friendly`, `reminder_1`, `reminder_2`, `final_notice` |
| résultat : Réponse reçue, Promesse de paiement, À relancer, Paiement reçu, Sans réponse | `response_received`, `payment_promise`, `to_follow_up`, `payment_received`, `no_response` |
| mode de paiement (TMoney, Chèque, Espèces, Virement) | conservé dans `Payment.reference` |

Toute valeur inconnue fait ignorer la ligne, avec le motif affiché en fin d'exécution —
aucune donnée n'est inventée.
