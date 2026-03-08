

# Add Authentication + Conditional Editing on Project Page

The project page is currently read-only for everyone. We need to add authentication so logged-in users can add updates, upload images, and ask questions, while anonymous visitors can only view.

## Changes

### 1. Add authentication pages
- Create `src/pages/Auth.tsx` with login/signup form using `supabase.auth.signInWithPassword` and `supabase.auth.signUp`
- Add `/auth` route in `App.tsx`

### 2. Add auth context
- Create `src/hooks/useAuth.ts` — listens to `supabase.auth.onAuthStateChange`, exposes `session`, `user`, `signOut`

### 3. Update `src/pages/Project.tsx`
- Import `useAuth` hook to detect logged-in state
- When authenticated, show:
  - "Ny uppdatering" button → dialog with image upload (to `post-images` bucket), role field, optional text, is_done toggle
  - "Ställ en fråga" button → input + submit for questions
- When not authenticated, these forms are hidden — page remains read-only
- Image upload uses file picker → `supabase.storage.from('post-images').upload(...)` → public URL

### 4. Protect Admin page
- In `src/pages/Admin.tsx`, check auth state; redirect to `/auth` if not logged in

### 5. Add sign-out button
- Show a small sign-out button in the header of Project and Admin pages when logged in

### No database changes needed
- Tables and RLS policies already allow public read and public insert
- Storage bucket `post-images` is already public

