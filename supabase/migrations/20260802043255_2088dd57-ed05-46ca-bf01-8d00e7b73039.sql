ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS onedrive_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS local_folder text;
CREATE INDEX IF NOT EXISTS tasks_workspace_position_idx ON public.tasks (workspace, position);