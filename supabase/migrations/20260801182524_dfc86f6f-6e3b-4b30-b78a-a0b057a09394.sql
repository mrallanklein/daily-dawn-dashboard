CREATE POLICY "Users read own avatar files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Users upload own avatar files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Users update own avatar files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Users delete own avatar files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());