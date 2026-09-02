-- 1. Deixar de forçar Rio Verde em posts/polls (plataforma agora é estadual)
DROP TRIGGER IF EXISTS trg_rioverde_posts ON public.posts;
DROP TRIGGER IF EXISTS trg_rioverde_polls ON public.polls;

CREATE OR REPLACE FUNCTION public.default_uf_go()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    NEW.cidade := COALESCE(NULLIF(btrim(NEW.cidade), ''), 'Rio Verde');
    NEW.uf := COALESCE(NULLIF(btrim(NEW.uf), ''), 'GO');
  ELSIF TG_TABLE_NAME = 'polls' THEN
    NEW.cidade := NULLIF(btrim(NEW.cidade), '');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_default_uf_posts
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.default_uf_go();

CREATE TRIGGER trg_default_uf_polls
BEFORE INSERT OR UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.default_uf_go();

-- 2. Apoiadores
CREATE TABLE public.apoiadores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  cidade text NOT NULL,
  uf text NOT NULL DEFAULT 'GO',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apoiadores TO authenticated;
GRANT ALL ON public.apoiadores TO service_role;

ALTER TABLE public.apoiadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apoiadores_select_own" ON public.apoiadores
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "apoiadores_select_admin" ON public.apoiadores
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "apoiadores_insert_own" ON public.apoiadores
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "apoiadores_update_own" ON public.apoiadores
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "apoiadores_delete_own" ON public.apoiadores
FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_apoiadores_updated
BEFORE UPDATE ON public.apoiadores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_apoiadores_cidade ON public.apoiadores (cidade);

-- 3. Contagem pública agregada (sem dados pessoais)
CREATE VIEW public.apoiadores_por_cidade
WITH (security_invoker = off)
AS
SELECT cidade, uf, count(*)::bigint AS total
FROM public.apoiadores
GROUP BY cidade, uf;

GRANT SELECT ON public.apoiadores_por_cidade TO anon, authenticated, service_role;