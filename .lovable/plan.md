

# Public Project View + Share Link

## Overview
Add a public shareable project page at `/p/{slug}` and a "Copy public link" button in admin. Requires two new columns on `projects`, a new page, and admin UI updates.

## 1. Database Migration

```sql
ALTER TABLE public.projects
  ADD COLUMN public_slug text UNIQUE,
  ADD COLUMN is_public boolean NOT NULL DEFAULT true;
```

A database trigger will auto-generate slugs on insert:

```sql
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
```

Then backfill existing projects:

```sql
UPDATE public.projects SET public_slug = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE public_slug IS NULL;
```

## 2. Create `src/pages/PublicProject.tsx`

A new read-only page that:
- Takes `slug` from URL params
- Queries `projects` by `public_slug` where `is_public = true`
- Fetches related `posts` and `questions` (read-only)
- Renders the same layout as `Project.tsx` but with all editing/auth UI stripped:
  - Project header (title, company, address)
  - `<ProjectStatusBar />` with `user={null}` (hides edit button)
  - Hitta hit, Praktiskt, Kontakt sections
  - Updates feed (images, text, time) — no delete menu, no post button
  - Questions list — no input form
- If project not found or `is_public = false`: show "Detta projekt är inte publikt."

## 3. Add Route in `src/App.tsx`

```tsx
import PublicProject from "./pages/PublicProject";
// ...
<Route path="/p/:slug" element={<PublicProject />} />
```

## 4. Update `src/pages/Admin.tsx`

- Add `public_slug` and `is_public` to the Project interface
- After saving a project, show a "📎 Kopiera publik länk" button next to the existing project link
- On click: copy `{origin}/p/{public_slug}` to clipboard, show toast "Publik länk kopierad"
- In the project list, add a small copy-link icon button per project

## Files Modified

1. **New migration** — `public_slug` column, `is_public` column, trigger, backfill
2. **New `src/pages/PublicProject.tsx`** — Read-only public view
3. **`src/App.tsx`** — Add `/p/:slug` route
4. **`src/pages/Admin.tsx`** — Copy public link button + updated types

