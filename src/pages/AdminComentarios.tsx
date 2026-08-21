import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, Eye, Ban, Loader2, Search, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';

type Row = {
  id: string;
  post_id: string;
  autor_id: string | null;
  autor_display_name: string;
  conteudo: string;
  created_at: string;
  is_hidden: boolean;
};

export default function AdminComentarios() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'visiveis' | 'ocultos'>('todos');
  const [banOpen, setBanOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<Row | null>(null);
  const [banReason, setBanReason] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('post_comments')
      .select('id, post_id, autor_id, autor_display_name, conteudo, created_at, is_hidden')
      .order('created_at', { ascending: false })
      .limit(200);
    setRows((data ?? []) as Row[]);
    setSelected(new Set());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (statusFilter === 'visiveis' && r.is_hidden) return false;
    if (statusFilter === 'ocultos' && !r.is_hidden) return false;
    if (q && !`${r.conteudo} ${r.autor_display_name}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map(r => r.id)));
  }

  async function setHidden(ids: string[], hidden: boolean) {
    if (ids.length === 0) return;
    setActing(true);
    const { error } = await supabase.from('post_comments').update({ is_hidden: hidden }).in('id', ids);
    setActing(false);
    if (error) { toast.error('Falha ao atualizar.'); return; }
    setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, is_hidden: hidden } : r));
    setSelected(new Set());
    toast.success(hidden ? 'Comentários ocultados.' : 'Comentários restaurados.');
  }

  function openBan(r: Row) {
    if (!r.autor_id) { toast.error('Comentário anônimo, não é possível banir.'); return; }
    setBanTarget(r);
    setBanReason('');
    setBanOpen(true);
  }
  async function confirmBan() {
    if (!banTarget?.autor_id || !banReason.trim()) { toast.error('Informe o motivo.'); return; }
    setActing(true);
    const { error } = await supabase.from('banned_users').insert({
      user_id: banTarget.autor_id,
      motivo: banReason.trim(),
      banned_by: user?.id ?? null,
    });
    setActing(false);
    if (error) { toast.error('Falha: ' + error.message); return; }
    toast.success('Usuário banido.');
    setBanOpen(false);
    setBanTarget(null);
    setBanReason('');
  }

  const selectedCount = selected.size;

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Comentários</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} de {rows.length} comentários</p>
      </div>

      <div className="rounded-2xl border bg-card p-3 shadow-card mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por texto ou autor..." className="pl-9 h-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="visiveis">Visíveis</SelectItem>
              <SelectItem value="ocultos">Ocultos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3 mb-3 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20">
          <span className="text-sm font-semibold">{selectedCount} selecionado{selectedCount === 1 ? '' : 's'}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
            <Button size="sm" variant="outline" onClick={() => setHidden([...selected], false)} disabled={acting}>
              <Eye className="h-4 w-4" />Restaurar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setHidden([...selected], true)} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
              Ocultar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30 text-xs font-semibold text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
          <span>Selecionar todos os visíveis</span>
        </div>

        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center text-muted-foreground text-sm">Nenhum comentário encontrado.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map(r => {
              const isSel = selected.has(r.id);
              return (
                <li key={r.id} className={`p-3 sm:p-4 transition ${isSel ? 'bg-primary/5' : 'hover:bg-muted/30'} ${r.is_hidden ? 'opacity-60' : ''}`}>
                  <div className="flex gap-3">
                    <Checkbox checked={isSel} onCheckedChange={() => toggle(r.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
                        <span className="font-semibold text-foreground">{r.autor_display_name}</span>
                        <span>· {timeAgoBr(r.created_at)}</span>
                        {r.is_hidden && <span className="text-warning font-semibold">· oculto</span>}
                        <Link to={`/reclamacao/${r.post_id}`} className="ml-auto text-primary hover:underline inline-flex items-center gap-1">
                          ver post <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{r.conteudo}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setHidden([r.id], !r.is_hidden)} disabled={acting} className="h-8">
                          {r.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {r.is_hidden ? 'Restaurar' : 'Ocultar'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openBan(r)} disabled={acting || !r.autor_id} className="h-8">
                          <Ban className="h-3.5 w-3.5" />Banir autor
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

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir {banTarget?.autor_display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              O usuário não poderá mais interagir na plataforma. Esta ação pode ser revertida removendo-o da lista de banidos.
            </p>
            <label className="text-sm font-semibold">Motivo</label>
            <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} placeholder="Ex: Discurso de ódio, spam repetido..." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBan} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar banimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
