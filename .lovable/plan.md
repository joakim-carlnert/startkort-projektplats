

# Remove Supabase — Use In-Memory State

## Changes

### 1. Create in-memory data store (`src/lib/store.ts`)
- Export a simple module with arrays for projects, posts, and questions
- Provide helper functions: `getProjects`, `addProject`, `updateProject`, `getProjectById`, `addPost`, `getPostsByProject`, `addQuestion`, `getQuestionsByProject`
- Use `crypto.randomUUID()` for IDs, `new Date().toISOString()` for timestamps
- For image uploads: convert files to object URLs (or data URLs) instead of uploading to storage

### 2. Rewrite `src/pages/Admin.tsx`
- Remove `supabase` import
- Import store functions instead
- Replace all async Supabase calls with synchronous store calls
- Keep all UI identical

### 3. Rewrite `src/pages/Project.tsx`
- Remove `supabase` import
- Import store functions instead
- Replace Supabase storage upload with `URL.createObjectURL(file)` for image preview/display
- Replace all DB queries with store function calls
- Keep all UI identical

### 4. Files to leave untouched
- `src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts` — these are auto-generated and cannot be edited. They will remain but won't be imported anywhere.
- `.env` — auto-generated, leave as-is

### 5. No other files reference Supabase
- `App.tsx`, utility files, and UI components have no Supabase imports

## Result
The app will function identically but with ephemeral in-memory data. Data resets on page refresh. No external backend required.

