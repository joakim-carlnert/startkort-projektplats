ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS timeline text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS access_info text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;