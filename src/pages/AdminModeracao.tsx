import { useEffect, useMemo, useState } from 'react';
import { Check, X, Loader2, MapPin, Search, Filter, Pencil } from 'lucide-react';
import EditPostDialog from '@/components/admin/EditPostDialog';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

const tipoLabel: Record<string, string> = {
  noticia: 'Notícia', projeto: 'Projeto', enquete: 'Enquete', denuncia: 'Denúncia', discussao: 'Discussão',
};

const TIPOS = ['noticia', 'projeto', 'enquete', 'denuncia', 'discussao'];

export default function AdminModeracao() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [q, setQ] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTargets, setRejectTargets] = useState<string[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);


  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
      .limit(200);
    setPosts((data ?? []) as Post[]);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (tipoFilter !== 'todos' && p.tipo !== tipoFilter) return false;
      if (q && !`${p.titulo} ${p.corpo ?? ''} ${p.autor_display_name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [posts, tipoFilter, q]);

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map(p => p.id)));
  }
  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function approve(ids: string[]) {
    if (ids.length === 0) return;
    setActing(true);
    const { error } = await supabase.from('posts').update({
      status: 'aprovado',
      published_at: new Date().toISOString(),
    }).in('id', ids);
    setActing(false);
    if (error) { toast.error('Falha ao aprovar.'); return; }
    setPosts(prev => prev.filter(x => !ids.includes(x.id)));
    setSelected(new Set());
    toast.success(ids.length === 1 ? 'Publicado!' : `${ids.length} posts publicados.`);
    ids.forEach(id => supabase.functions.invoke('notify-post-status', { body: { post_id: id } }).catch(() => {}));
    ids.forEach(id => supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'post', id } }).catch(() => {}));
  }

  function openReject(ids: string[]) {
    if (ids.length === 0) return;
    setRejectTargets(ids);
    setRejectNote('');
    setRejectOpen(true);
  }

  async function confirmReject() {
    if (!rejectNote.trim()) { toast.error('Informe o motivo.'); return; }
    setActing(true);
    const { error } = await supabase.from('posts').update({
      status: 'rejeitado',
      moderation_note: rejectNote.trim(),
    }).in('id', rejectTargets);
    setActing(false);
    if (error) { toast.error('Falha ao rejeitar.'); return; }
    setPosts(prev => prev.filter(x => !rejectTargets.includes(x.id)));
    setSelected(new Set());
    toast.success(rejectTargets.length === 1 ? 'Post rejeitado.' : `${rejectTargets.length} posts rejeitados.`);
    rejectTargets.forEach(id => supabase.functions.invoke('notify-post-status', { body: { post_id: id } }).catch(() => {}));
    setRejectOpen(false);
    setRejectTargets([]);
    setRejectNote('');
  }

  const selectedCount = selected.size;

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Moderação</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {posts.length} pendente{posts.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border bg-card p-3 shadow-card mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por título, corpo ou autor..."
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPOS.map(t => (
                <SelectItem key={t} value={t}>{tipoLabel[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedCount > 0 && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3 mb-3 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20">
          <span className="text-sm font-semibold">{selectedCount} selecionado{selectedCount === 1 ? '' : 's'}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            <Button size="sm" variant="outline" onClick={() => openReject([...selected])} disabled={acting}>
              <X className="h-4 w-4" /> Rejeitar
            </Button>
            <Button size="sm" onClick={() => approve([...selected])} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aprovar
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30 text-xs font-semibold text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
          <span>Selecionar todos os visíveis</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center text-muted-foreground">
            <Check className="mx-auto h-8 w-8 text-success mb-2" />
            {posts.length === 0 ? 'Fila vazia. Tudo em dia!' : 'Nenhum post corresponde aos filtros.'}
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map(p => {
              const isOpen = expanded.has(p.id);
              const isSel = selected.has(p.id);
              return (
                <li key={p.id} className={`p-3 sm:p-4 transition ${isSel ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  <div className="flex gap-3">
                    <Checkbox checked={isSel} onCheckedChange={() => toggle(p.id)} className="mt-1" aria-label={`Selecionar ${p.titulo}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{tipoLabel[p.tipo] ?? p.tipo}</Badge>
                        {p.categoria && <Badge variant="outline" className="text-[10px]">{p.categoria}</Badge>}
                        {p.cidade && (
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{p.cidade}/{p.uf}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          · {p.autor_display_name} · {timeAgoBr(p.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-left font-semibold text-sm sm:text-base leading-snug hover:text-primary transition block w-full"
                      >
                        {p.titulo}
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-2">
                          {p.corpo && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{p.corpo}</p>}
                          {p.cover_url && <img src={p.cover_url} alt="" className="rounded-lg max-h-64 w-full object-cover" />}
                          {Array.isArray(p.enquete_opcoes) && p.enquete_opcoes.length > 0 && (
                            <ul className="space-y-1">
                              {(p.enquete_opcoes as any[]).map((o, i) => (
                                <li key={i} className="text-sm rounded border px-3 py-1.5">{o.texto}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleExpand(p.id)} className="h-8 text-xs">
                          {isOpen ? 'Recolher' : 'Ver conteúdo'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(p)} className="h-8 text-xs">
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <div className="flex-1" />

                        <Button size="sm" variant="outline" onClick={() => openReject([p.id])} disabled={acting} className="h-8">
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Rejeitar</span>
                        </Button>
                        <Button size="sm" onClick={() => approve([p.id])} disabled={acting} className="h-8">
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Aprovar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Rejeitar {rejectTargets.length === 1 ? 'post' : `${rejectTargets.length} posts`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Motivo (enviado ao autor)</label>
            <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} placeholder="Ex: Conteúdo sem fonte verificável..." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditPostDialog
        post={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSaved={(updated) => setPosts(prev => prev.map(x => x.id === updated.id ? updated : x))}
      />
    </div>
  );

}
