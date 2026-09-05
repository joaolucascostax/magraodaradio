import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Vote, ArrowRight, Calendar, CheckCircle2, Plus, ListChecks, Clock, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminBadge from '@/components/AdminBadge';
import { fetchPolls, fetchUserVotes } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminIds } from '@/hooks/useAdminIds';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { isPollLive, timeUntilClose, formatEndedAt } from '@/lib/pollLifecycle';
import type { Poll } from '@/data/mockData';
import { PollCardSkeleton } from '@/components/ui/skeletons';

function PollCard({ poll, voted, byAdmin }: { poll: Poll; voted: boolean; byAdmin: boolean }) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes);
  const top1 = sorted[0];
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const live = isPollLive(poll);
  const countdown = live ? timeUntilClose(poll.endsAt) : null;
  const endedLabel = !live ? formatEndedAt(poll.endsAt) : null;

  return (
    <Link
      to={`/enquetes/${poll.id}`}
      className={`group relative flex flex-col rounded-2xl border bg-card shadow-card transition-all overflow-hidden hover:-translate-y-0.5 hover:shadow-card-hover ${
        byAdmin ? 'ring-1 ring-accent/50 border-accent/60' : 'border-border hover:border-primary/40'
      }`}
    >
      {poll.coverUrl && (
        <div className="h-32 sm:h-40 w-full overflow-hidden">
          <img src={poll.coverUrl} alt="" loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="mb-3 flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-highlight/10 text-highlight border-0 font-bold text-[10px] gap-1">
            <Vote className="h-3 w-3" /> Enquete
          </Badge>
          <Badge className={`border-0 text-[10px] ${live ? 'bg-success/10 text-success gap-1' : 'bg-muted text-muted-foreground'}`}>
            {live && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
            {live ? 'AO VIVO' : 'Encerrada'}
          </Badge>
          {countdown && (
            <Badge variant="outline" className="text-[10px] gap-1 border-warning/40 text-warning">
              <Clock className="h-3 w-3" /> {countdown}
            </Badge>
          )}
          {poll.allowMultiple && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ListChecks className="h-3 w-3" /> Múltipla
            </Badge>
          )}
          {voted && (
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" /> Você votou
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {timeAgoBr(poll.createdAt)}
          </span>
        </div>

        {byAdmin && (
          <div className="mb-2"><AdminBadge /></div>
        )}

        <h3 className="mb-4 font-display font-extrabold text-foreground text-base sm:text-lg leading-snug break-words tracking-tight">
          {poll.question}
        </h3>

        {poll.options.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {sorted.slice(0, 3).map((opt, i) => (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-xl border ${
                  i === 0 && total > 0 ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    i === 0 && total > 0 ? 'bg-highlight/20' : 'bg-muted'
                  }`}
                  style={{ width: `${pct(opt.votes)}%` }}
                />
                <div className="relative flex items-center gap-2.5 p-2">
                  {opt.imageUrl ? (
                    <img src={opt.imageUrl} alt="" loading="lazy"
                      className={`h-8 w-8 shrink-0 rounded-full border border-background object-cover ${i === 0 && total > 0 ? '' : 'grayscale opacity-70'}`} />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-extrabold text-muted-foreground">
                      {opt.text.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-foreground/85">{opt.text}</span>
                  <span className="shrink-0 font-display text-sm font-extrabold tabular-nums text-foreground">{pct(opt.votes)}%</span>
                </div>
              </div>
            ))}
            {sorted.length > 3 && (
              <p className="pl-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                +{sorted.length - 3} outras opções
              </p>
            )}
          </div>
        )}


        {!live && top1 && total > 0 && (
          <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-highlight/10 px-2.5 py-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5 text-highlight shrink-0" />
            <span className="font-semibold text-foreground truncate">Vencedor: {top1.text}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <BarChart3 className="h-3.5 w-3.5" />
            {total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'}
            {endedLabel && <span className="text-muted-foreground/70">· {endedLabel}</span>}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
            {live && !voted ? 'Votar' : 'Ver resultado'}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Enquetes() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const adminIds = useAdminIds();
  const { data: polls = [], isLoading } = useQuery({ queryKey: ['polls'], queryFn: fetchPolls });
  const { data: voted = new Set<string>() } = useQuery({
    queryKey: ['my-vote-options', user?.id ?? null],
    queryFn: () => fetchUserVotes(user?.id ?? null),
    enabled: !!user,
  });

  const visibles = polls;
  const active = visibles.filter((p) => isPollLive(p));
  const closed = visibles.filter((p) => !isPollLive(p));

  const anyVoted = (poll: Poll) => poll.options.some((o) => voted.has(o.id));

  return (
    <div className="px-4 max-w-5xl mx-auto py-6 sm:py-10 pb-20">
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="inline-block stamp bg-highlight text-foreground px-3 py-1 text-[10px] sm:text-xs mb-4">
            <Vote className="h-3 w-3 inline mr-1" /> Consulta Popular
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-foreground mb-2 break-words uppercase leading-[0.95]">
            Voto do <span className="bg-highlight text-foreground px-2 inline-block -rotate-1">Povo</span>
          </h1>
          <p className="text-sm sm:text-base text-foreground/75 break-words font-semibold mt-3">
            Enquetes oficiais do Magrão da Rádio. Seu voto real, contado ao vivo.
          </p>
        </div>
        {isAdmin && (
          <Button asChild className="gap-1.5">
            <Link to="/admin/enquetes"><Plus className="h-4 w-4" /> Nova enquete</Link>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <PollCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && visibles.length === 0 && (
        <div className="py-16 text-center rounded-2xl border border-dashed bg-card">
          <Vote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma enquete no ar ainda.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Fique de olho — em breve o Magrão vai perguntar algo pra você.</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8 sm:mb-10">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 sm:h-6 w-1 rounded-full bg-gradient-highlight" />
            <h2 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
              Em andamento ({active.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {active.map((p) => (
              <PollCard key={p.id} poll={p} voted={anyVoted(p)}
                byAdmin={!!p.createdBy && adminIds.has(p.createdBy)} />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 sm:h-6 w-1 rounded-full bg-muted-foreground/30" />
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Encerradas ({closed.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {closed.map((p) => (
              <PollCard key={p.id} poll={p} voted={anyVoted(p)}
                byAdmin={!!p.createdBy && adminIds.has(p.createdBy)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
