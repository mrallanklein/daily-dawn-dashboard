CREATE TABLE IF NOT EXISTS public.spaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  tag text NOT NULL DEFAULT '',
  avatar_url text,
  banner_url text,
  weather_city text NOT NULL DEFAULT 'Toulouse',
  mail_accounts text[] NOT NULL DEFAULT '{}',
  calendar_ids text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces TO authenticated;
GRANT ALL ON public.spaces TO service_role;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own spaces" ON public.spaces;
CREATE POLICY "Users manage their own spaces" ON public.spaces FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.spaces (user_id, slug, name, tag, avatar_url, banner_url, weather_city, position)
SELECT p.id, 'allan', COALESCE(NULLIF(p.display_name, ''), 'Allan Klein'), 'Freelance', p.avatar_url, p.banner_url, COALESCE(NULLIF(p.weather_city, ''), 'Toulouse'), 0
FROM public.profiles p
ON CONFLICT (user_id, slug) DO NOTHING;

INSERT INTO public.spaces (user_id, slug, name, tag, avatar_url, banner_url, weather_city, position)
SELECT p.id, 'alias', COALESCE(NULLIF(p.alias_name, ''), 'ALIAS'), 'Entreprise', p.alias_avatar_url, p.banner_url, COALESCE(NULLIF(p.weather_city, ''), 'Toulouse'), 1
FROM public.profiles p
ON CONFLICT (user_id, slug) DO NOTHING;