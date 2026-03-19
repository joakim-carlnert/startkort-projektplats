ALTER TABLE public.projects
  ADD COLUMN status_text text NOT NULL DEFAULT '',
  ADD COLUMN status_updated_at timestamptz,
  ADD COLUMN status_updated_by text NOT NULL DEFAULT '';