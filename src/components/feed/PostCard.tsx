import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, MapPin, BadgeCheck, UserRound, CheckCircle2, Clock, Landmark } from 'lucide-react';
import VereadorBadge from '@/components/VereadorBadge';
import AdminBadge from '@/components/AdminBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminIds } from '@/hooks/useAdminIds';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { cn } from '@/lib/utils';
import { fetchComplaint, fetchComments } from '@/lib/api';
import { buildShareText } from '@/lib/shareText';
import { postTipoLabels } from '@/data/mockData';
import type { PostRow } from '@/hooks/usePostsFeed';

const tipoBadgeClasses: Record<string, string> = {
  noticia: 'bg-primary/10 text-primary border-primary/20',
  projeto: 'bg-warning/10 text-warning border-warning/20',
  denuncia: 'bg-destructive/10 text-destructive border-destructive/20',
  discussao: 'bg-secondary/10 text-secondary border-secondary/20',
  enquete: 'bg-success/10 text-success border-success/20',
};

const SELO_META: Record<string, { label: string; icon: any; className: string }> = {
  resolvido_magrao: { label: 'Resolvido pelo Magrão', icon: CheckCircle2, className: 'bg-success text-success-foreground' },
  em_andamento: { label: 'Em andamento', icon: Clock, className: 'bg-warning text-warning-foreground' },
  encaminhado_camara: { label: 'Encaminhado à Câmara', icon: Landmark, className: 'bg-primary text-primary-foreground' },
};

