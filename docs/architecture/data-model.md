# Modèle de données

Base PostgreSQL (Lovable Cloud). Schéma `public`, RLS activée sur toutes les
tables, `GRANT` explicites. Chaque table porte `user_id uuid` (propriétaire) et
les tables métier portent `workspace text` (slug de l'espace).

Aucune information de design ou d'interface ici.

## Identité et espaces

### `profiles`
`id` (= `auth.users.id`), `display_name`, `avatar_url`, `banner_url`,
`alias_name`, `alias_avatar_url`, `weather_city`, `weather_lat`, `weather_lon`,
`created_at`, `updated_at`.

### `spaces`
`id`, `user_id`, `slug` (unique par utilisateur, sert de clé `workspace`),
`name`, `tag`, `avatar_url`, `banner_url`, `weather_city`, `weather_lat`,
`weather_lon`, `mail_accounts text[]` (`primary` | `secondary`),
`calendar_ids text[]` (format `accountKey::calendarId`), `position`,
`created_at`, `updated_at`.

## Travail

### `projects`
`id`, `user_id`, `workspace`, `name`, `description`, `status`, `priority`,
`category`, `client`, `contact_id`, `progress` (0-100), `budget`,
`budget_spent`, `start_date`, `work_date`, `deadline`, `color`, `cover_url`,
`next_step`, `tags text[]`, `position` (ordre kanban), `created_at`,
`updated_at`, `onedrive_url`, `local_folder`, `depends_on_id` (projet devant
être terminé avant celui-ci, `NULL` si aucune dépendance).

`status` est contraint à la liste métier définie dans `src/lib/project-status.ts` :
`pas_commence`, `ecriture`, `en_cours`, `tournage`, `montage`, `validation`,
`publier`, `termine`, `archiver`. Cette liste est l'unique source de vérité des
statuts ; aucune duplication dans les composants.

### `tasks`
`id`, `user_id`, `workspace`, `project_id`, `parent_task_id` (sous-tâches),
`assignee_id`, `title`, `notes`, `status`, `priority`, `scheduled_date`
(date de travail), `due_date` (échéance), `start_time`, `duration_minutes`,
`completed_at`, `created_at`, `updated_at`.

### `notes_items` — todo libre

### `project_milestones` — jalons
`id`, `user_id`, `project_id`, `title`, `due_date`, `reached`, `position`,
`created_at`, `updated_at`. Dates clés d'un projet, affichées sur la
chronologie. Chaque personne ne voit et ne gère que ses propres jalons.

`id`, `user_id`, `content`, `checked`, `due_date`, `parent_id` (sous-éléments),
`position`, `created_at`, `updated_at`. Volontairement hors projet : capture
rapide non structurée.

### `project_comments`, `project_members`, `team_members`
- `project_comments` : `project_id`, `body`, horodatages.
- `project_members` : jointure `project_id` ↔ `member_id` (`team_members`).
- `team_members` : `workspace`, `full_name`, `email`, `role`, `permission`,
  `status`, `avatar_url`.

## Relation client

### `contacts`
`id`, `user_id`, `workspace`, `full_name`, `company`, `role`, `email`, `phone`,
`country`, `source`, `status`, `tags text[]`, `notes`, `last_contact_date`,
horodatages.

### `contact_interactions`
`contact_id`, `kind`, `body`, `occurred_on`, `created_at`.

## Règles transverses

- Toute nouvelle table métier : `user_id`, `workspace`, `created_at`,
  `updated_at`, RLS `auth.uid() = user_id`, `GRANT` pour `authenticated` et
  `service_role`.
- Les rôles applicatifs ne sont jamais stockés sur `profiles` (table dédiée).
- Les dates de planification (`scheduled_date`, `work_date`) sont distinctes des
  échéances (`due_date`, `deadline`) : la première dit *quand on travaille*, la
  seconde *quand c'est dû*.
- Aucune donnée Google (événement, message) n'est persistée en base : lecture à
  la demande via l'API (voir [sync](./sync.md)).