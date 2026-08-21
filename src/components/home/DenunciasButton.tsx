import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Botão-atalho para o feed unificado de publicações.
 * Denúncias, notícias, projetos, enquetes e discussões: tudo é publicação.
 */
export default function DenunciasButton() {
  const { data: activeCount = 0 } = useQuery({
    queryKey: ['posts-active-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('posts_public' as never)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aprovado');
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  return (
    <Link
      to="/reclamacoes"
      className="group relative block bg-destructive text-destructive-foreground border-2 border-foreground px-4 py-4 sm:px-6 sm:py-5 shadow-brutal-lg transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_hsl(0_0%_7%)] active:translate-x-0 active:translate-y-0 active:shadow-brutal"
    >
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center bg-foreground text-highlight border-2 border-foreground">
          <Flame className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-display uppercase tracking-widest text-destructive-foreground/80">
            O que tá pegando fogo
          </p>
          <p className="text-lg sm:text-2xl font-display uppercase text-destructive-foreground leading-none mt-0.5">
            Publicações do povo
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeCount > 0 && (
            <span className="bg-foreground text-highlight px-2.5 py-1 text-[11px] sm:text-xs font-display border-2 border-foreground">
              {activeCount} no ar
            </span>
          )}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
