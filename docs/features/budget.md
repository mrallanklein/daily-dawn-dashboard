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

- Le budget prévu est saisi sur le projet ; le consommé est la somme des
  transactions de type dépense rattachées à ce projet
  ([architecture/data-model](../architecture/data-model.md)).
- Le bloc « Budget par projet » liste les projets ayant un budget, une dépense
  ou un revenu, triés par taux de consommation décroissant.
- Un dépassement est signalé comme information, il n'est pas bloquant.
- Un dépassement place aussi le projet en « À surveiller » côté projets
  ([features/projects](projects.md)).
- Les agrégats ne portent que sur l'espace actif.