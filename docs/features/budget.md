# Budget

Route `/budget`.

## Ce que l'utilisateur peut faire

- Consulter le budget prévu et le budget consommé par projet.
- Mettre à jour le montant consommé d'un projet.
- Voir les indicateurs agrégés de l'espace : budget total, consommé, restant,
  taux de consommation.
- Filtrer par statut de projet et par période.
- Exporter les données au format CSV.

## Règles fonctionnelles

- Les montants proviennent des champs budget des projets ; il n'existe pas de
  table de dépenses séparée à ce stade
  ([architecture/data-model](../architecture/data-model.md)).
- Un dépassement est signalé comme information, il n'est pas bloquant.
- Les agrégats ne portent que sur l'espace actif.