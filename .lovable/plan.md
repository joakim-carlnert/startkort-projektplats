

# Restore Supabase Integration

Both pages currently use synchronous in-memory store functions from `src/lib/store.ts`. The database tables (`projects`, `posts`, `questions`) and storage bucket (`post-images`) already exist in Lovable Cloud. We need to rewire both pages to use the Supabase client.

## Changes

### 1. Rewrite `src/pages/Admin.tsx`
- Import `supabase` client and use `useEffect`/`useState` for async data fetching
- Replace `getProjects()` with `supabase.from('projects').select('*').order('created_at', { ascending: false })`
- Replace `addProject()` with `supabase.from('projects').insert(...)` 
- Replace `updateProject()` with `supabase.from('projects').update(...).eq('id', ...)`
- Cast JSONB `contacts` to the `Contact[]` type when reading

### 2. Rewrite `src/pages/Project.tsx`
- Import `supabase` client and use `useEffect`/`useState` for async data fetching
- Fetch project, posts, and questions from Supabase on mount
- Replace image handling: upload file to `post-images` storage bucket, get public URL
- Replace `addPost()` with `supabase.from('posts').insert(...)`
- Replace `addQuestion()` with `supabase.from('questions').insert(...)`
- Refetch posts/questions after inserts

### 3. Remove `src/lib/store.ts`
- Delete the in-memory store file entirely since it will no longer be used

### No database changes needed
- Tables `projects`, `posts`, `questions` and bucket `post-images` already exist with correct schemas and RLS policies

