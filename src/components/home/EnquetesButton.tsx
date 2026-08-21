import { Link } from 'react-router-dom';
import { Vote, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPolls } from '@/lib/api';

export default function EnquetesButton() {
  const { data: polls = [] } = useQuery({ queryKey: ['polls'], queryFn: fetchPolls });
  const activeCount = polls.filter((p) => p.isActive).length;

  return (
    <Link
      to="/enquetes"
      className="group relative block bg-highlight text-foreground border-2 border-foreground px-4 py-4 sm:px-6 sm:py-5 shadow-brutal-lg transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_hsl(0_0%_7%)] active:translate-x-0 active:translate-y-0 active:shadow-brutal"
    >
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center bg-foreground text-highlight border-2 border-foreground">
          <Vote className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-display uppercase tracking-widest text-foreground/80">
            Sua voz, seu voto
          </p>
          <p className="text-lg sm:text-2xl font-display uppercase leading-none mt-0.5">
            Enquetes & Pesquisas
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {activeCount > 0 && (
            <span className="bg-foreground text-highlight px-2.5 py-1 text-[11px] sm:text-xs font-display border-2 border-foreground">
              {activeCount} ativa{activeCount !== 1 ? 's' : ''}
            </span>
          )}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}