import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Retorna o conjunto de user_ids com role admin.
 * Cache global (60s) — usado pra destacar "Magrão da Rádio" em toda UI pública.
 */
export function useAdminIds() {
  const { data } = useQuery({
    queryKey: ['admin-user-ids'],
    staleTime: 60_000,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (error) return new Set();
      return new Set((data ?? []).map((r) => r.user_id));
    },
  });
  return data ?? new Set<string>();
}
