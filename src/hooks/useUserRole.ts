import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'editor' | 'user';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    enabled: !authLoading && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  return {
    roles,
    loading: authLoading || (!!user && isLoading),
    isAdmin: roles.includes('admin'),
    isEditor: roles.includes('editor') || roles.includes('admin'),
  };
}
