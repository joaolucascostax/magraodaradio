import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useSetBottomNavHidden } from '@/hooks/useBottomNav';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, CheckCircle2, Vote, Calendar, Share2, ListChecks, Loader2, Clock, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminBadge from '@/components/AdminBadge';
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

  useEffect(() => {
    const shouldHide = !hasVoted && live && selected.size > 0 && !isCheckingExistingVote;
    setBottomNavHidden(shouldHide);
    return () => setBottomNavHidden(false);
  }, [hasVoted, live, selected.size, isCheckingExistingVote, setBottomNavHidden]);

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
  const isCheckingExistingVote = !!user && isLoadingVotes;
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
    <div className={cn('px-4 max-w-2xl mx-auto py-6 sm:py-10', !hasVoted && live ? 'pb-32' : 'pb-20')}>
      <Link to="/enquetes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Todas as enquetes
      </Link>

      <div className={cn(
        'rounded-2xl border bg-card shadow-card relative overflow-hidden',
        byAdmin ? 'ring-1 ring-accent/50 border-accent/60' : 'border-highlight/20',
      )}>
        {poll.coverUrl && (
          <div className="h-40 sm:h-56 w-full overflow-hidden border-b">
            <img src={poll.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-5 sm:p-7 relative">
          <div className="mb-4 flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-highlight/10 text-highlight border-0 font-bold text-[10px] sm:text-xs gap-1">
              <Vote className="h-3 w-3" /> Consulta Popular
            </Badge>
            <Badge className={`border-0 text-[10px] sm:text-xs ${live ? 'bg-success/10 text-success gap-1' : 'bg-muted text-muted-foreground'}`}>
              {live && <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
              {live ? 'AO VIVO' : 'Encerrada'}
            </Badge>
            {countdown && (
              <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 border-warning/40 text-warning">
                <Clock className="h-3 w-3" /> {countdown}
              </Badge>
            )}
            {poll.allowMultiple && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <ListChecks className="h-3 w-3" /> Múltipla escolha
              </Badge>
            )}
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Calendar className="h-3 w-3" />{timeAgoBr(poll.createdAt)}
            </span>
          </div>

          {byAdmin && (
            <div className="mb-3"><AdminBadge size="md" /></div>
          )}

          <h1 className="mb-2 font-display text-xl sm:text-3xl font-black text-foreground leading-tight break-words tracking-tight">
            {poll.question}
          </h1>
          {poll.allowMultiple && !hasVoted && live && (
            <p className="mb-4 text-xs text-muted-foreground">Você pode escolher mais de uma opção.</p>
          )}

          {!live && winner && total > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-highlight/50 bg-gradient-to-br from-highlight/10 to-highlight/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-highlight" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-highlight">Resultado final</span>
              </div>
              <p className="font-display text-lg sm:text-2xl font-black text-foreground leading-tight break-words">
                {winner.text}
              </p>
              <p className="mt-1 text-sm text-foreground/80 font-semibold">
                {Math.round((winner.votes / total) * 100)}% dos votos
                <span className="text-muted-foreground font-normal"> · {winner.votes.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}</span>
              </p>
              {endedLabel && (
                <p className="mt-1 text-[11px] text-muted-foreground capitalize">{endedLabel}</p>
              )}
            </div>
          )}


          <div className="mt-5 space-y-3">
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
                    'group relative w-full rounded-2xl text-left transition-all duration-200 overflow-hidden',
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary ring-1 ring-primary/20'
                      : 'bg-card border-2 border-border hover:border-primary/30',
                    isWinner && 'bg-highlight/5 border-highlight/60',
                    (!live || hasVoted) && 'cursor-default',
                  )}
                >
                  {option.imageUrl && (
                    <div className="w-full aspect-[16/9] bg-muted overflow-hidden">
                      <img src={option.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    {/* Custom radio/check indicator */}
                    <div
                      className={cn(
                        'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'bg-transparent border-muted-foreground/30 group-hover:border-primary/50',
                        poll.allowMultiple && 'rounded-md',
                      )}
                    >
                      {isSelected && (
                        <div className={cn(
                          'bg-highlight rounded-full',
                          poll.allowMultiple ? 'w-3 h-3 rounded-sm' : 'w-2 h-2',
                        )} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn(
                          'text-sm sm:text-base font-semibold break-words leading-snug',
                          isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground',
                        )}>
                          {option.text}
                        </span>
                        {showResults && (
                          <span className="text-sm font-bold text-muted-foreground shrink-0 tabular-nums">{pct}%</span>
                        )}
                      </div>

                      {showResults && (
                        <>
                          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn(
                              'h-full rounded-full transition-all duration-700',
                              isWinner ? 'bg-gradient-to-r from-highlight to-warning' : isSelected ? 'bg-primary' : 'bg-primary/30',
                            )} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {option.votes.toLocaleString('pt-BR')} {option.votes === 1 ? 'voto' : 'votos'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <BarChart3 className="h-4 w-4" />
              {total.toLocaleString('pt-BR')} {total === 1 ? 'voto' : 'votos'} no total
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onShare} className="gap-1.5 min-h-[40px]">
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </Button>
              {hasVoted && (
                <Badge className="bg-success/10 text-success border-0">Você já votou</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

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
