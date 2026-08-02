# Pages dynamiques et sidebar éditable

## Ce que l'utilisateur peut faire

- Ajouter une page depuis la barre latérale : nom, emoji, type (page vide,
  base de données, template).
- Ouvrir une page créée à la route `/page/<id>`.
- Réordonner les entrées de la barre latérale par glisser-déposer.
- Renommer, masquer ou supprimer un module natif comme une page créée
  (menu contextuel).
- Écrire dans une page vide avec l'éditeur de blocs : texte, titres, listes
  (puces, numéros, cases à cocher), citation, code, image, séparateur.
- Utiliser le moteur de vues ([views](./views.md)) sur une page de type base
  de données, avec ses propres vues, propriétés, filtres et tris.

## Règles fonctionnelles

- Les pages, leur ordre, leurs libellés et leur visibilité sont enregistrés par
  espace de travail ([architecture/data-model](../architecture/data-model.md)).
- L'entrée « Stratégie » est réservée : visuellement désactivée, badge
  « Bientôt disponible ».
- Une page supprimée retire aussi ses entrées.
