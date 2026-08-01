ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS work_date date;
ALTER TABLE public.notes_items ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.notes_items(id) ON DELETE CASCADE;
ALTER TABLE public.notes_items ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alias_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alias_avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;