

# QuickEventButton — Sticky Quick-Post Button

## Decision: Reuse `posts` table

The spec mentions a `project_events` table, but the existing `posts` table already stores the same data (project_id, image_url, text, created_at) and feeds the "Uppdateringar" section. Creating a separate table would require merging two data sources in the feed. Instead, we will post directly to `posts` — keeping one unified updates feed. The `role` field defaults to empty and `is_done` defaults to false, which works fine.

No database migration needed.

## Changes

### 1. Create `src/components/QuickEventButton.tsx`

A self-contained component that handles the full flow:

**Sticky button:**
- Fixed at bottom center of viewport, `pb-safe` for mobile safe area
- Full-width pill button (max-w-lg, rounded-full, primary bg, shadow-lg)
- Label: "➕ Uppdatera projekt"
- Only rendered when `user` is authenticated
- Bottom padding on the page container to prevent overlap

**On click:**
- Open a hidden `<input type="file" accept="image/*">` — standard mobile picker (camera + gallery)
- After file selected → open a Dialog with:
  - Image preview (object-cover, rounded)
  - Text input: placeholder "Skriv kort vad som hänt (valfritt)"
  - Two buttons: "Posta" (primary) / "Avbryt" (ghost)

**On Posta:**
- Upload image to `post-images` bucket
- Insert into `posts` table (project_id, image_url, text, role: '', is_done: false)
- Call `onPosted()` callback to refresh + optimistically prepend post
- Close dialog, show toast "Uppdatering publicerad"

**Props:** `projectId: string`, `user: User`, `onPosted: (post: Post) => void`

### 2. Update `src/pages/Project.tsx`

- Import and render `<QuickEventButton />` outside the scrollable container, only when user is logged in
- Add bottom padding (`pb-20`) to the content area so the sticky button does not overlap the last section
- Wire `onPosted` to optimistically prepend the new post to the `posts` state array

### Technical notes

- File input uses `accept="image/*"` without `capture` attribute (per project conventions — allows camera + gallery)
- Image upload path: `{projectId}/{uuid}.{ext}` in `post-images` bucket (same as existing flow)
- No new database tables, RLS policies, or migrations required

