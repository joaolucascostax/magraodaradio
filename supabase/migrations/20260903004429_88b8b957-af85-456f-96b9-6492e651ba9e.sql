CREATE OR REPLACE FUNCTION public.default_uf_go()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.uf IS NULL OR btrim(NEW.uf) = '' THEN
    NEW.uf := 'GO';
  END IF;
  IF NEW.cidade IS NOT NULL AND btrim(NEW.cidade) = '' THEN
    NEW.cidade := NULL;
  END IF;
  RETURN NEW;
END;
$$;