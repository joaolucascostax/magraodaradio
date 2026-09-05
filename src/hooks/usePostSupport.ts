import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type SupportState = { count: number; supported: boolean };

function countKey(postId: string) {
  return ['post-support-count', postId] as const;
}
function mineKey(postId: string, userId?: string) {
  return ['post-support-mine', postId, userId ?? 'anon'] as const;
}

/**
 * Fonte única de verdade para o botão de apoio (curtir).
 * - O total exibido vem do servidor: `serverCount` (feed/detalhe) ou o valor
 *   autoritativo devolvido pela função `toggle_post_support`.
 * - O clique é otimista, mas sempre corrigido pela resposta do banco, que
 *   recalcula o total a partir dos apoios reais (sem drift ou dupla contagem).
 */
export function usePostSupport(postId: string, serverCount: number) {
  const { user, openAuth } = useAuth();
  const qc = useQueryClient();

  const { data: mine } = useQuery({
    queryKey: mineKey(postId, user?.id),
    enabled: !!user && !!postId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user!.id)
        .eq('tipo', 'like')
        .maybeSingle();
      return !!data;
    },
  });

  // Total autoritativo pós-clique (quando existe, ganha do valor do feed).
  const { data: authoritativeCount } = useQuery<number | null>({
    queryKey: countKey(postId),
    enabled: !!postId,
    staleTime: Infinity,
    queryFn: async () => qc.getQueryData<number | null>(countKey(postId)) ?? null,
    initialData: null,
  });

  const count = Math.max(0, authoritativeCount ?? serverCount ?? 0);
  const supported = !!mine;

  const mutation = useMutation({
    mutationFn: async (): Promise<SupportState> => {
      const { data, error } = await supabase.rpc('toggle_post_support' as never, {
        _post_id: postId,
      } as never);
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data ?? null) as
        | { like_count: number; supported: boolean }
        | undefined;
      if (!row) throw new Error('resposta_invalida');
      return { count: row.like_count, supported: row.supported };
    },
    onMutate: () => {
      const prev: SupportState = { count, supported };
      qc.setQueryData(countKey(postId), Math.max(0, count + (supported ? -1 : 1)));
      qc.setQueryData(mineKey(postId, user?.id), !supported);
      return prev;
    },
    onError: (_e, _v, prev) => {
      if (prev) {
        qc.setQueryData(countKey(postId), prev.count);
        qc.setQueryData(mineKey(postId, user?.id), prev.supported);
      }
      toast.error('Não foi possível registrar seu apoio.');
    },
    onSuccess: (res) => {
      qc.setQueryData(countKey(postId), res.count);
      qc.setQueryData(mineKey(postId, user?.id), res.supported);
      qc.invalidateQueries({ queryKey: ['posts-feed'] });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['complaint', postId] });
      if (user) qc.invalidateQueries({ queryKey: ['my-supports', user.id] });
    },
  });

  function toggle() {
    if (!user) {
      openAuth();
      return;
    }
    if (mutation.isPending) return;
    mutation.mutate();
  }

  return { count, supported, toggle, pending: mutation.isPending };
}
