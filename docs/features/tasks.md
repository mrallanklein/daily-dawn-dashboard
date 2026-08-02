# Tâches

Route `/taches`. Les tâches sont des sous-éléments de projets, ou des tâches
libres.

## Ce que l'utilisateur peut faire

- Créer une tâche, l'affecter à un projet, à un membre, la prioriser.
- Renseigner une date de travail, une échéance, une heure de début et une durée.
- Éditer un titre en ligne, cocher / décocher une tâche.
- Créer des sous-tâches sous une tâche.
- Choisir la vue : liste chronologique, regroupement par projet, tableau kanban.
- Déplacer une tâche entre colonnes de statut par glisser-déposer.
- Filtrer (projet, statut, priorité, période) et trier.
- Supprimer une tâche.

## Règles fonctionnelles

- Cocher une tâche renseigne sa date de complétion ; la décocher l'efface.
- Une tâche sans projet n'apparaît pas dans le regroupement par projet.
- La date de travail alimente le planning ; l'échéance alimente les timelines de
  deadlines ([architecture/relations](../architecture/relations.md)).
- Les sous-tâches suivent le projet et l'espace de leur parent.