function initialsOf(name?: string | null) {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

type ReactionTipo = 'like';

export default function PostCard({ post: initial }: { post: PostRow }) {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const adminIds = useAdminIds();
  const [post, setPost] = useState<PostRow>(initial);
  const [myReaction, setMyReaction] = useState<ReactionTipo | null>(null);
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => { setPost(initial); }, [initial]);

  useEffect(() => {
    if (!user) { setMyReaction(null); return; }
    supabase
      .from('post_reactions')
      .select('tipo')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setMyReaction((data?.tipo as ReactionTipo) ?? null));
  }, [user, post.id]);

  async function react(tipo: ReactionTipo) {
    if (!user) { openAuth(); return; }
    if (busy) return;
    setBusy(true);
    const prev = myReaction;
    const isToggleOff = prev === 'like';
    const delta = isToggleOff ? -1 : 1;
    setPost((p) => ({ ...p, like_count: Math.max(0, p.like_count + delta) }));
    setMyReaction(isToggleOff ? null : 'like');
    if (!isToggleOff) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 350);
    }

    let error;
    if (isToggleOff) {
      ({ error } = await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('post_reactions')
        .upsert({ post_id: post.id, user_id: user.id, tipo }, { onConflict: 'post_id,user_id' }));
    }
    if (error) {
      toast.error('Não foi possível registrar seu apoio.');
      setPost((p) => ({ ...p, like_count: Math.max(0, p.like_count - delta) }));
      setMyReaction(prev);
    } else {
      // Fonte da verdade: revalida feed + detalhe.
      qc.invalidateQueries({ queryKey: ['posts-feed'] });
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['complaint', post.id] });
      qc.invalidateQueries({ queryKey: ['my-supports', user.id] });
    }
    setBusy(false);
  }

  async function share() {
    const url = `${window.location.origin}/reclamacao/${post.id}`;
    const text = buildShareText({ title: post.titulo, url, supportCount: post.like_count, tipo: post.tipo });
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  }

  async function copyLink() {
    const url = `${window.location.origin}/reclamacao/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch { /* noop */ }
  }

  const isAdminAuthor = !post.is_anonimo && !!post.autor_id && adminIds.has(post.autor_id);
  const isVereador = !!post.author_is_vereador && !post.is_anonimo;
  const highlight = isAdminAuthor || isVereador;
  const authorName = post.is_anonimo ? 'Anônimo' : (post.autor_display_name || 'Cidadão');
  const initials = post.is_anonimo ? '' : initialsOf(post.autor_display_name);
  

  // Prefetch da página de detalhe ao passar mouse/tocar — abre "instantâneo".
  const prefetchDetail = () => {
    qc.prefetchQuery({ queryKey: ['complaint', post.id], queryFn: () => fetchComplaint(post.id), staleTime: 30_000 });
    qc.prefetchQuery({ queryKey: ['comments', post.id], queryFn: () => fetchComments(post.id), staleTime: 30_000 });
  };

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    // Não navega se o clique foi em botões, links, inputs, selects, elementos com role=button,
    // contenteditable, ou se o usuário está selecionando texto.
    const target = e.target as HTMLElement;
    const interactive = target.closest(
      'a, button, input, textarea, select, [role="button"], [contenteditable="true"]'
    );
    const selection = window.getSelection();
    const isSelecting = selection && selection.toString().length > 0;
    if (interactive || isSelecting) return;
    navigate(`/reclamacao/${post.id}`);
  }

  return (
    <Card
      onClick={handleCardClick}
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
      className={cn(
        'group relative cursor-pointer overflow-hidden bg-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover',
        highlight ? 'border-accent/60 ring-1 ring-accent/40' : 'border-border',
        isAdminAuthor && 'bg-gradient-to-br from-card to-accent/10',
      )}
    >
      {/* Faixa de selo (quando aplicado) */}
      {post.selo && SELO_META[post.selo] && (() => {
        const s = SELO_META[post.selo as string];
        const Icon = s.icon;
        return (
          <div className={cn('flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide', s.className)}>
            <Icon className="h-3.5 w-3.5" />
            <span>{s.label}</span>
          </div>
        );
      })()}

      {/* faixa superior sutil */}
      {!post.selo && (
        <div
          className={cn(
            'h-1 w-full',
            highlight
              ? 'bg-gradient-to-r from-accent via-primary to-secondary'
              : post.is_official
                ? 'bg-gradient-to-r from-primary/70 to-secondary/70'
                : 'bg-gradient-to-r from-primary/20 via-transparent to-accent/30',
          )}
        />
      )}

      {post.tipo && (
        <Badge
          variant="outline"
          className={cn(
            'absolute right-3 z-10 font-display text-[10px] font-bold uppercase tracking-wide',
            post.selo ? 'top-12' : 'top-3',
            tipoBadgeClasses[post.tipo] ?? 'bg-muted text-muted-foreground border-border',
          )}
        >
          {postTipoLabels[post.tipo as keyof typeof postTipoLabels] ?? post.tipo}
        </Badge>
      )}


      <div className="p-4 sm:p-5">
        {/* cabeçalho: autor + tempo */}
        <div className="mb-3 flex items-center gap-3">
          <Avatar
            className={cn(
              'h-10 w-10 shrink-0 ring-2 ring-background shadow-soft',
              highlight && 'ring-accent/60',
            )}
          >
            <AvatarFallback
              className={cn(
                'text-xs font-bold',
                post.is_anonimo
                  ? 'bg-muted text-muted-foreground'
                  : highlight
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary/10 text-primary',
              )}
            >
              {post.is_anonimo || !initials ? <UserRound className="h-4 w-4" /> : initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn(
                'truncate text-sm font-semibold text-foreground',
                isAdminAuthor && 'text-secondary font-extrabold',
              )}>{authorName}</span>
              {isAdminAuthor && <AdminBadge />}
              {!isAdminAuthor && isVereador && <VereadorBadge />}
              {post.is_official && (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                  <BadgeCheck className="h-3 w-3" /> Oficial
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{timeAgoBr(post.created_at)}</span>
              {post.cidade && (
                <>
                  <span aria-hidden>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {post.cidade}{post.uf ? `/${post.uf}` : ''}
                  </span>
                </>
              )}
              {post.bairro && (
                <>
                  <span aria-hidden>•</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-secondary">
                    {post.bairro}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <Link to={`/reclamacao/${post.id}`} className="block">
          <h3 className="font-display text-lg sm:text-xl font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
            {post.titulo}
          </h3>
          {post.corpo && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {post.corpo}
            </p>
          )}
          {post.cover_url && (
            <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-muted/40">
              <img
                src={post.cover_url}
                alt={post.titulo}
                loading="lazy"
                className="h-28 w-full object-cover sm:h-32"
              />
            </div>
          )}

        </Link>
      </div>



      <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-3 sm:py-4">
        {/* Apoiar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => react('like')}
          disabled={busy}
          aria-pressed={myReaction === 'like'}
          aria-label={myReaction === 'like' ? 'Remover apoio' : 'Apoiar demanda'}
          className={cn(
            'group relative flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 min-h-[44px] transition-all duration-200 active:scale-[0.97]',
            'shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40',
            myReaction === 'like'
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
              : 'bg-accent/60 text-accent-foreground hover:bg-accent',
          )}
        >
          <ThumbsUp
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-all duration-300',
              myReaction === 'like' && 'fill-current',
              pulse && 'scale-125',
            )}
            strokeWidth={2.5}
          />
          <div className="flex flex-col items-start leading-tight">
            <span className="font-display text-[13px] font-extrabold">Apoiar</span>
            <span className="tabular-nums text-[10px] font-semibold opacity-80">
              {post.like_count.toLocaleString('pt-BR')} {post.like_count === 1 ? 'voto' : 'votos'}
            </span>
          </div>
        </Button>

        {/* Comentar */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="group flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/5 py-2.5 px-3 min-h-[44px] text-secondary transition-all hover:bg-secondary/10 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <Link to={`/reclamacao/${post.id}`} aria-label={`Ver comentários (${post.comment_count})`}>
            <MessageCircle
              className="h-[18px] w-[18px] shrink-0 transition-colors"
              strokeWidth={2.2}
            />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-display text-[13px] font-bold">Comentar</span>
              <span className="tabular-nums text-[10px] font-semibold opacity-70">
                {post.comment_count.toLocaleString('pt-BR')}
              </span>
            </div>
          </Link>
        </Button>

        {/* Compartilhar no WhatsApp */}
        <Button
          variant="ghost"
          size="icon"
          onClick={share}
          onContextMenu={(e) => { e.preventDefault(); copyLink(); }}
          aria-label="Compartilhar no WhatsApp (segure para copiar link)"
          title="Compartilhar no WhatsApp"
          className="h-11 w-11 shrink-0 rounded-xl bg-success/10 text-success transition-all hover:bg-success/20 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-success/40"
        >
          <Share2 className="h-[18px] w-[18px] transition-transform group-hover:rotate-12" strokeWidth={2} />
        </Button>
      </div>
    </Card>
  );
}
