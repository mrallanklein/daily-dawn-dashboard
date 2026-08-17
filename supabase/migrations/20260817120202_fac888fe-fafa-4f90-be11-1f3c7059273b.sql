ALTER TABLE public.module_views DROP COLUMN IF EXISTS share_token;

DROP POLICY IF EXISTS "own project members" ON public.project_members;
CREATE POLICY "own project members" ON public.project_members
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.team_members m WHERE m.id = member_id AND m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "own tasks" ON public.tasks;
CREATE POLICY "own tasks" ON public.tasks
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (project_id IS NULL OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  AND (assignee_id IS NULL OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.id = assignee_id AND m.user_id = auth.uid()))
  AND (parent_task_id IS NULL OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = parent_task_id AND t.user_id = auth.uid()))
);