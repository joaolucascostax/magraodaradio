-- Recreate missing count triggers
DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.bump_post_comment_count();

DROP TRIGGER IF EXISTS trg_post_reactions_counts ON public.post_reactions;
CREATE TRIGGER trg_post_reactions_counts
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.bump_post_reaction_counts();

DROP TRIGGER IF EXISTS trg_post_reactions_support ON public.post_reactions;
CREATE TRIGGER trg_post_reactions_support
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.bump_post_support_count();

DROP TRIGGER IF EXISTS trg_poll_votes_count ON public.poll_votes;
CREATE TRIGGER trg_poll_votes_count
AFTER INSERT OR DELETE ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.bump_vote_count();

DROP TRIGGER IF EXISTS trg_poll_votes_single ON public.poll_votes;
CREATE TRIGGER trg_poll_votes_single
BEFORE INSERT ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_choice_poll_vote();

DROP TRIGGER IF EXISTS trg_prefeitura_rating ON public.prefeitura_avaliacoes;
CREATE TRIGGER trg_prefeitura_rating
AFTER INSERT OR UPDATE OR DELETE ON public.prefeitura_avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.refresh_prefeitura_rating();

DROP TRIGGER IF EXISTS trg_apoiadores_stats ON public.apoiadores;
CREATE TRIGGER trg_apoiadores_stats
AFTER INSERT OR UPDATE OR DELETE ON public.apoiadores
FOR EACH ROW EXECUTE FUNCTION public.sync_apoiadores_stats();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_cpf ON public.profiles;
CREATE TRIGGER trg_profiles_cpf BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_validate_cpf();

DROP TRIGGER IF EXISTS trg_polls_updated_at ON public.polls;
CREATE TRIGGER trg_polls_updated_at BEFORE UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_prefeituras_updated_at ON public.prefeituras;
CREATE TRIGGER trg_prefeituras_updated_at BEFORE UPDATE ON public.prefeituras
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill existing counters
UPDATE public.posts p SET
  like_count = COALESCE((SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p.id AND r.tipo = 'like'), 0),
  dislike_count = COALESCE((SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p.id AND r.tipo = 'dislike'), 0),
  support_count = COALESCE((SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p.id AND r.tipo = 'like'), 0),
  comment_count = COALESCE((SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id AND c.is_hidden = false), 0);

UPDATE public.poll_options o SET
  vote_count = COALESCE((SELECT count(*) FROM public.poll_votes v WHERE v.option_id = o.id), 0);