import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Link2, Loader2, Megaphone, Pencil, Plus, Send, Trash2, Video, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CitySelect from '@/components/CitySelect';
import EditPostDialog from '@/components/admin/EditPostDialog';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import type { Database } from '@/integrations/supabase/types';

import { isSupportedVideoUrl } from '@/lib/videoEmbed';

type Post = Database['public']['Tables']['posts']['Row'];
type DiarioTipo = 'noticia' | 'projeto' | 'video';

type ImageItem = { file: File; preview: string };

const tipoMeta: Record<DiarioTipo, { label: string; helper: string }> = {
  noticia: { label: 'Notícia / atualização', helper: 'Uma mensagem direta para quem acompanha o mandato.' },
  projeto: { label: 'Projeto / conquista', helper: 'Mostre uma ação, entrega ou compromisso em andamento.' },
  video: { label: 'Vídeo', helper: 'Cole um link público do YouTube ou Instagram.' },
};

async function uploadImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/diario/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const upload = await supabase.storage.from('post-media').upload(path, file, { upsert: false });
  if (upload.error) throw new Error(`Falha no upload: ${upload.error.message}`);
  const { data, error } = await supabase.storage.from('post-media').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (error || !data) throw new Error('Falha ao gerar a URL da imagem.');
  return data.signedUrl;
}

