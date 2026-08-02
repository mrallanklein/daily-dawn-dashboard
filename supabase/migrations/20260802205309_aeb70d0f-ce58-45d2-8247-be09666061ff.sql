ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notion_page_id text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notion_page_id text;
ALTER TABLE public.project_milestones ADD COLUMN IF NOT EXISTS notion_page_id text;
CREATE UNIQUE INDEX IF NOT EXISTS projects_user_notion_page_idx ON public.projects(user_id, notion_page_id) WHERE notion_page_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tasks_user_notion_page_idx ON public.tasks(user_id, notion_page_id) WHERE notion_page_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS milestones_user_notion_page_idx ON public.project_milestones(user_id, notion_page_id) WHERE notion_page_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.notion_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL,
  target text NOT NULL,
  database_id text NOT NULL,
  database_title text NOT NULL,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notion_sync_runs TO authenticated;
GRANT ALL ON public.notion_sync_runs TO service_role;
ALTER TABLE public.notion_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own notion sync runs" ON public.notion_sync_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);