ALTER VIEW public.posts_public SET (security_invoker = on);
GRANT SELECT ON public.posts_public TO anon, authenticated;