export default function AdminDiario() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<DiarioTipo>('noticia');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [cidade, setCidade] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [avisarWhatsapp, setAvisarWhatsapp] = useState(true);
  const [imagens, setImagens] = useState<ImageItem[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-diario'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('is_official', true).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const stats = useMemo(() => ({ total: posts.length, videos: posts.filter((post) => !!post.video_url).length }), [posts]);

  function pickImages(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).flatMap((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`"${file.name}" é maior que 2MB.`);
        return [];
      }
      return [{ file, preview: URL.createObjectURL(file) }];
    });
    setImagens((current) => [...current, ...next].slice(0, 5));
  }

  function removeImage(index: number) {
    setImagens((current) => {
      const item = current[index];
      if (item) URL.revokeObjectURL(item.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function resetForm() {
    imagens.forEach((item) => URL.revokeObjectURL(item.preview));
    setTipo('noticia');
    setTitulo('');
    setCorpo('');
    setCidade('');
    setVideoUrl('');
    setAvisarWhatsapp(true);
    setImagens([]);
  }

  async function publish() {
    if (!user) return;
    const title = titulo.trim();
    const body = corpo.trim();
    const video = videoUrl.trim();
    if (title.length < 3 || title.length > 120) { toast.error('O título deve ter entre 3 e 120 caracteres.'); return; }
    if (body.length < 10) { toast.error('Escreva pelo menos 10 caracteres no texto.'); return; }
    if (tipo === 'video' && !isSupportedVideoUrl(video)) { toast.error('Use um link válido do YouTube ou Instagram.'); return; }

    setPublishing(true);
    try {
      const mediaUrls = await Promise.all(imagens.map((item) => uploadImage(user.id, item.file)));
      const { data: post, error } = await supabase.from('posts').insert({
        tipo: tipo === 'video' ? 'noticia' : tipo,
        titulo: title,
        corpo: body,
        cidade: cidade || null,
        uf: cidade ? 'GO' : null,
        prefeitura_id: null,
        autor_id: user.id,
        autor_display_name: 'Magrão',
        is_anonimo: false,
        is_official: true,
        status: 'aprovado',
        published_at: new Date().toISOString(),
        cover_url: mediaUrls[0] ?? null,
        media_urls: mediaUrls,
        video_url: tipo === 'video' ? video : null,
      }).select('*').single();
      if (error) throw error;
      if (avisarWhatsapp && post) {
        const { error: broadcastError } = await supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'post', id: post.id } });
        if (broadcastError) toast.warning('Publicado, mas o aviso no WhatsApp não foi enviado.');
      }
      toast.success('Publicação do Diário no ar!');
      qc.invalidateQueries({ queryKey: ['admin-diario'] });
      qc.invalidateQueries({ queryKey: ['posts-feed'] });
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível publicar.');
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish(post: Post) {
    const { error } = await supabase.from('posts').update({ status: 'rejeitado' }).eq('id', post.id);
    if (error) { toast.error('Não foi possível ocultar a publicação.'); return; }
    toast.success('Publicação ocultada do feed.');
    qc.invalidateQueries({ queryKey: ['admin-diario'] });
    qc.invalidateQueries({ queryKey: ['posts-feed'] });
  }

  async function remove(post: Post) {
    if (!window.confirm(`Excluir “${post.titulo}”? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) { toast.error('Não foi possível excluir a publicação.'); return; }
    toast.success('Publicação excluída.');
    qc.invalidateQueries({ queryKey: ['admin-diario'] });
    qc.invalidateQueries({ queryKey: ['posts-feed'] });
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight sm:text-3xl">
              <Megaphone className="h-6 w-6 text-primary" /> Diário do Magrão
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Publique atualizações oficiais para todo Goiás.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold text-muted-foreground">
            <Badge variant="secondary">{stats.total} publicações</Badge>
            <Badge variant="secondary">{stats.videos} vídeos</Badge>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">Nova publicação</h2>
            <p className="mt-1 text-xs text-muted-foreground">Este conteúdo entra publicado imediatamente.</p>
          </div>
          <Badge className="gap-1 bg-success/10 text-success hover:bg-success/10"><Send className="h-3 w-3" /> Ao vivo</Badge>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(tipoMeta) as DiarioTipo[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={tipo === option ? 'default' : 'outline'}
                  onClick={() => setTipo(option)}
                  className="h-auto min-h-[78px] justify-start rounded-xl p-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-bold">{tipoMeta[option].label}</span>
                    <span className="mt-1 block text-[11px] leading-snug opacity-80">{tipoMeta[option].helper}</span>
                  </span>
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diario-title">Título</Label>
              <Input id="diario-title" value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={120} placeholder="Ex.: Um novo passo para Goiás" />
              <p className="text-right text-[11px] text-muted-foreground">{titulo.length}/120</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diario-body">Texto da publicação</Label>
              <Textarea id="diario-body" value={corpo} onChange={(event) => setCorpo(event.target.value)} rows={7} maxLength={5000} placeholder="Conte a atualização com a voz do Magrão..." />
            </div>
            {tipo === 'video' && (
              <div className="space-y-1.5">
                <Label htmlFor="diario-video" className="flex items-center gap-1.5"><Video className="h-4 w-4 text-primary" /> Link do vídeo</Label>
                <div className="relative"><Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="diario-video" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className="pl-9" placeholder="https://youtube.com/... ou instagram.com/..." /></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Onde aconteceu?</Label>
              <CitySelect value={cidade} onChange={setCidade} className="w-full" label="Escolher cidade da publicação" />
              <p className="text-[11px] text-muted-foreground">Sem cidade, a publicação vale para todo Goiás.</p>
            </div>
            <div className="space-y-2">
              <Label>Fotos da publicação</Label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center transition-colors hover:bg-muted/50">
                <ImagePlus className="mb-2 h-6 w-6 text-primary" />
                <span className="text-xs font-semibold">Adicionar fotos</span>
                <span className="mt-1 text-[10px] text-muted-foreground">Até 2MB cada · primeira vira capa</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { pickImages(event.target.files); event.currentTarget.value = ''; }} />
              </label>
              {imagens.length > 0 && <div className="grid grid-cols-3 gap-2">{imagens.map((item, index) => <div key={item.preview} className="group relative aspect-square overflow-hidden rounded-lg"><img src={item.preview} alt={`Prévia ${index + 1}`} className="h-full w-full object-cover" /><Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)} aria-label={`Remover foto ${index + 1}`} className="absolute right-1 top-1 h-7 w-7 rounded-full bg-foreground/70 p-1 text-background opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"><X className="h-3 w-3" /></Button></div>)}</div>}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
              <Checkbox id="diario-whatsapp" checked={avisarWhatsapp} onCheckedChange={(checked) => setAvisarWhatsapp(checked === true)} />
              <div><Label htmlFor="diario-whatsapp" className="cursor-pointer text-xs font-bold">Avisar nos grupos de WhatsApp</Label><p className="mt-1 text-[11px] text-muted-foreground">Envia o link assim que publicar.</p></div>
            </div>
            <Button onClick={publish} disabled={publishing} className="h-11 w-full gap-2 rounded-full font-bold">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {publishing ? 'Publicando...' : 'Publicar agora'}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-lg font-extrabold">Publicações recentes</h2><p className="text-xs text-muted-foreground">Gerencie o que está visível no Diário.</p></div></div>
        {isLoading ? <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : posts.length === 0 ? <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">Ainda não há publicações oficiais.</div> : <div className="space-y-2">{posts.map((post) => <article key={post.id} className="rounded-2xl border bg-card p-4"><div className="flex gap-3">{post.cover_url ? <img src={post.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Video className="h-5 w-5" /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="text-[10px]">{post.video_url ? 'Vídeo' : post.tipo === 'projeto' ? 'Projeto' : 'Notícia'}</Badge><span className="text-[11px] text-muted-foreground">{post.cidade ? `${post.cidade}/GO` : 'Goiás inteiro'} · {timeAgoBr(post.created_at)}</span>{post.status !== 'aprovado' && <Badge variant="outline" className="text-[10px]">Oculto</Badge>}</div><h3 className="mt-1 line-clamp-2 text-sm font-bold">{post.titulo}</h3></div></div><div className="mt-3 flex flex-wrap gap-2 border-t pt-3"><Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => setEditing(post)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>{post.status === 'aprovado' && <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => unpublish(post)}>Ocultar</Button>}<Button size="sm" variant="ghost" className="h-9 gap-1.5 text-destructive hover:text-destructive" onClick={() => remove(post)}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button></div></article>)}</div>}
      </section>
      <EditPostDialog post={editing} open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-diario'] }); qc.invalidateQueries({ queryKey: ['posts-feed'] }); }} />
    </div>
  );
}
