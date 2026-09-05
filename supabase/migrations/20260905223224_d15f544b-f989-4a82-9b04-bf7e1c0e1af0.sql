CREATE OR REPLACE FUNCTION public.toggle_post_support(_post_id uuid)
RETURNS TABLE(like_count integer, supported boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _exists boolean;
  _total integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.post_reactions
    WHERE post_id = _post_id AND user_id = _uid AND tipo = 'like'
  ) INTO _exists;

  IF _exists THEN
    DELETE FROM public.post_reactions
    WHERE post_id = _post_id AND user_id = _uid AND tipo = 'like';
  ELSE
    INSERT INTO public.post_reactions (post_id, user_id, tipo)
    VALUES (_post_id, _uid, 'like')
    ON CONFLICT (post_id, user_id) DO UPDATE SET tipo = 'like';
  END IF;

  SELECT count(*) INTO _total
  FROM public.post_reactions
  WHERE post_id = _post_id AND tipo = 'like';

  UPDATE public.posts
     SET like_count = _total,
         support_count = _total
   WHERE id = _post_id;

  RETURN QUERY SELECT _total, NOT _exists;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_post_support(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_post_support_counts(_post_ids uuid[])
RETURNS TABLE(post_id uuid, like_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, (SELECT count(*)::int FROM public.post_reactions r WHERE r.post_id = p.id AND r.tipo = 'like')
  FROM public.posts p
  WHERE p.id = ANY(_post_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_post_support_counts(uuid[]) TO anon, authenticated;