import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CidadeStat {
  cidade: string;
  uf: string;
  total: number;
}

/** Contagem pública de apoiadores por cidade (sem qualquer dado pessoal). */
export function useApoioStats() {
  const query = useQuery({
    queryKey: ['apoio-stats'],
    queryFn: async (): Promise<CidadeStat[]> => {
      const { data, error } = await supabase
        .from('apoiadores_stats')
        .select('cidade,uf,total')
        .order('total', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CidadeStat[];
    },
    staleTime: 60_000,
  });

  const cidades = query.data ?? [];
  const totalApoiadores = cidades.reduce((acc, c) => acc + (c.total ?? 0), 0);
  const totalCidades = cidades.filter((c) => (c.total ?? 0) > 0).length;

  return { cidades, totalApoiadores, totalCidades, loading: query.isLoading };
}

/** Apoio do usuário logado — declarar, trocar de cidade ou remover. */
export function useMeuApoio() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['meu-apoio', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apoiadores')
        .select('id,cidade,uf,created_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['meu-apoio'] });
    qc.invalidateQueries({ queryKey: ['apoio-stats'] });
  };

  const apoiar = useMutation({
    mutationFn: async (cidade: string) => {
      if (!user) throw new Error('Entre para apoiar.');
      const { error } = await supabase
        .from('apoiadores')
        .upsert({ user_id: user.id, cidade, uf: 'GO' }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remover = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Entre para gerenciar seu apoio.');
      const { error } = await supabase.from('apoiadores').delete().eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    apoio: query.data ?? null,
    isApoiador: !!query.data,
    loading: query.isLoading,
    apoiar,
    remover,
  };
}
