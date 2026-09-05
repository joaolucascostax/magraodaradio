GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon;

DROP POLICY IF EXISTS avatars_read_authenticated ON storage.objects;
CREATE POLICY avatars_read_public ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');