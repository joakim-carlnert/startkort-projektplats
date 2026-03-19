

# Delete Post + Undo After Posting

## Database Changes

**Migration:** Add DELETE RLS policy on `posts` table so authenticated users can delete posts:

```sql
CREATE POLICY "Authenticated delete posts"
ON public.posts
FOR DELETE
TO authenticated
USING (true);
```

No roles/permissions table exists, so all authenticated users can delete any post (matching the existing simple permission model). The spec mentions `created_by` checks, but the `posts` table has no `created_by` column — adding one would be a bigger change. For now, all logged-in users can delete (consistent with how all logged-in users can post).

## Component Changes

### 1. Update post rendering in `src/pages/Project.tsx`

For each post card in the updates feed, when user is authenticated:
- Add a "⋯" (`MoreVertical` icon) button in the top-right corner of each post
- Use `DropdownMenu` with a single item: "Ta bort uppdatering" (destructive styling)
- On click → open an `AlertDialog` confirmation modal with the specified Swedish copy
- On confirm:
  - Optimistically remove post from state
  - Delete row from `posts` table
  - Extract storage path from `image_url` and delete from `post-images` bucket
  - Show toast: "Uppdatering borttagen"

### 2. Undo after posting via `QuickEventButton`

After a successful post in `QuickEventButton`:
- Instead of a plain success toast, show a toast with an "Ångra" action button
- Toast visible for ~5 seconds
- If user presses "Ångra":
  - Delete the newly created post from `posts` table
  - Delete image from storage
  - Call a new `onDeleted(postId)` callback to remove from parent state
  - Show toast: "Uppdatering ångrad"

### 3. Update `src/pages/Project.tsx` parent wiring

- Add a `handleDeletePost` helper that removes a post by ID from state
- Pass it as `onDeleted` to `QuickEventButton`
- Use the same helper for the manual delete flow from the "⋯" menu

## Files Modified

1. **New migration** — DELETE policy on `posts`
2. **`src/pages/Project.tsx`** — Add ⋯ menu + AlertDialog per post, `handleDeletePost` helper
3. **`src/components/QuickEventButton.tsx`** — Add `onDeleted` prop, undo toast with action button

## Technical Notes

- Storage path extraction: parse the public URL to get the path after `/post-images/`
- Uses existing `DropdownMenu`, `AlertDialog` components from shadcn
- No animation library needed — CSS `transition` on height for collapse effect

