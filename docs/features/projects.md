# Projets

Route `/projets`. Unité centrale de l'application.

## Ce que l'utilisateur peut faire

- Créer un projet : nom, description, famille / catégorie, client, statut,
  priorité, dates (début, travail, échéance), budget, avancement, prochaine
  étape, étiquettes, visuel de couverture.
- Modifier et supprimer un projet.
- Choisir la vue : par statut (kanban), à planifier, timeline, table / liste,
  Gantt.
- Déplacer un projet entre statuts et le réordonner par glisser-déposer.
- Rechercher, filtrer et trier les projets.
- Ouvrir le détail d'un projet : tâches liées, commentaires, membres, budget.
- Ajouter un commentaire, affecter des membres, lier un contact client.
- Suivre l'avancement et le budget consommé.
- Définir des jalons (titre + date) et les marquer comme atteints.
- Déclarer une dépendance : le projet qui doit être terminé avant celui-ci.
- Lire les indicateurs de retard sur la liste, la chronologie et la fiche.

## Règles fonctionnelles

- Statuts métier : Pas commencé, Écriture, En cours, Tournage, Montage,
  Validation, Publier, Terminé, Archiver — liste unique définie côté code
  ([architecture/data-model](../architecture/data-model.md)).
- « À planifier » regroupe les projets sans échéance ni date de travail.
- La timeline classe par échéance croissante.
- Supprimer un projet supprime ses tâches et commentaires.
- L'avancement est saisi, jamais calculé automatiquement.

## Indicateurs de retard

Un seul calcul fait référence (`src/lib/project-risk.ts`), couvert par des
tests automatiques. Les projets terminés, publiés ou archivés ne sont jamais
signalés.

- **En retard** : échéance dépassée, au moins une tâche du projet dont
  l'échéance est dépassée, ou projet amont non terminé.
- **À surveiller** : budget dépassé, avancement inférieur de plus de 15 points
  au calendrier écoulé, ou échéance dans les 3 jours.
- Le premier motif s'affiche dans la pastille ; les autres apparaissent au
  survol et en entier dans la fiche projet.

## Jalons et dépendances

- Les jalons se saisissent dans la fiche projet et apparaissent en losange sur
  la chronologie : contour vide s'ils restent à atteindre, plein s'ils sont
  atteints.
- Une dépendance trace un lien de la fin du projet amont vers le début du
  projet aval : trait continu si l'amont est terminé, pointillé rouge sinon.
- La dépendance est informative : elle ne décale pas les dates
  automatiquement.