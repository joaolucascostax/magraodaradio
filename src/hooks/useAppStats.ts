import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppStats {
  totalComplaints: number;
  respondedComplaints: number;
  commitments: number;
  activeCitizens: number;
}

async function fetchStats(): Promise<AppStats> {
  // Todas as métricas em COUNT no servidor — sem trazer linhas pro cliente.
  const [total, responded, commitments, citizens] = await Promise.all([
    supabase
      .from('posts_public' as never)
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'denuncia')
      .eq('status', 'aprovado'),
    supabase
      .from('posts_public' as never)
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'denuncia')
      .in('status_denuncia', ['respondido', 'resolvido']),
    supabase
      .from('posts_public' as never)
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'denuncia')
      .not('promise_text', 'is', null),
    // Cidadãos ativos ≈ perfis com telefone verificado (proxy escalável).
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('phone_verified', true),
  ]);

  return {
    totalComplaints: total.count ?? 0,
    respondedComplaints: responded.count ?? 0,
    commitments: commitments.count ?? 0,
    activeCitizens: citizens.count ?? 0,
  };
}

export function useAppStats() {
  return useQuery({ queryKey: ['app-stats'], queryFn: fetchStats, staleTime: 60_000 });
}
