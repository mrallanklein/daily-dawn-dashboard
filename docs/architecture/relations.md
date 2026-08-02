# Relations et logique métier

## Graphe

```text
auth.users ──1:1── profiles
     └──1:N── spaces (slug = workspace)

spaces (workspace) ──1:N── projects
                    ──1:N── tasks
                    ──1:N── contacts
                    ──1:N── team_members

projects ──1:N── tasks            (tasks.project_id, ON DELETE CASCADE)
         ──1:N── project_comments
         ──N:N── team_members     (via project_members)
         ──N:1── contacts         (projects.contact_id, client)

tasks ──1:N── tasks               (parent_task_id, sous-tâches, 1 niveau)
      ──N:1── team_members        (assignee_id)

contacts ──1:N── contact_interactions
notes_items ──1:N── notes_items   (parent_id, sous-éléments)
```

## Règles métier

- **Cloisonnement** : toute lecture filtre sur `workspace` = espace actif. Aucune
  entité ne traverse deux espaces.
- **Hiérarchie de travail** : une tâche appartient à zéro ou un projet. Sans
  projet, elle reste une tâche libre visible dans les vues tâches, jamais dans le
  regroupement par projet.
- **Avancement projet** : `progress` est saisi manuellement ; il n'est pas dérivé
  des tâches. Le statut ne modifie pas `progress` automatiquement.
- **Ordre kanban** : `position` (entier croissant) au sein d'un même `status`.
  Un déplacement met à jour `status` et `position`.
- **Complétion** : une tâche terminée porte `completed_at`. Le champ est vidé au
  retour en cours.
- **« À planifier »** : projet sans `deadline` ni `work_date`.
- **Timeline / deadlines** : ordre chronologique sur `deadline` (projets) et
  `due_date` (tâches), les éléments sans date étant exclus.
- **Budget** : `budget_spent` ≤ `budget` n'est pas contraint en base ; le
  dépassement est une information affichable, pas une erreur.
- **Suppression** : supprimer un projet supprime ses tâches, commentaires et
  liens membres. Supprimer un contact conserve les projets (`contact_id` mis à
  `NULL`).

## Contraintes techniques

- Stack : TanStack Start v1 (React 19, Vite 7), rendu SSR, runtime serveur edge.
- État serveur : TanStack Query, une `queryOptions` par ressource, clé incluant
  l'espace actif ; invalidation après mutation plutôt que rechargement manuel.
- L'espace actif est un contexte client (`src/lib/workspace.tsx`) persisté en
  `localStorage`, il n'est pas dans l'URL.
- Les secrets et jetons Google ne sont lus que côté serveur (voir [api](./api.md)).