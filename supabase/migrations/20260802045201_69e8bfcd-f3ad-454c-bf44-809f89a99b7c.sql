-- Vues par module
CREATE TABLE public.module_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'allan',
  module text NOT NULL,
  name text NOT NULL DEFAULT 'Vue',
  emoji text NOT NULL DEFAULT '',
  layout text NOT NULL DEFAULT 'table',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  share_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_views TO authenticated;
GRANT ALL ON public.module_views TO service_role;
ALTER TABLE public.module_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own module views" ON public.module_views FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX module_views_lookup_idx ON public.module_views (user_id, workspace, module, position);
CREATE TRIGGER module_views_updated_at BEFORE UPDATE ON public.module_views
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Propriétés personnalisées
CREATE TABLE public.module_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'allan',
  module text NOT NULL,
  name text NOT NULL DEFAULT 'Propriété',
  type text NOT NULL DEFAULT 'text',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_properties TO authenticated;
GRANT ALL ON public.module_properties TO service_role;
ALTER TABLE public.module_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own module properties" ON public.module_properties FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX module_properties_lookup_idx ON public.module_properties (user_id, workspace, module, position);
CREATE TRIGGER module_properties_updated_at BEFORE UPDATE ON public.module_properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Valeurs des propriétés personnalisées, par élément
CREATE TABLE public.entry_props (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  entry_id text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module, entry_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_props TO authenticated;
GRANT ALL ON public.entry_props TO service_role;
ALTER TABLE public.entry_props ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entry props" ON public.entry_props FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER entry_props_updated_at BEFORE UPDATE ON public.entry_props
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pages personnalisées de l'espace
CREATE TABLE public.workspace_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'allan',
  name text NOT NULL DEFAULT 'Nouvelle page',
  emoji text NOT NULL DEFAULT '📄',
  kind text NOT NULL DEFAULT 'database',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_pages TO authenticated;
GRANT ALL ON public.workspace_pages TO service_role;
ALTER TABLE public.workspace_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workspace pages" ON public.workspace_pages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER workspace_pages_updated_at BEFORE UPDATE ON public.workspace_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Éléments des bases créées dans les pages
CREATE TABLE public.page_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.workspace_pages(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_entries TO authenticated;
GRANT ALL ON public.page_entries TO service_role;
ALTER TABLE public.page_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own page entries" ON public.page_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX page_entries_page_idx ON public.page_entries (page_id, position);
CREATE TRIGGER page_entries_updated_at BEFORE UPDATE ON public.page_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Historique des modifications
CREATE TABLE public.entry_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  entry_id text NOT NULL,
  author text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_history TO authenticated;
GRANT ALL ON public.entry_history TO service_role;
ALTER TABLE public.entry_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entry history" ON public.entry_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX entry_history_lookup_idx ON public.entry_history (user_id, module, entry_id, created_at DESC);

-- Emojis personnalisés
CREATE TABLE public.workspace_emojis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL DEFAULT 'allan',
  label text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_emojis TO authenticated;
GRANT ALL ON public.workspace_emojis TO service_role;
ALTER TABLE public.workspace_emojis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workspace emojis" ON public.workspace_emojis FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Préférences régionales et raccourcis
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS number_format text NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS week_start text NOT NULL DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'dd/MM/yyyy',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Paris',
  ADD COLUMN IF NOT EXISTS timezone_auto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_modules text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS module_order text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS module_labels jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shortcuts jsonb NOT NULL DEFAULT '{}'::jsonb;