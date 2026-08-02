# Tests automatiques

Lanceur : Vitest (`bun run test`, ou `bun run test:watch` en développement).
Configuration : `vitest.config.ts`, fichiers `src/**/*.test.ts`.

## Périmètre

Les tests couvrent les **règles métier pures**, celles dont une erreur passe
inaperçue à l'écran :

- `src/lib/project-risk.test.ts` : niveaux de risque projet, tâches bloquantes,
  dépendances, dépassement de budget, avancement en retard, dépenses par projet.
- `src/lib/dates.test.ts` : plages de jours et calculs d'échéance.

## Règles

- Une règle métier ajoutée dans `src/lib/*` arrive avec ses tests.
- Les tests n'appellent ni la base ni les API externes : les entrées sont
  construites en mémoire et la date « du jour » est toujours injectée.
- Les composants et les mutations ne sont pas testés unitairement ; leur logique
  est extraite dans des fonctions pures testables.