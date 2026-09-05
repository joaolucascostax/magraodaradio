import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Ghost, User, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminIds } from '@/hooks/useAdminIds';
import AdminBadge from '@/components/AdminBadge';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PollComment = {
  id: string;
  autor_id: string | null;
  autor_display_name: string;
  is_anonimo: boolean;
  conteudo: string;
  created_at: string;
};

export default function PollComments({ pollId }: { pollId: string }) {
  const { user, openAuth } = useAuth();
  const adminIds = useAdminIds();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [isAnonimo, setIsAnonimo] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['poll-comments', pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_comments')
        .select('id, autor_id, autor_display_name, is_anonimo, conteudo, created_at')
        .eq('poll_id', pollId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PollComment[];
    },
    enabled: !!pollId,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('display_name').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const myName =
    profile?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    'Apoiador';

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sem sessão.');
      const trimmed = text.trim();
      if (trimmed.length < 2) throw new Error('Escreva pelo menos 2 caracteres.');
      if (trimmed.length > 1000) throw new Error('Comentário muito longo (máx. 1000).');
      const { error } = await supabase.from('poll_comments').insert({
        poll_id: pollId,
        autor_id: user.id,
        autor_display_name: isAnonimo ? 'Anônimo' : myName,
        is_anonimo: isAnonimo,
        conteudo: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText('');
      setIsAnonimo(false);
      qc.invalidateQueries({ queryKey: ['poll-comments', pollId] });
      toast.success('Comentário enviado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('poll_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['poll-comments', pollId] });
      toast.success('Comentário removido.');
    },
    onError: () => toast.error('Não foi possível remover o comentário.'),
  });

  return (
    <div className="mt-6 rounded-2xl border bg-card p-5 sm:p-7 shadow-card">
      <h2 className="mb-4 font-display text-base sm:text-lg font-bold text-foreground">
        Comentários ({comments.length})
      </h2>

      <div className="space-y-2 mb-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que você acha desta enquete?"
            rows={2}
            className="resize-none rounded-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/30 px-3 py-2">
            {user && (
              <button
                type="button"
                onClick={() => setIsAnonimo(!isAnonimo)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95',
                  isAnonimo ? 'bg-secondary text-secondary-foreground shadow-md' : 'bg-muted text-foreground hover:bg-muted/80',
                )}
                aria-label={isAnonimo ? 'Comentar anonimamente' : 'Comentar com meu nome'}
              >
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  isAnonimo ? 'bg-accent text-secondary' : 'bg-background text-muted-foreground',
                )}>
                  {isAnonimo ? <Ghost className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </span>
                <span className="max-w-[120px] truncate normal-case">{isAnonimo ? 'Anônimo' : myName}</span>
              </button>
            )}
            <Button
              onClick={() => { if (!user) { openAuth(); return; } send.mutate(); }}
              disabled={!text.trim() || send.isPending}
              className="h-10 w-10 rounded-full bg-primary p-0 text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              aria-label="Enviar comentário"
            >
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando comentários…</p>}
        {!isLoading && comments.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Ainda não há comentários. Seja o primeiro a opinar.</p>
          </div>
        )}
        {comments.map((c) => {
          const isMine = !!user && c.autor_id === user.id;
          const isAdminAuthor = !c.is_anonimo && !!c.autor_id && adminIds.has(c.autor_id);
          const name = c.is_anonimo ? 'Anônimo' : (c.autor_display_name || 'Apoiador');
          return (
            <div key={c.id} className={cn(
              'rounded-xl p-3 sm:p-4',
              isAdminAuthor ? 'ring-1 ring-accent/50 bg-accent/10' : 'bg-muted/50',
            )}>
              <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                <div className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[11px] font-bold',
                  isAdminAuthor ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  {c.is_anonimo ? <Ghost className="h-3.5 w-3.5" /> : name.charAt(0).toUpperCase()}
                </div>
                <span className={cn('text-xs sm:text-sm font-semibold text-foreground', isAdminAuthor && 'text-secondary font-extrabold')}>
                  {name}
                </span>
                {isAdminAuthor && <AdminBadge />}
                <span className="ml-auto text-[10px] sm:text-xs text-muted-foreground">{timeAgoBr(c.created_at)}</span>
                {isMine && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label="Excluir comentário"
                    disabled={remove.isPending}
                    onClick={() => { if (window.confirm('Excluir este comentário?')) remove.mutate(c.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="pl-9 sm:pl-10 text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words">{c.conteudo}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
