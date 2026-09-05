import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Loader2, Check, X, Search, Pencil, Trash2, ExternalLink, Eye, EyeOff, Award,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditPostDialog from '@/components/admin/EditPostDialog';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];
type Selo = Database['public']['Enums']['post_selo'];
type Comment = {
  id: string; post_id: string; autor_display_name: string; conteudo: string;
  created_at: string; is_hidden: boolean;
};

type Aba = 'pendentes' | 'publicadas' | 'comentarios';

const ABAS: { value: Aba; label: string }[] = [
  { value: 'pendentes', label: 'Esperando' },
  { value: 'publicadas', label: 'No site' },
  { value: 'comentarios', label: 'Comentários' },
];

const tipoLabel: Record<string, string> = {
  noticia: 'Notícia', projeto: 'Projeto', enquete: 'Enquete', denuncia: 'Demanda', discussao: 'Conversa',
};

const SELO_META: Record<Selo, { label: string; className: string }> = {
  resolvido_magrao: { label: 'Resolvido pelo Magrão', className: 'bg-success/15 text-success' },
  em_andamento: { label: 'Em andamento', className: 'bg-warning/15 text-warning' },
  encaminhado_camara: { label: 'Encaminhado à Câmara', className: 'bg-primary/15 text-primary' },
};

