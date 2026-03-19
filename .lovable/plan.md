

# ProjectStatusBar Component

## Overview
A live status panel rendered below the project title showing the current operational situation. Editable by logged-in users, read-only for visitors. Requires three new columns on the `projects` table.

## 1. Database Migration

Add three columns to `projects`:

```sql
ALTER TABLE public.projects
  ADD COLUMN status_text text NOT NULL DEFAULT '',
  ADD COLUMN status_updated_at timestamptz,
  ADD COLUMN status_updated_by text NOT NULL DEFAULT '';
```

No new RLS policies needed — existing public read + authenticated update policies cover this.

## 2. Create `src/components/ProjectStatusBar.tsx`

**Props:** `projectId`, `statusText`, `statusUpdatedAt`, `statusUpdatedBy`, `user` (from useAuth), `onStatusUpdated` (callback to refresh parent state)

**View mode (default):**
- Card with soft grey background (`bg-muted`), rounded corners, generous padding
- Heading "Laget just nu" with colored dot indicator next to it:
  - Green: updated within 8h
  - Yellow: 8-24h
  - Red: >24h or never updated
- Status text in slightly larger font (`text-base`), good line height, max ~3 lines
- Meta row: "Senast uppdaterat av {name} . {formatted time}"
- If empty: show "Ingen lagesupp datering annu." + primary "Skriv forsta laget" button (auth only)
- If authenticated: show "Uppdatera laget" button

**Edit mode (dialog):**
- Modal with autofocus textarea (min-height 120px, max 300 chars)
- Placeholder: "Skriv kort vad som galler just nu i projektet..."
- "Spara" (primary) + "Avbryt" (secondary)
- On save: `supabase.from('projects').update({ status_text, status_updated_at: new Date().toISOString(), status_updated_by: user.email }).eq('id', projectId)`
- Optimistic UI update via `onStatusUpdated` callback, close dialog
- Brief green background flash animation on successful save

## 3. Update `src/pages/Project.tsx`

- Add `status_text`, `status_updated_at`, `status_updated_by` to Project interface
- Render `<ProjectStatusBar />` directly below the header section (before the first Separator)
- Pass current project data + user + reload callback

## 4. Update `src/pages/Admin.tsx`

- Add the new fields to the Project interface (for type consistency)

## Technical Details

- Uses existing `useAuth` hook, `Dialog`, `Textarea`, `Button` components
- Activity dot: simple `<span>` with conditional `bg-green-500`/`bg-yellow-500`/`bg-red-500` classes
- Success flash: CSS transition on background color using a brief state toggle
- Mobile-first: full-width card, thumb-reachable buttons, sticky save in dialog via `DialogFooter`

