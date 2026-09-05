-- 1) Remove triggers duplicados (contagem dobrada)
DROP TRIGGER IF EXISTS trg_post_reactions_counts ON public.post_reactions;
DROP TRIGGER IF EXISTS trg_post_reactions_support ON public.post_reactions;
DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
DROP TRIGGER IF EXISTS trg_poll_votes_count ON public.poll_votes;
DROP TRIGGER IF EXISTS trg_poll_votes_single ON public.poll_votes;
DROP TRIGGER IF EXISTS trg_sync_apoiadores_stats ON public.apoiadores;

-- 2) Garante um único trigger de cada tipo
DROP TRIGGER IF EXISTS trg_bump_post_reaction_counts ON public.post_reactions;
CREATE TRIGGER trg_bump_post_reaction_counts
AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.bump_post_reaction_counts();

DROP TRIGGER IF EXISTS trg_bump_post_support_count ON public.post_reactions;
CREATE TRIGGER trg_bump_post_support_count
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.bump_post_support_count();

DROP TRIGGER IF EXISTS trg_bump_post_comment_count ON public.post_comments;
CREATE TRIGGER trg_bump_post_comment_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.bump_post_comment_count();

DROP TRIGGER IF EXISTS trg_bump_vote_count ON public.poll_votes;
CREATE TRIGGER trg_bump_vote_count
AFTER INSERT OR DELETE ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.bump_vote_count();

-- 3) Recalcula totais reais
UPDATE public.posts p SET
  like_count = c.likes,
  dislike_count = c.dislikes,
  support_count = c.likes,
  weekly_support_count = c.weekly
FROM (
  SELECT p2.id,
    (SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p2.id AND r.tipo = 'like') AS likes,
    (SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p2.id AND r.tipo = 'dislike') AS dislikes,
    (SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p2.id AND r.tipo = 'like' AND r.created_at > now() - interval '7 days') AS weekly
  FROM public.posts p2
) c
WHERE p.id = c.id;

UPDATE public.posts p SET comment_count = (
  SELECT count(*) FROM public.post_comments pc WHERE pc.post_id = p.id
);

UPDATE public.poll_options o SET vote_count = (
  SELECT count(*) FROM public.poll_votes v WHERE v.option_id = o.id
);