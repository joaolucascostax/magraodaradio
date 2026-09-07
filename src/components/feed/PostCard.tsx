import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, MapPin, BadgeCheck, UserRound, Play } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAdminIds } from '@/hooks/useAdminIds';
import { usePostSupport } from '@/hooks/usePostSupport';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { cn } from '@/lib/utils';
import { getVideoEmbedUrl } from '@/lib/videoEmbed';
import { fetchComplaint, fetchComments } from '@/lib/api';
import { buildShareText } from '@/lib/shareText';
import { postTipoLabels } from '@/data/mockData';
import magraoAvatar from '@/assets/magrao-campanha-2026.jpg.asset.json';
import type { PostRow } from '@/hooks/usePostsFeed';

const tipoAccentBg: Record<string, string> = {
  noticia: 'bg-primary',
  projeto: 'bg-warning',
  denuncia: 'bg-destructive',
  discussao: 'bg-secondary',
  enquete: 'bg-success',
};

const tipoBadgeClasses: Record<string, string> = {
  noticia: 'bg-primary/10 text-primary',
  projeto: 'bg-warning/15 text-warning-foreground',
  denuncia: 'bg-destructive/10 text-destructive',
  discussao: 'bg-secondary/10 text-secondary-foreground',
  enquete: 'bg-success/10 text-success',
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
  const isOfficial = post.is_official;
  const showAuthor = !post.is_anonimo;
  const resolvedName = post.author_name || post.autor_display_name || 'Cidadão';
  const authorName = post.is_anonimo ? 'Anônimo' : resolvedName;
  const initials = post.is_anonimo ? '' : initialsOf(resolvedName);
  const isMagrao = isAdminAuthor || isVereador || isOfficial;
  const avatarSrc = post.is_anonimo
    ? null
    : isMagrao
      ? magraoAvatar.url
      : post.author_avatar_url || null;

  const prefetchDetail = () => {
    qc.prefetchQuery({ queryKey: ['complaint', post.id], queryFn: () => fetchComplaint(post.id), staleTime: 30_000 });
    qc.prefetchQuery({ queryKey: ['comments', post.id], queryFn: () => fetchComments(post.id), staleTime: 30_000 });
  };

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const interactive = target.closest(
      'a, button, input, textarea, select, [role="button"], [contenteditable="true"]'
    );
    const selection = window.getSelection();
    const isSelecting = selection && selection.toString().length > 0;
    if (interactive || isSelecting) return;
    navigate(`/reclamacao/${post.id}`);
  }

  const hasVideo = !!post.video_url && getVideoEmbedUrl(post.video_url);
  const hasCover = !!post.cover_url;
  const firstMedia = (post.media_urls ?? []).filter(Boolean)[0] ?? null;
  const videoThumb =
    getVideoThumbnailUrl(post.video_url) ?? getVideoThumbnailUrl(firstMedia);
  const thumbnail = hasCover ? post.cover_url : videoThumb;
  // Quando o post tem vídeo mas nenhuma miniatura carregável, mostramos um
  // bloco visual da marca com o play, em vez de deixar o item sem imagem.
  const showThumbnail = !!thumbnail || !!hasVideo;
  const extraVideoCount = (post.media_urls ?? []).filter(Boolean).length;
  const videoCount = hasVideo ? extraVideoCount + 1 : 0;

  const metaLocation = post.cidade && post.uf
    ? `${post.cidade}/${post.uf}`
    : post.cidade || 'Goiás inteiro';

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
      className="group relative cursor-pointer border-b border-border bg-background px-5 py-4 transition-all hover:bg-muted/20 active:scale-[0.995]"
    >
      {/* Barra de destaque por tipo */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', tipoAccentBg[post.tipo] ?? 'bg-muted')} />

      {/* Cabeçalho: tipo · local · tempo */}
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-widest',
            tipoBadgeClasses[post.tipo] ?? 'bg-muted text-muted-foreground'
          )}
        >
          {postTipoLabels[post.tipo as keyof typeof postTipoLabels] ?? post.tipo}
        </span>
        <span className="flex items-center gap-1 truncate text-[11px] font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{metaLocation}</span>
          <span aria-hidden>•</span>
          {timeAgoBr(post.created_at)}
        </span>
      </div>

      {/* Conteúdo principal: título + thumbnail */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold leading-tight tracking-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {post.titulo}
          </h3>
          {post.corpo && (
            <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">{post.corpo}</p>
          )}
          {showAuthor && (
            <div className="mt-2 flex items-center gap-1.5">
              <Avatar className="h-4 w-4 rounded-full">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={authorName} className="object-cover" />}
                <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
                  {post.is_anonimo || !initials ? <UserRound className="h-2.5 w-2.5" /> : initials}
                </AvatarFallback>
              </Avatar>
              <span className={cn('text-[10px] font-semibold', isMagrao && 'text-secondary')}>
                {authorName}
              </span>
              {isMagrao && <BadgeCheck className="h-3 w-3 shrink-0 text-primary" aria-label="Verificado" />}
            </div>
          )}
        </div>

        {showThumbnail && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img src={thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform group-hover:scale-110">
                  <Play className="h-4 w-4 fill-primary text-primary" />
                </div>
              </div>
            )}
            {videoCount > 1 && (
              <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                <Play className="h-2.5 w-2.5 fill-current" /> {videoCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ações com profundidade/sombra */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            disabled={pending}
            aria-pressed={supported}
            aria-label={supported ? 'Remover apoio' : 'Apoiar demanda'}
            className={cn(
              'h-9 gap-1.5 rounded-full border border-border/50 bg-background px-3 text-xs font-bold shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95',
              supported
                ? 'text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ThumbsUp
              className={cn('h-4 w-4 transition-transform', supported && 'fill-current scale-110')}
              strokeWidth={2.2}
            />
            <span className="tabular-nums">{supportCount.toLocaleString('pt-BR')}</span>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-full border border-border/50 bg-background px-3 text-xs font-bold text-muted-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-md active:scale-95"
          >
            <Link to={`/reclamacao/${post.id}`} aria-label={`Ver comentários (${post.comment_count})`}>
              <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
              <span className="tabular-nums">{post.comment_count.toLocaleString('pt-BR')}</span>
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={share}
          onContextMenu={(e) => { e.preventDefault(); copyLink(); }}
          aria-label="Compartilhar no WhatsApp (segure para copiar link)"
          className="h-9 w-9 rounded-full border border-border/50 bg-background text-muted-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-md active:scale-95"
        >
          <Share2 className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </article>
  );
}
