-- Profil (workspace) sur les tables existantes
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'allan';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'allan';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'allan';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_id uuid;

-- Transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'allan',
  occurred_on date NOT NULL DEFAULT current_date,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Divers',
  amount numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'depense',
  status text NOT NULL DEFAULT 'paye',
  invoice_number text,
  invoice_url text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Membres d'équipe
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'alias',
  full_name text NOT NULL,
  email text,
  role text,
  permission text NOT NULL DEFAULT 'membre',
  status text NOT NULL DEFAULT 'actif',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own team members" ON public.team_members FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Affectations projet <-> membre
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project members" ON public.project_members FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Commentaires projet
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_comments TO authenticated;
GRANT ALL ON public.project_comments TO service_role;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project comments" ON public.project_comments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER project_comments_updated_at BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Interactions CRM
CREATE TABLE public.contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  body text NOT NULL,
  occurred_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_interactions TO authenticated;
GRANT ALL ON public.contact_interactions TO service_role;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contact interactions" ON public.contact_interactions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);