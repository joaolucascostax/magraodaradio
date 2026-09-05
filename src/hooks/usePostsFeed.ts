import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PostBase = Database['public']['Tables']['posts']['Row'];
export type PostRow = PostBase & {
  author_is_vereador?: boolean;
  author_name?: string | null;
  author_avatar_url?: string | null;
};
export type PostTipo = Database['public']['Enums']['post_tipo'];
export type PostSelo = Database['public']['Enums']['post_selo'];

export type FeedTab = 'alta' | 'recentes';

interface Options {
  tab?: FeedTab;
  cidade?: string | null;
  prefeituraId?: string | null;
  tipo?: PostTipo | null;
  selo?: PostSelo | null;
  /** Só publicações oficiais do Magrão (Diário do Magrão). */
  official?: boolean | null;
  limit?: number;
  enabled?: boolean;
}

async function fetchPostsFeed(opts: Required<Omit<Options, 'enabled'>>): Promise<PostRow[]> {
  const { tab, cidade, prefeituraId, tipo, selo, official, limit } = opts;
  // Lê da view pública que oculta autor_id em posts anônimos.
  let q = supabase.from('posts_public' as never).select('*').eq('status', 'aprovado').limit(limit);
  if (prefeituraId) q = q.eq('prefeitura_id', prefeituraId);
  if (cidade) q = q.eq('cidade', cidade);
  if (official) q = q.eq('is_official', true);
  if (tipo) q = q.eq('tipo', tipo);
  if (selo) q = q.eq('selo', selo);
  if (tab === 'alta') {
    q = q.order('like_count', { ascending: false }).order('comment_count', { ascending: false });
  } else {
    q = q.order('created_at', { ascending: false });
  }
  const { data, error } = await q;
  if (error) throw error;
  const base = (data ?? []) as unknown as PostBase[];
  const authorIds = Array.from(new Set(base.map((p) => p.autor_id).filter(Boolean))) as string[];
  let profMap: Record<string, { is_vereador: boolean; display_name: string | null; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id,is_vereador,display_name,avatar_url')
      .in('user_id', authorIds);
    profMap = Object.fromEntries(
      (profs ?? []).map((p) => [
        p.user_id,
        { is_vereador: !!p.is_vereador, display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null },
      ]),
    );
  }
  return base.map((p) => {
    const prof = p.autor_id ? profMap[p.autor_id] : undefined;
    return {
      ...p,
      author_is_vereador: !!prof?.is_vereador,
      author_name: prof?.display_name ?? null,
      author_avatar_url: prof?.avatar_url ?? null,
    };
  });
}

export function usePostsFeed(opts: Options = {}) {
  const {
    tab = 'recentes',
    cidade = null,
    prefeituraId = null,
    tipo = null,
    selo = null,
    official = null,
    limit = 30,
    enabled = true,
  } = opts;

  const query = useQuery({
    queryKey: ['posts-feed', { tab, cidade, prefeituraId, tipo, selo, official, limit }],
    queryFn: () => fetchPostsFeed({ tab, cidade, prefeituraId, tipo, selo, official, limit }),
    enabled,
    staleTime: 30_000,
  });

  return {
    posts: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

