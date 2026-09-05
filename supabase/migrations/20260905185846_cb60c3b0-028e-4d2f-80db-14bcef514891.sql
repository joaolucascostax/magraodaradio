CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT p.user_id, p.display_name, p.avatar_url, p.is_vereador
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO authenticated, anon;