import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, Vote, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPolls, fetchUserVotes } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ActivePoll() {
  const { user, openAuth } = useAuth();
  const qc = useQueryClient();
  const { data: polls = [] } = useQuery({ queryKey: ['polls'], queryFn: fetchPolls });
  const { data: votedOptions = new Set<string>(), isLoading: isLoadingVotes } = useQuery({
    queryKey: ['my-vote-options', user?.id ?? null],
    queryFn: () => fetchUserVotes(user?.id ?? null),
    enabled: !!user,
  });
  const poll = polls.find((p) => p.isActive);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      if (!poll) return;
      if (!user) {
        setSelected(null);
        openAuth();
        throw new Error('auth-required');
      }
      const { data: existing, error: checkErr } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id);
      if (checkErr) throw checkErr;
      if ((existing?.length ?? 0) > 0) {
        qc.invalidateQueries({ queryKey: ['my-vote-options', user.id] });
        setSelected(null);
        throw new Error('already-voted');
      }
      const { error } = await supabase.from('poll_votes').insert({
        poll_id: poll.id, option_id: optionId, user_id: user.id, device_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] });
      qc.invalidateQueries({ queryKey: ['my-vote-options', user?.id ?? null] });
      setSelected(null);
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

  if (!poll) return null;

  const myVote = poll.options.find((o) => votedOptions.has(o.id))?.id ?? null;
  const isCheckingExistingVote = !!user && isLoadingVotes;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <section className="py-3 sm:py-4">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 shadow-sm transition-all duration-300 ${
          open
            ? 'border-highlight bg-highlight/5 shadow-md'
            : 'border-border bg-card hover:border-highlight/40 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-highlight/10">
            <Vote className="h-4 w-4 text-highlight" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm text-foreground leading-tight">Enquete Ativa</span>
            <span className="text-[11px] text-muted-foreground leading-tight">Participe agora</span>
          </div>
          <Badge className="bg-success/10 text-success border-0 text-[10px] gap-1 ml-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            AO VIVO
          </Badge>
        </div>
        <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-highlight/10 rotate-180' : 'bg-muted'
        }`}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative rounded-2xl border-2 border-highlight/20 bg-card p-4 sm:p-6 shadow-card">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-highlight/8 to-transparent rounded-bl-[80px] sm:rounded-bl-[100px]" />

            <div className="relative">
              {/* Header badges */}
              <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge className="bg-highlight/10 text-highlight border-0 font-bold text-[10px] sm:text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Consulta Popular
                </Badge>
              </div>

              {/* Question */}
              <h3 className="mb-5 text-base sm:text-xl font-bold text-foreground leading-snug">
                {poll.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5 sm:space-y-3">
                {poll.options.map((option, index) => {
                  const pct = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
                  const isSelected = myVote === option.id || (!isCheckingExistingVote && !myVote && selected === option.id);
                  const isLeading = index === 0;
                  return (
                    <button
                      key={option.id}
                      onClick={() => !myVote && !isCheckingExistingVote && setSelected(option.id)}
                      disabled={!!myVote || isCheckingExistingVote}
                      className={`group w-full rounded-xl border-2 p-3 text-left transition-all duration-200 min-h-[44px] ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-fade-in" />
                          )}
                          {option.text}
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${
                          isLeading ? 'text-highlight' : 'text-muted-foreground'
                        }`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isSelected
                              ? 'bg-primary shimmer'
                              : isLeading
                                ? 'bg-highlight/70'
                                : 'bg-primary/40'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-4 sm:mt-5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {totalVotes.toLocaleString('pt-BR')} votos
                </span>
                {selected && !myVote && !isCheckingExistingVote && (
                  <Button
                    size="sm"
                    className="bg-gradient-highlight text-highlight-foreground font-bold shadow-sm text-xs min-h-[36px] rounded-xl"
                    onClick={() => vote.mutate(selected)}
                    disabled={vote.isPending}
                  >
                    Confirmar Voto
                  </Button>
                )}
                {myVote && (
                  <Badge className="bg-success/10 text-success border-0 text-xs">Você já votou</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
