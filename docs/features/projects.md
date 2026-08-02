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

## Règles fonctionnelles

- Statuts métier : Pas commencé, Écriture, En cours, Tournage, Montage,
  Validation, Publier, Terminé, Archiver — liste unique définie côté code
  ([architecture/data-model](../architecture/data-model.md)).
- « À planifier » regroupe les projets sans échéance ni date de travail.
- La timeline classe par échéance croissante.
- Supprimer un projet supprime ses tâches et commentaires.
- L'avancement est saisi, jamais calculé automatiquement.