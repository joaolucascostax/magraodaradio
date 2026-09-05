CREATE TABLE public.poll_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_display_name text NOT NULL,
  is_anonimo boolean NOT NULL DEFAULT false,
  conteudo text NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX poll_comments_poll_idx ON public.poll_comments (poll_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_comments TO authenticated;
GRANT SELECT ON public.poll_comments TO anon;
GRANT ALL ON public.poll_comments TO service_role;

ALTER TABLE public.poll_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_comments_public_read" ON public.poll_comments
  FOR SELECT TO anon, authenticated
  USING (is_hidden = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "poll_comments_insert_own" ON public.poll_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = autor_id AND NOT public.is_banned(auth.uid()));

CREATE POLICY "poll_comments_delete_own" ON public.poll_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = autor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "poll_comments_admin_update" ON public.poll_comments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));