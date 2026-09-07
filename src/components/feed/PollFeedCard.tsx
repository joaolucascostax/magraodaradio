import { Link } from 'react-router-dom';
import { Vote, ArrowRight, BarChart3 } from 'lucide-react';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { isPollLive } from '@/lib/pollLifecycle';
import { cn } from '@/lib/utils';
import type { Poll } from '@/data/mockData';

export default function PollFeedCard({ poll }: { poll: Poll }) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const live = isPollLive(poll);

  return (
    <Link
      to={`/enquetes/${poll.id}`}
      className="group relative block border-b border-border bg-background px-5 py-4 transition-all hover:bg-muted/20 active:scale-[0.995]"
    >
      {/* Barra de destaque azul */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

      {/* Cabeçalho */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-sm bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground">
          Enquete
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />}
          {live ? 'AO VIVO' : 'Encerrada'}
          <span aria-hidden>•</span>
          {timeAgoBr(poll.createdAt)}
        </span>
      </div>

      {/* Pergunta */}
      <h3 className="font-display text-[15px] font-bold leading-tight tracking-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
        {poll.question}
      </h3>

      {/* Resultados compactos */}
      <div className="mt-3 space-y-2">
        {sorted.map((opt, i) => (
          <div key={opt.id} className="relative h-8 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
            <div
              className={cn(
                'absolute inset-y-0 left-0 transition-all duration-500',
                i === 0 && total > 0 ? 'bg-primary/15' : 'bg-muted/60'
              )}
              style={{ width: `${pct(opt.votes)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <span className="min-w-0 truncate text-xs font-semibold text-foreground">{opt.text}</span>
              <span className={cn('shrink-0 text-xs font-black tabular-nums', i === 0 ? 'text-primary' : 'text-muted-foreground')}>
                {pct(opt.votes)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          {total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background px-3 py-1.5 text-xs font-bold text-primary shadow-soft transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
          {live ? (
            <>
              <Vote className="h-3.5 w-3.5" /> Votar
            </>
          ) : (
            <>
              Ver resultado <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
