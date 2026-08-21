import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useIsBanned() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['is-banned', user?.id],
    enabled: !authLoading && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select('motivo')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    banned: !!data,
    motivo: data?.motivo ?? null,
    loading: authLoading || (!!user && isLoading),
  };
}
