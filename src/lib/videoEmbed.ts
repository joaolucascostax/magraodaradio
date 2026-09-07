export function getVideoEmbedUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'youtube-nocookie.com') {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'instagram.com' || host === 'instagr.am') {
      const parts = url.pathname.split('/').filter(Boolean);
      const type = parts[0];
      const id = parts[1];
      return id && (type === 'p' || type === 'reel' || type === 'tv')
        ? `https://www.instagram.com/${type}/${id}/embed`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function isInstagramUrl(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const host = new URL(value).hostname.replace(/^www\./, '').toLowerCase();
    return host === 'instagram.com' || host === 'instagr.am';
  } catch {
    return false;
  }
}

export function isSupportedVideoUrl(value: string): boolean {
  return getVideoEmbedUrl(value) !== null;
}

/**
 * Tenta descobrir uma miniatura pública do vídeo.
 * - YouTube: thumbnail oficial (sempre funciona).
 * - Instagram: endpoint /media/ (pode falhar → usar fallback visual na UI).
 */
export function getVideoThumbnailUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v');
      return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
    }
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
    }
    if (host === 'youtube-nocookie.com') {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : null;
    }
    if (host === 'instagram.com' || host === 'instagr.am') {
      const parts = url.pathname.split('/').filter(Boolean);
      const type = parts[0];
      const id = parts[1];
      return id && (type === 'p' || type === 'reel' || type === 'tv')
        ? `https://www.instagram.com/${type}/${id}/media/?size=l`
        : null;
    }
  } catch {
    return null;
  }
  return null;
}
