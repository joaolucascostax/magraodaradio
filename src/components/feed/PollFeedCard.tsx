import { Link } from 'react-router-dom';
import { BarChart3, Vote, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { isPollLive, timeUntilClose } from '@/lib/pollLifecycle';
import type { Poll } from '@/data/mockData';

export default function PollFeedCard({ poll }: { poll: Poll }) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const live = isPollLive(poll);
  const countdown = live ? timeUntilClose(poll.endsAt) : null;

  return (
    <Link
      to={`/enquetes/${poll.id}`}
      className="block rounded-2xl border border-primary/15 bg-card p-4 shadow-soft transition-all hover:border-primary/25 hover:shadow-card my-3"
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge className="gap-1 border-0 bg-highlight/10 text-[10px] font-bold text-highlight">
          <Vote className="h-3 w-3" /> Enquete
        </Badge>
        <Badge
          className={`border-0 text-[10px] ${live ? 'gap-1 bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
        >
          {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />}
          {live ? 'AO VIVO' : 'Encerrada'}
        </Badge>
        {countdown && (
          <Badge variant="outline" className="gap-1 border-warning/40 text-[10px] text-warning">
            <Clock className="h-3 w-3" /> {countdown}
          </Badge>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">{timeAgoBr(poll.createdAt)}</span>
      </div>

      <h3 className="mb-3 break-words font-display text-base font-extrabold leading-snug tracking-tight">
        {poll.question}
      </h3>

      <div className="mb-3 space-y-2">
        {sorted.map((opt, i) => (
          <div key={opt.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                {opt.imageUrl ? (
                  <img
                    src={opt.imageUrl}
                    alt={opt.text}
                    className="h-7 w-7 shrink-0 rounded-full border border-border object-cover"
                    loading="lazy"
                  />
                ) : null}
                <span className="truncate text-[11px] font-medium text-foreground/80">{opt.text}</span>
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums">{pct(opt.votes)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${i === 0 && total > 0 ? 'bg-highlight' : 'bg-primary/40'}`}
                style={{ width: `${pct(opt.votes)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          {total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          {live ? 'Votar' : 'Ver resultado'} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
