# Synchronisation Notion

## Objectif
Importer et tenir à jour les **projets**, **tâches** et **jalons** depuis les bases de données Notion partagées avec l'intégration, sans doublon.

## Prérequis
- Connecteur Notion lié au projet (passerelle Lovable, clé `NOTION_API_KEY`).
- Chaque base Notion doit être partagée avec l'intégration : `···` → Connexions → Lovable.

## Parcours
1. Page **Projets** → bouton `Notion`.
2. Association base Notion ↔ module (Projets / Tâches / Jalons).
3. `Importer` par module ou `Tout synchroniser`.
4. Historique des 10 derniers imports affiché dans la fenêtre.

L'ordre projets → tâches → jalons est requis : les relations Notion sont résolues via `notion_page_id` des projets déjà importés (repli sur le nom du projet).

## Correspondance des champs
| Notion (alias reconnus) | Cible |
| --- | --- |
| Titre | `name` / `title` |
| Statut, Status, État | statut interne (`src/lib/notion-map.ts`) |
| Priorité, Priority | `basse` / `moyenne` / `haute` |
| Deadline, Échéance, Date limite | `deadline` / `due_date` |
| Début, Start | `start_date` |
| Planifié, Date | `work_date` / `scheduled_date` |
| Budget | `budget` |
| Progression | `progress` (0–100, ratio accepté) |
| Client, Catégorie, Tags, Description | champs homonymes |
| Relation Projet | `project_id` |
| Case cochée (Terminé, Fait) | statut terminé / `reached` |

## Idempotence & historique
- `notion_page_id` sur `projects`, `tasks`, `project_milestones` : insertion la première fois, mise à jour ensuite.
- Chaque exécution est journalisée dans `notion_sync_runs` (créés, mis à jour, ignorés, message).
- Les jalons sans projet lié ou sans date sont ignorés et signalés.

## Fichiers
- `src/lib/notion.server.ts` — accès passerelle Notion (recherche, pagination, propriétés).
- `src/lib/notion-map.ts` — normalisation statuts / priorités (couvert par `notion-map.test.ts`).
- `src/lib/notion-sync.server.ts` — mapping et écritures Supabase.
- `src/lib/notion-sync.functions.ts` — fonctions serveur authentifiées (`Zod`).
- `src/components/projects/notion-sync-dialog.tsx` — interface d'import.
