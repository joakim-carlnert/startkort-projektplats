CREATE POLICY "Authenticated delete posts"
ON public.posts
FOR DELETE
TO authenticated
USING (true);