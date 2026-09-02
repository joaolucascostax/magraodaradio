DROP VIEW IF EXISTS public.apoiadores_por_cidade;

CREATE TABLE public.apoiadores_stats (
  cidade text NOT NULL,
  uf text NOT NULL DEFAULT 'GO',
  total integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (cidade, uf)
);

GRANT SELECT ON public.apoiadores_stats TO anon, authenticated;
GRANT ALL ON public.apoiadores_stats TO service_role;

ALTER TABLE public.apoiadores_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apoiadores_stats_public_read" ON public.apoiadores_stats
FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_apoiadores_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    INSERT INTO public.apoiadores_stats (cidade, uf, total, updated_at)
    VALUES (NEW.cidade, NEW.uf, 1, now())
    ON CONFLICT (cidade, uf) DO UPDATE
      SET total = public.apoiadores_stats.total + 1, updated_at = now();
  END IF;

  IF TG_OP IN ('DELETE', 'UPDATE') THEN
    UPDATE public.apoiadores_stats
      SET total = GREATEST(0, total - 1), updated_at = now()
      WHERE cidade = OLD.cidade AND uf = OLD.uf;
  END IF;

  RETURN NULL;
END $$;

REVOKE ALL ON FUNCTION public.sync_apoiadores_stats() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_apoiadores_stats
AFTER INSERT OR UPDATE OR DELETE ON public.apoiadores
FOR EACH ROW EXECUTE FUNCTION public.sync_apoiadores_stats();

INSERT INTO public.apoiadores_stats (cidade, uf, total)
SELECT cidade, uf, count(*)::int FROM public.apoiadores GROUP BY cidade, uf
ON CONFLICT (cidade, uf) DO UPDATE SET total = EXCLUDED.total;