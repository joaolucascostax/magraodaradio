import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, string>();

/** Converte caminhos do bucket privado "avatars" em URLs assinadas utilizáveis em <img>. */
export async function signAvatarPaths(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const p of paths) {
    if (!p) continue;
    if (/^https?:\/\//i.test(p)) {
      out[p] = p;
      continue;
    }
    const cached = cache.get(p);
    if (cached) out[p] = cached;
    else if (!missing.includes(p)) missing.push(p);
  }

  if (missing.length > 0) {
    const { data } = await supabase.storage.from('avatars').createSignedUrls(missing, 60 * 60);
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        cache.set(item.path, item.signedUrl);
        out[item.path] = item.signedUrl;
      }
    }
  }

  return out;
}

export async function signAvatarPath(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const map = await signAvatarPaths([path]);
  return map[path] ?? null;
}
