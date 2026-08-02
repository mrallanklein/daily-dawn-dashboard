# Roadmap

## Livré

- Espaces multiples avec bascule et identité par espace.
- Accueil : hero, météo géolocalisée, agenda du jour, tâches, projets, deadlines,
  todo libre, mini-calendrier, aperçu mail.
- Calendrier Jour / Semaine / Mois / Année, création et édition d'événements,
  réponses aux invitations, événements multi-jours en bande continue.
- Projets : statuts métier, vues Statut / À planifier / Timeline / Table, kanban
  avec glisser-déposer, détail projet, commentaires, membres.
- Tâches : liste chronologique, regroupement par projet, kanban, sous-tâches.
- Mail multi-comptes (lecture, recherche, envoi) avec badges par compte.
- CRM contacts et interactions, Budget, Équipe.
- Thèmes clair / sombre avec bascule automatique jour / nuit.
- Palette de commandes globale.

## Suite

1. Import / synchronisation Notion consolidée (voir [architecture/sync](./architecture/sync.md)).
2. Budget : rapprochement dépenses / projets et export CSV complet.
3. Vue Gantt projets enrichie (dépendances, jalons).
4. Rappels et notifications sur deadlines.
5. Recherche globale unifiée sur toutes les entités.

Chaque élément livré doit être décrit dans `features/`, son comportement dans
`ux/`, ses données dans `architecture/`.