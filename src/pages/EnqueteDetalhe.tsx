import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useSetBottomNavHidden } from '@/hooks/useBottomNav';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, CheckCircle2, Vote, Calendar, Share2, ListChecks, Loader2, Clock, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminBadge from '@/components/AdminBadge';
import PollComments from '@/components/enquetes/PollComments';
import { fetchPoll, fetchUserVotes } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminIds } from '@/hooks/useAdminIds';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { isPollLive, timeUntilClose, formatEndedAt } from '@/lib/pollLifecycle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EnqueteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user, openAuth } = useAuth();
  const adminIds = useAdminIds();
  const qc = useQueryClient();
  const setBottomNavHidden = useSetBottomNavHidden();

  const { data: poll, isLoading } = useQuery({
    queryKey: ['poll', id], queryFn: () => fetchPoll(id!), enabled: !!id,
  });
  const { data: voted = new Set<string>(), isLoading: isLoadingVotes } = useQuery({
    queryKey: ['my-vote-options', user?.id ?? null],
    queryFn: () => fetchUserVotes(user?.id ?? null),
    enabled: !!user,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const vote = useMutation({
    mutationFn: async (optionIds: string[]) => {
      if (!poll) return;
      if (!user) {
        setSelected(new Set());
        openAuth();
        throw new Error('auth-required');
      }
      // Revalida no servidor: o usuário pode ter votado antes em outra sessão/dispositivo
      const { data: existing, error: checkErr } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id);
      if (checkErr) throw checkErr;
      if ((existing?.length ?? 0) > 0) {
        qc.invalidateQueries({ queryKey: ['my-vote-options', user.id] });
        setSelected(new Set());
        throw new Error('already-voted');
      }
      const rows = optionIds.map((optId) => ({
        poll_id: poll.id, option_id: optId, user_id: user.id, device_id: user.id,
      }));
      const { error } = await supabase.from('poll_votes').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['poll', id] });
      qc.invalidateQueries({ queryKey: ['polls'] });
      qc.invalidateQueries({ queryKey: ['my-vote-options', user?.id ?? null] });
      setSelected(new Set());
      toast.success('Voto registrado!');
    },
    onError: (e) => {
      const msg = (e as Error).message;
      if (msg === 'auth-required') return;
      if (msg === 'already-voted') {
        toast.warning('Você já votou nesta enquete.', {
          description: 'Seu voto anterior foi mantido e não pode ser alterado.',
        });
        return;
      }
      toast.error('Não foi possível registrar o voto.');
    },
  });

  const isCheckingExistingVote = !!user && isLoadingVotes;

  useEffect(() => {
    if (!poll) return;
    const live = isPollLive(poll);
    const hasVoted = poll.options.some((o) => voted.has(o.id));
    const shouldHide = !hasVoted && live && selected.size > 0 && !isCheckingExistingVote;
    setBottomNavHidden(shouldHide);
    return () => setBottomNavHidden(false);
  }, [poll, voted, selected.size, isCheckingExistingVote, setBottomNavHidden]);

  if (isLoading) {
    return (
      <div className="px-4 max-w-2xl mx-auto py-6 sm:py-10">
        <div className="rounded-2xl border bg-card p-5 sm:p-7 shadow-card space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-7 w-11/12 rounded bg-muted animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 w-full rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="px-4 max-w-2xl mx-auto py-10 text-center">
        <p className="mb-4 text-muted-foreground">Enquete não encontrada.</p>
        <Link to="/enquetes">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        </Link>
      </div>
    );
  }

  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const hasVoted = poll.options.some((o) => voted.has(o.id));
  const winner = poll.options.reduce<typeof poll.options[number] | null>(
    (best, o) => (!best || o.votes > best.votes ? o : best), null,
  );
  const byAdmin = !!poll.createdBy && adminIds.has(poll.createdBy);
  const live = isPollLive(poll);
  const countdown = live ? timeUntilClose(poll.endsAt) : null;

  const endedLabel = !live ? formatEndedAt(poll.endsAt) : null;

  function toggleSelect(optId: string) {
    if (!poll || hasVoted || !live || isCheckingExistingVote) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (poll.allowMultiple) {
        next.has(optId) ? next.delete(optId) : next.add(optId);
      } else {
        next.clear();
        next.add(optId);
      }
      return next;
    });
  }

  async function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: poll.question, url }); } catch { /* canceled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  }

  const canSubmit = selected.size > 0 && !hasVoted && live && !vote.isPending && !isCheckingExistingVote;

  return (
    <div className={cn('mx-auto max-w-2xl', !hasVoted && live ? 'pb-32' : 'pb-20')}>
      {/* Banner de apuração */}
      <div className="relative">
        {poll.coverUrl ? (
          <div className="h-44 sm:h-64 w-full overflow-hidden">
            <img src={poll.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-32 sm:h-40 w-full bg-gradient-to-br from-primary via-primary/70 to-highlight" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40" />

        <Link
          to="/enquetes"
          className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur text-foreground shadow-card"
          aria-label="Todas as enquetes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border-0 bg-background/90 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-foreground backdrop-blur">
            Consulta Popular
          </Badge>
          {live ? (
            <Badge className="rounded-full border-0 bg-destructive px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-destructive-foreground gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" /> Ao vivo
            </Badge>
          ) : (
            <Badge className="rounded-full border-0 bg-muted px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Encerrada
            </Badge>
          )}
          {countdown && (
            <Badge className="rounded-full border-0 bg-warning/15 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-warning gap-1">
              <Clock className="h-3 w-3" /> {countdown}
            </Badge>
          )}
          {poll.allowMultiple && (
            <Badge className="rounded-full border-0 bg-background/90 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-foreground backdrop-blur gap-1">
              <ListChecks className="h-3 w-3" /> Múltipla
            </Badge>
          )}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Calendar className="h-3 w-3" /> {timeAgoBr(poll.createdAt)}
          </span>
        </div>
      </div>

      <div className="px-5">
        {byAdmin && <div className="mb-3"><AdminBadge size="md" /></div>}

        <h1 className="mt-2 mb-5 font-display text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-foreground break-words">
          {poll.question}
        </h1>

        {poll.allowMultiple && !hasVoted && live && (
          <p className="-mt-3 mb-5 text-xs text-muted-foreground">Você pode escolher mais de uma opção.</p>
        )}

        {!live && winner && total > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-highlight/50 bg-highlight/10 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-highlight" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-highlight">Resultado final</span>
            </div>
            <p className="font-display text-lg font-extrabold leading-tight text-foreground break-words">{winner.text}</p>
            <p className="mt-1 text-sm font-semibold text-foreground/80">
              {Math.round((winner.votes / total) * 100)}% dos votos
              <span className="font-normal text-muted-foreground"> · {winner.votes.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}</span>
            </p>
            {endedLabel && <p className="mt-1 text-[11px] capitalize text-muted-foreground">{endedLabel}</p>}
          </div>
        )}

        {/* Linhas compactas de apuração */}
        <div className="space-y-2.5">
          {poll.options.map((option) => {
            const pct = total ? Math.round((option.votes / total) * 100) : 0;
            const wasVoted = voted.has(option.id);
            const isSelected = wasVoted || (!hasVoted && !isCheckingExistingVote && selected.has(option.id));
            const isWinner = (hasVoted || !live) && winner?.id === option.id && total > 0;
            const showResults = !live || hasVoted;
            return (
              <button
                key={option.id}
                onClick={() => toggleSelect(option.id)}
                disabled={!live || hasVoted}
                className={cn(
                  'relative w-full overflow-hidden rounded-2xl text-left transition-all duration-200',
                  isSelected || isWinner
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border border-border bg-card hover:border-primary/40',
                  (!live || hasVoted) ? 'cursor-default' : 'active:scale-[0.99]',
                )}
              >
                {showResults && (
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all duration-700 ease-out',
                      isWinner ? 'bg-highlight/20' : isSelected ? 'bg-primary/15' : 'bg-muted',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center gap-3.5 p-3">
                  {option.imageUrl ? (
                    <img
                      src={option.imageUrl}
                      alt=""
                      className={cn(
                        'h-12 w-12 shrink-0 rounded-full border-2 border-background object-cover shadow-card',
                        showResults && !isSelected && !isWinner && 'grayscale opacity-70',
                      )}
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-extrabold text-muted-foreground">
                      {option.text.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-bold leading-snug break-words', isSelected || isWinner ? 'text-foreground' : 'text-foreground/80')}>
                      {option.text}
                    </p>
                    {showResults && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {option.votes.toLocaleString('pt-BR')} {option.votes === 1 ? 'voto' : 'votos'}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {showResults && (
                      <div className={cn('font-display text-lg font-extrabold tabular-nums', isWinner || isSelected ? 'text-primary' : 'text-muted-foreground')}>
                        {pct}%
                      </div>
                    )}
                    <div
                      className={cn(
                        'ml-auto mt-0.5 flex h-5 w-5 items-center justify-center border-2 transition-colors',
                        poll.allowMultiple ? 'rounded-md' : 'rounded-full',
                        isSelected ? 'border-primary bg-primary' : 'border-border bg-background',
                      )}
                    >
                      {isSelected && <div className={cn('bg-primary-foreground', poll.allowMultiple ? 'h-2 w-2 rounded-sm' : 'h-2 w-2 rounded-full')} />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Participação + compartilhar */}
        <div className="mt-7 flex items-end justify-between border-t border-dashed border-border pt-5">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Participação total</p>
            <p className="font-display text-2xl font-extrabold text-foreground tabular-nums">
              {total.toLocaleString('pt-BR')} <span className="text-xs font-bold text-primary">{total === 1 ? 'voto' : 'votos'}</span>
            </p>
            {hasVoted && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Você já votou
              </span>
            )}
          </div>
          <Button onClick={onShare} size="icon" className="h-12 w-12 rounded-2xl" aria-label="Compartilhar">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>


      <PollComments pollId={poll.id} />


      <AnimatePresence>
        {!hasVoted && live && selected.size > 0 && !isCheckingExistingVote && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 pt-8 pointer-events-none sm:pb-6"
          >
            <div className="mx-auto max-w-2xl pointer-events-auto">
              <Button
                onClick={() => { if (canSubmit) vote.mutate([...selected]); }}
                disabled={!canSubmit}
                className="w-full h-16 font-display text-lg font-extrabold tracking-tight rounded-2xl gap-2 border-b-4 border-highlight-foreground/20 bg-highlight text-highlight-foreground shadow-[0_8px_28px_-6px_hsl(48_96%_60%_/_0.35),0_16px_48px_-12px_hsl(48_96%_60%_/_0.25)] active:translate-y-0.5 active:border-b-0 active:shadow-none transition-all duration-150"
              >
                {vote.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Confirmar {selected.size > 1 ? `${selected.size} votos` : 'meu voto'}
                    <CheckCircle2 className="h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Participação Cidadã • Goiás
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
