
ALTER TABLE public.projects
  ADD COLUMN public_slug text UNIQUE,
  ADD COLUMN is_public boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION generate_public_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.public_slug IS NULL THEN
    NEW.public_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_public_slug
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION generate_public_slug();

UPDATE public.projects SET public_slug = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE public_slug IS NULL;