export default function AdminConteudo() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const aba = (params.get('aba') as Aba) ?? 'pendentes';
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<{ kind: 'post' | 'comment'; id: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function setAba(v: Aba) {
    setParams(v === 'pendentes' ? {} : { aba: v });
  }

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['admin-conteudo', aba],
    enabled: aba !== 'comentarios',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts').select('*')
        .eq('status', aba === 'pendentes' ? 'pendente' : 'aprovado')
        .order('created_at', { ascending: aba === 'pendentes' })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['admin-comentarios'],
    enabled: aba === 'comentarios',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, post_id, autor_display_name, conteudo, created_at, is_hidden')
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const term = q.trim().toLowerCase();
  const filteredPosts = useMemo(
    () => posts.filter((p) => !term || `${p.titulo} ${p.corpo ?? ''} ${p.autor_display_name}`.toLowerCase().includes(term)),
    [posts, term],
  );
  const filteredComments = useMemo(
    () => comments.filter((c) => !term || `${c.conteudo} ${c.autor_display_name}`.toLowerCase().includes(term)),
    [comments, term],
  );

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-conteudo'] });
    qc.invalidateQueries({ queryKey: ['admin-comentarios'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-fila'] });
    qc.invalidateQueries({ queryKey: ['posts-feed'] });
  }

  async function decide(post: Post, aprovar: boolean) {
    setBusy(true);
    const patch = aprovar
      ? { status: 'aprovado' as const, published_at: new Date().toISOString() }
      : { status: 'rejeitado' as const };
    const { error } = await supabase.from('posts').update(patch).eq('id', post.id);
    setBusy(false);
    if (error) { toast.error('Não deu para salvar agora.'); return; }
    toast.success(aprovar ? 'Publicado no site.' : 'Recusado.');
    refresh();
    supabase.functions.invoke('notify-post-status', { body: { post_id: post.id } }).catch(() => {});
    if (aprovar) supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'post', id: post.id } }).catch(() => {});
  }

  async function applySelo(post: Post, selo: Selo | null) {
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from('posts').update({
      selo,
      selo_em: selo ? new Date().toISOString() : null,
      selo_por: selo ? userRes.user?.id ?? null : null,
    }).eq('id', post.id);
    if (error) { toast.error('Não deu para aplicar o destaque.'); return; }
    toast.success(selo ? 'Destaque aplicado.' : 'Destaque removido.');
    refresh();
    if (selo) supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'selo', id: post.id } }).catch(() => {});
  }

  async function toggleComment(c: Comment) {
    const { error } = await supabase.from('post_comments').update({ is_hidden: !c.is_hidden }).eq('id', c.id);
    if (error) { toast.error('Não deu para atualizar.'); return; }
    toast.success(c.is_hidden ? 'Comentário liberado.' : 'Comentário escondido.');
    refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    if (deleting.kind === 'post') {
      await supabase.from('post_comments').delete().eq('post_id', deleting.id);
      await supabase.from('post_reactions').delete().eq('post_id', deleting.id);
    }
    const { error } = await supabase
      .from(deleting.kind === 'post' ? 'posts' : 'post_comments')
      .delete().eq('id', deleting.id);
    setBusy(false);
    if (error) { toast.error('Não deu para apagar: ' + error.message); return; }
    toast.success('Apagado.');
    setDeleting(null);
    refresh();
  }

  const loading = aba === 'comentarios' ? loadingComments : loadingPosts;

  return (
    <div className="animate-fade-up space-y-3">
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight">Conteúdo</h1>
        <p className="text-sm text-muted-foreground">Decida, destaque, edite ou apague em um toque.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {ABAS.map((t) => (
          <button
            key={t.value}
            onClick={() => setAba(t.value)}
            className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition ${
              aba === t.value ? 'bg-foreground text-background' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="h-10 pl-9" />
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : aba === 'comentarios' ? (
        filteredComments.length === 0 ? (
          <Empty text="Nenhum comentário por aqui." />
        ) : (
          <ul className="space-y-2">
            {filteredComments.map((c) => (
              <li key={c.id} className="rounded-2xl border bg-card p-3.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.autor_display_name}</span>
                  <span>· {timeAgoBr(c.created_at)}</span>
                  {c.is_hidden && <Badge variant="outline" className="text-[10px]">Escondido</Badge>}
                </div>
                <p className="mb-2.5 whitespace-pre-wrap text-[13px]">{c.conteudo}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-9" onClick={() => toggleComment(c)}>
                    {c.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {c.is_hidden ? 'Liberar' : 'Esconder'}
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting({ kind: 'comment', id: c.id, label: c.conteudo.slice(0, 60) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Apagar
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-9">
                    <Link to={`/reclamacao/${c.post_id}`} target="_blank">
                      Ver publicação <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : filteredPosts.length === 0 ? (
        <Empty text={aba === 'pendentes' ? 'Nada esperando decisão. Tudo em dia!' : 'Nenhuma publicação no site ainda.'} />
      ) : (
        <ul className="space-y-2">
          {filteredPosts.map((p) => {
            const meta = p.selo ? SELO_META[p.selo as Selo] : null;
            return (
              <li key={p.id} className="rounded-2xl border bg-card p-3.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{tipoLabel[p.tipo] ?? p.tipo}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {p.is_anonimo ? 'Anônimo' : p.autor_display_name} · {timeAgoBr(p.created_at)}
                    {p.cidade ? ` · ${p.cidade}` : ''}
                  </span>
                  {meta && <Badge className={`border-0 text-[10px] ${meta.className}`}>{meta.label}</Badge>}
                </div>
                <p className="mb-1.5 text-sm font-semibold leading-snug">{p.titulo}</p>
                {p.corpo && <p className="mb-2.5 line-clamp-3 text-[13px] text-muted-foreground">{p.corpo}</p>}

                <div className="flex flex-wrap gap-2">
                  {aba === 'pendentes' ? (
                    <>
                      <Button size="sm" className="h-9 flex-1" disabled={busy} onClick={() => decide(p, true)}>
                        <Check className="h-4 w-4" /> Publicar
                      </Button>
                      <Button size="sm" variant="outline" className="h-9 flex-1" disabled={busy} onClick={() => decide(p, false)}>
                        <X className="h-4 w-4" /> Recusar
                      </Button>
                    </>
                  ) : (
                    <Select
                      value={p.selo ?? 'none'}
                      onValueChange={(v) => applySelo(p, v === 'none' ? null : (v as Selo))}
                    >
                      <SelectTrigger className="h-9 w-full sm:w-[230px]">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <SelectValue placeholder="Destaque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem destaque</SelectItem>
                        <SelectItem value="resolvido_magrao">✅ Resolvido pelo Magrão</SelectItem>
                        <SelectItem value="em_andamento">⏳ Em andamento</SelectItem>
                        <SelectItem value="encaminhado_camara">📋 Encaminhado à Câmara</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting({ kind: 'post', id: p.id, label: p.titulo })}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Apagar
                  </Button>
                  {aba === 'publicadas' && (
                    <Button asChild size="sm" variant="ghost" className="h-9">
                      <Link to={`/reclamacao/${p.id}`} target="_blank">
                        Ver <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditPostDialog
        post={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar de vez?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.label}” sai do site para sempre{deleting?.kind === 'post' ? ', junto com os comentários e apoios' : ''}. Não tem como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
