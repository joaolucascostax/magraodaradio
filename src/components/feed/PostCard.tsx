import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, MapPin, BadgeCheck, UserRound, CheckCircle2, Clock, Landmark } from 'lucide-react';
import VereadorBadge from '@/components/VereadorBadge';
import AdminBadge from '@/components/AdminBadge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAdminIds } from '@/hooks/useAdminIds';
import { usePostSupport } from '@/hooks/usePostSupport';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { cn } from '@/lib/utils';
import { getVideoEmbedUrl, isInstagramUrl } from '@/lib/videoEmbed';
import { fetchComplaint, fetchComments } from '@/lib/api';
import { buildShareText } from '@/lib/shareText';
import { postTipoLabels } from '@/data/mockData';
import magraoAvatar from '@/assets/magrao-campanha-2026.jpg.asset.json';
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

export default function PostCard({ post: initial }: { post: PostRow }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const adminIds = useAdminIds();
  const [post, setPost] = useState<PostRow>(initial);
  const { count: supportCount, supported, toggle, pending } = usePostSupport(initial.id, initial.like_count);

  useEffect(() => { setPost(initial); }, [initial]);

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
  const resolvedName = post.author_name || post.autor_display_name || 'Cidadão';
  const authorName = post.is_anonimo ? 'Anônimo' : resolvedName;
  const initials = post.is_anonimo ? '' : initialsOf(resolvedName);
  const isMagrao = isAdminAuthor || isVereador || post.is_official;
  const avatarSrc = post.is_anonimo
    ? null
    : isMagrao
      ? magraoAvatar.url
      : post.author_avatar_url || null;
  

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

  const selo = post.selo ? SELO_META[post.selo as string] : null;
  const SeloIcon = selo?.icon;

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
      className="group cursor-pointer bg-background px-1 py-4 transition-colors hover:bg-muted/30 sm:px-2"
    >
      {/* cabeçalho: autor · cidade · tempo */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-border/60 bg-background">
          {avatarSrc && (
            <AvatarImage src={avatarSrc} alt={authorName} className="object-cover" />
          )}
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
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn('truncate text-sm font-bold', isAdminAuthor && 'text-secondary')}>
              {authorName}
            </span>
            {(isAdminAuthor || isVereador || post.is_official) && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verificado" />
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {post.cidade && (
              <>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" /> {post.cidade}{post.uf ? `/${post.uf}` : ''}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="shrink-0">{timeAgoBr(post.created_at)}</span>
            {post.tipo && (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0 font-semibold">
                  {postTipoLabels[post.tipo as keyof typeof postTipoLabels] ?? post.tipo}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {selo && SeloIcon && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-secondary">
          <SeloIcon className="h-3 w-3" /> {selo.label}
        </div>
      )}

      <Link to={`/reclamacao/${post.id}`} className="mt-2 block">
        <h3 className="font-display text-base font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {post.titulo}
        </h3>
        {post.corpo && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.corpo}</p>
        )}
        {post.cover_url && (
          <div className="mt-3 aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted/40">
            <img
              src={post.cover_url}
              alt={post.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {post.video_url && getVideoEmbedUrl(post.video_url) && (
          <div
            className={cn(
              'mt-3 w-full overflow-hidden rounded-xl bg-muted/40',
              isInstagramUrl(post.video_url) ? 'aspect-[4/5]' : 'aspect-video',
            )}
          >
            <iframe
              src={getVideoEmbedUrl(post.video_url) ?? undefined}
              title={`Vídeo: ${post.titulo}`}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </Link>

      {/* ações essenciais */}
      <div className="mt-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={pending}
          aria-pressed={supported}
          aria-label={supported ? 'Remover apoio' : 'Apoiar demanda'}
          className={cn(
            'min-h-[44px] gap-2 rounded-full bg-muted/60 px-3 text-sm font-bold hover:bg-muted',
            supported ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <ThumbsUp
            className={cn('h-[18px] w-[18px] transition-transform', supported && 'fill-current scale-110')}
            strokeWidth={2.2}
          />
          <span className="tabular-nums">{supportCount.toLocaleString('pt-BR')}</span>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="min-h-[44px] gap-2 rounded-full bg-muted/60 px-3 text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          <Link to={`/reclamacao/${post.id}`} aria-label={`Ver comentários (${post.comment_count})`}>
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} />
            <span className="tabular-nums">{post.comment_count.toLocaleString('pt-BR')}</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={share}
          onContextMenu={(e) => { e.preventDefault(); copyLink(); }}
          aria-label="Compartilhar no WhatsApp (segure para copiar link)"
          className="ml-auto min-h-[44px] w-11 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted"
        >
          <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </Button>
      </div>
    </article>
  );
}

