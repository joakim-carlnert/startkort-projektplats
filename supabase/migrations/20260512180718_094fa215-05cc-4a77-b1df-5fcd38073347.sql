INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read project-documents" ON storage.objects FOR SELECT USING (bucket_id = 'project-documents');
CREATE POLICY "Public insert project-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-documents');
CREATE POLICY "Public update project-documents" ON storage.objects FOR UPDATE USING (bucket_id = 'project-documents');
CREATE POLICY "Public delete project-documents" ON storage.objects FOR DELETE USING (bucket_id = 'project-documents');