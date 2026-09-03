import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Heart, Share2, AlertCircle, Trash2, MessageSquare, Ghost, User, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { postTipoLabels, postTipoColors, statusLabels, statusColors } from '@/data/mockData';
import { fetchComplaint, fetchComments, fetchUserSupports } from '@/lib/api';
import { buildShareText } from '@/lib/shareText';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { timeAgo } from '@/lib/timeAgo';
import { DetailSkeleton } from '@/components/ui/skeletons';
import { cn } from '@/lib/utils';
import { getVideoEmbedUrl } from '@/lib/videoEmbed';
import { useAdminIds } from '@/hooks/useAdminIds';
import AdminBadge from '@/components/AdminBadge';


export default function DetalheReclamacao() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, openAuth } = useAuth();
  const { data: complaint, isLoading } = useQuery({ queryKey: ['complaint', id], queryFn: () => fetchComplaint(id!), enabled: !!id });
  const { data: comments = [] } = useQuery({ queryKey: ['comments', id], queryFn: () => fetchComments(id!), enabled: !!id });
  const { data: supports = new Set<string>() } = useQuery({ queryKey: ['my-supports', user?.id], queryFn: () => fetchUserSupports(user!.id), enabled: !!user });
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('display_name').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const [newComment, setNewComment] = useState('');
  const [isAnonimo, setIsAnonimo] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const supported = id ? supports.has(id) : false;

  const adminIds = useAdminIds();

  const supportMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) return;
      if (supported) {
        // Toggle off: remove reação existente.
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Toggle on: upsert idempotente (evita erro de duplicate na volta rápida).
        const { error } = await supabase
          .from('post_reactions')
          .upsert(
            { post_id: id, user_id: user.id, tipo: 'like' },
            { onConflict: 'post_id,user_id' },
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['posts-feed'] });
      qc.invalidateQueries({ queryKey: ['my-supports', user?.id] });
    },
    onError: () => toast({ title: 'Não foi possível registrar seu apoio.', variant: 'destructive' }),
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error('Sem sessão.');
      const trimmed = newComment.trim();
      if (trimmed.length < 2) throw new Error('Escreva pelo menos 2 caracteres.');
      if (trimmed.length > 1000) throw new Error('Comentário muito longo (máx 1000).');
      const displayName = isAnonimo
        ? 'Cidadão Anônimo'
        : (profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Cidadão');
      const { error } = await supabase.from('post_comments').insert({
        post_id: id,
        autor_id: user.id,
        conteudo: trimmed,
        autor_display_name: displayName,
        is_anonimo: isAnonimo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      setIsAnonimo(false);
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      toast({ title: 'Comentário enviado!' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  // Exclusão do próprio comentário — RLS no servidor é a última barreira.
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Sem sessão.');
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('autor_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['complaint', id] });
      toast({ title: 'Comentário removido.' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!complaint) return (
    <div className="px-4 py-16 sm:py-20 text-center">
      <AlertCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-3 sm:mb-4" />
      <p className="text-base sm:text-lg font-semibold text-foreground mb-2">Reclamação não encontrada</p>
      <p className="text-sm text-muted-foreground mb-6">O link pode estar incorreto ou a reclamação foi removida.</p>
      <Link to="/"><Button className="rounded-xl min-h-[44px]">Voltar ao início</Button></Link>
    </div>
  );


  return (
    <div className="px-4 max-w-3xl mx-auto py-4 sm:py-6 pb-20 sm:pb-8">
      <Link to="/" className="mb-4 sm:mb-6 inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium min-h-[44px]">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>


      {/* Header */}
      <div className="mb-4 sm:mb-5 flex items-start gap-2.5 sm:gap-3">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary text-sm sm:text-base font-bold shadow-sm">
          {complaint.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-bold text-sm sm:text-base text-foreground truncate">{complaint.authorName}</span>
            {complaint.isVerified && <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {timeAgo(complaint.createdAt)} · {complaint.city}{complaint.neighborhood ? `, ${complaint.neighborhood}` : ''}
          </p>
        </div>
      </div>

      <Badge variant="outline" className={`${postTipoColors[complaint.tipo]} mb-3 rounded-md sm:rounded-lg gap-1.5 text-[10px] sm:text-xs`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
        {postTipoLabels[complaint.tipo]}
      </Badge>

      <h1 className="mb-2 sm:mb-3 text-lg sm:text-2xl font-black text-foreground leading-tight">{complaint.title}</h1>
      <p className="mb-4 sm:mb-5 text-sm sm:text-base text-foreground leading-relaxed">{complaint.description}</p>

      {/* Photo hero */}
      {complaint.photoUrl && (
        <div className="relative mb-5 sm:mb-6 overflow-hidden rounded-xl sm:rounded-2xl">
          <img src={complaint.photoUrl} alt="" className="w-full max-h-56 sm:max-h-80 object-cover" />
        </div>
      )}
      {complaint.videoUrl && getVideoEmbedUrl(complaint.videoUrl) && (
        <div className="relative mb-5 aspect-video overflow-hidden rounded-xl sm:mb-6 sm:rounded-2xl bg-muted/40">
          <iframe
            src={getVideoEmbedUrl(complaint.videoUrl) ?? undefined}
            title={`Vídeo: ${complaint.title}`}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Before/After slider */}
      {complaint.afterPhotoUrl && complaint.photoUrl && (
        <div className="mb-5 sm:mb-6 rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-5 shadow-card">
          <h3 className="mb-3 font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            📸 Antes e Depois
          </h3>
          <div className="relative overflow-hidden rounded-xl border" style={{ height: 220 }}>
            <img src={complaint.afterPhotoUrl} alt="Depois" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
              <img src={complaint.photoUrl} alt="Antes" className="h-full w-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
            </div>
            <div className="absolute inset-y-0" style={{ left: `${sliderPos}%` }}>
              <div className="h-full w-1 bg-white shadow-lg" />
            </div>
            <input type="range" min={0} max={100} value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-col-resize opacity-0" />
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] sm:text-xs text-white font-semibold">Antes</div>
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] sm:text-xs text-white font-semibold">Depois</div>
          </div>
        </div>
      )}

      {/* Promise */}
      {complaint.promiseText && (
        <div className="mb-4 sm:mb-5 rounded-xl sm:rounded-2xl border-2 border-highlight/20 bg-highlight/5 p-4 sm:p-5">
          <p className="mb-1.5 text-xs sm:text-sm font-bold text-highlight flex items-center gap-2">📢 Promessa Pública</p>
          <p className="text-xs sm:text-sm text-foreground">{complaint.promiseText}</p>
          {complaint.promiseDeadline && (
            <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground">Prazo: {new Date(complaint.promiseDeadline).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
      )}

      {/* Official response */}
      {complaint.officialResponse && (
        <div className="mb-4 sm:mb-5 rounded-xl sm:rounded-2xl border-l-4 border-l-primary bg-primary/5 p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-xs sm:text-sm font-bold text-primary">Resposta Oficial — pressionada pelo povo</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed">{complaint.officialResponse}</p>
          {complaint.officialResponseDate && (
            <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground">{timeAgo(complaint.officialResponseDate)}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mb-5 sm:mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        <Button
          className={cn(
            'gap-2 rounded-xl font-bold text-sm min-h-[48px] px-5 transition-all duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/40',
            supported
              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 hover:bg-primary/95'
              : 'bg-accent/60 text-accent-foreground hover:bg-accent shadow-sm hover:shadow-md',
          )}
          onClick={() => {
            if (!user) { openAuth(); return; }
            supportMutation.mutate();
          }}
          disabled={supportMutation.isPending}
          aria-pressed={supported}
        >
          <Heart className={cn('h-[18px] w-[18px] transition-transform', supported && 'fill-current animate-support-pop')} strokeWidth={2.5} />
          <span>{supported ? 'Apoiando' : 'Apoiar'}</span>
          <span className="tabular-nums opacity-80">· {complaint.supportCount.toLocaleString('pt-BR')}</span>
        </Button>
        <Button
          className="gap-2 rounded-xl min-h-[48px] px-5 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-sm shadow-sm transition-all active:scale-[0.97]"
          onClick={async () => {
            const url = window.location.href;
            const text = buildShareText({ title: complaint.title, url, supportCount: complaint.supportCount, tipo: complaint.tipo });
            // 1) Web Share API nativa (mobile)
            if (typeof navigator !== 'undefined' && (navigator as any).share) {
              try {
                await (navigator as any).share({ title: complaint.title, text, url });
                return;
              } catch (err: any) {
                if (err?.name === 'AbortError') return; // usuário cancelou
              }
            }
            // 2) Fallback WhatsApp
            const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
            const win = window.open(wa, '_blank', 'noopener,noreferrer');
            if (win) return;
            // 3) Fallback copiar link
            try {
              await navigator.clipboard.writeText(text);
              toast({ title: 'Link copiado!' });
            } catch {
              toast({ title: 'Não foi possível compartilhar', variant: 'destructive' as any });
            }
          }}
        >
          <Share2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Compartilhar
        </Button>
      </div>

      {/* Comments */}
      <div className="border-t pt-5 sm:pt-6">
        <h3 className="mb-3 sm:mb-4 font-bold text-foreground text-base sm:text-lg">Comentários ({comments.length})</h3>

        <div className="space-y-2 mb-5 sm:mb-6">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={2}
              className="flex-1 rounded-lg sm:rounded-xl text-sm"
            />
            <Button
              onClick={() => {
                if (!user) { openAuth(); return; }
                commentMutation.mutate();
              }}
              disabled={!newComment.trim() || commentMutation.isPending}
              className="self-end bg-primary hover:bg-primary/90 rounded-xl min-h-[44px]"
            >
              Enviar
            </Button>
          </div>
          {user && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Ghost className={cn('h-4 w-4', isAnonimo ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-xs font-medium text-foreground">
                  {isAnonimo ? 'Você comentará anonimamente' : 'Comentar com meu nome'}
                </span>
              </div>
              <Switch
                checked={isAnonimo}
                onCheckedChange={setIsAnonimo}
                aria-label="Comentar anonimamente"
              />
            </div>
          )}
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {comments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Ainda não há comentários. Seja o primeiro a se manifestar.</p>
            </div>
          )}
          {comments.map((c) => {
            const isMine = !!user && c.authorId === user.id;
            const isAdminAuthor = !!c.authorId && adminIds.has(c.authorId);
            return (
              <div key={c.id} className={cn(
                'rounded-lg sm:rounded-xl p-3 sm:p-4',
                isAdminAuthor
                  ? 'ring-1 ring-accent/50 bg-accent/10'
                  : c.isOfficial ? 'border-l-4 border-l-primary bg-primary/5' : 'bg-muted/50',
              )}>
                <div className="mb-1.5 sm:mb-2 flex items-center gap-2 flex-wrap">
                  <div className={cn(
                    'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[10px] sm:text-[11px] font-bold',
                    isAdminAuthor
                      ? 'bg-secondary text-secondary-foreground'
                      : c.isOfficial ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {c.authorName.charAt(0)}
                  </div>
                  <span className={cn(
                    'text-xs sm:text-sm font-semibold text-foreground',
                    isAdminAuthor && 'text-secondary font-extrabold',
                  )}>{c.authorName}</span>
                  {isAdminAuthor && <AdminBadge />}
                  {!isAdminAuthor && c.isOfficial && <Badge className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0 rounded-md">Oficial</Badge>}
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
                  {isMine && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir comentário"
                      disabled={deleteComment.isPending}
                      onClick={() => { if (window.confirm('Excluir este comentário?')) deleteComment.mutate(c.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-foreground pl-9 sm:pl-10 whitespace-pre-wrap break-words">{c.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
