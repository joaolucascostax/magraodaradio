import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2, Plus, Trash2, Eye, EyeOff, Loader2, Search, CheckCircle2, Clock, XCircle,
  X, ImagePlus, Vote,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { fetchPolls } from '@/lib/api';
import type { Poll } from '@/data/mockData';

const STATUS_META = {
  ativa: { label: 'Ao vivo', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  encerrada: { label: 'Encerrada', icon: XCircle, className: 'bg-muted text-muted-foreground' },
} as const;

type NovaOpcao = { id: string; text: string; file: File | null; preview: string | null };

function novaOpcaoVazia(): NovaOpcao {
  return { id: crypto.randomUUID(), text: '', file: null, preview: null };
}

async function uploadImagem(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/poll-options/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const up = await supabase.storage.from('post-media').upload(path, file, { upsert: false });
  if (up.error) throw new Error('Upload falhou: ' + up.error.message);
  const { data: signed, error } = await supabase.storage
    .from('post-media').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
  if (error || !signed) throw new Error('Falha ao gerar URL da imagem.');
  return signed.signedUrl;
}

export default function AdminEnquetes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativa' | 'encerrada'>('todos');
  const [q, setQ] = useState('');
  const [toDelete, setToDelete] = useState<Poll | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form
  const [pergunta, setPergunta] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [opcoes, setOpcoes] = useState<NovaOpcao[]>([novaOpcaoVazia(), novaOpcaoVazia()]);
  const [saving, setSaving] = useState(false);

  const { data: polls = [], isLoading } = useQuery({ queryKey: ['polls'], queryFn: fetchPolls });

  const filtered = useMemo(() => polls.filter((p) => {
    if (statusFilter === 'ativa' && !p.isActive) return false;
    if (statusFilter === 'encerrada' && p.isActive) return false;
    if (q && !p.question.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [polls, statusFilter, q]);

  const stats = useMemo(() => ({
    total: polls.length,
    ativas: polls.filter((p) => p.isActive).length,
    encerradas: polls.filter((p) => !p.isActive).length,
  }), [polls]);

  function resetForm() {
    setPergunta(''); setAllowMultiple(false);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null); setCoverPreview(null);
    opcoes.forEach((o) => o.preview && URL.revokeObjectURL(o.preview));
    setOpcoes([novaOpcaoVazia(), novaOpcaoVazia()]);
  }

  function handleCoverPick(f: File | null) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (!f) { setCoverFile(null); setCoverPreview(null); return; }
    if (f.size > 3 * 1024 * 1024) { toast.error('Capa maior que 3MB.'); return; }
    setCoverFile(f); setCoverPreview(URL.createObjectURL(f));
  }

  function handleOpcaoImagem(idx: number, f: File | null) {
    setOpcoes((prev) => prev.map((o, i) => {
      if (i !== idx) return o;
      if (o.preview) URL.revokeObjectURL(o.preview);
      if (!f) return { ...o, file: null, preview: null };
      if (f.size > 2 * 1024 * 1024) { toast.error('Imagem maior que 2MB.'); return o; }
      return { ...o, file: f, preview: URL.createObjectURL(f) };
    }));
  }

  const criar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('sem usuário');
      const perguntaOk = pergunta.trim();
      const opcoesOk = opcoes.map((o) => ({ ...o, text: o.text.trim() })).filter((o) => o.text);
      if (perguntaOk.length < 5) throw new Error('Pergunta muito curta.');
      if (opcoesOk.length < 2) throw new Error('Adicione ao menos 2 opções.');

      setSaving(true);
      const coverUrl = coverFile ? await uploadImagem(user.id, coverFile) : null;

      const { data: poll, error: e1 } = await supabase
        .from('polls')
        .insert({
          question: perguntaOk,
          allow_multiple: allowMultiple,
          cover_url: coverUrl,
          created_by: user.id,
          tipo: 'comum',
        } as any)
        .select().single();
      if (e1) throw e1;

      const rows = await Promise.all(opcoesOk.map(async (o, i) => ({
        poll_id: poll.id,
        text: o.text,
        position: i,
        foto_url: o.file ? await uploadImagem(user.id, o.file) : null,
      })));
      const { error: e2 } = await supabase.from('poll_options').insert(rows);
      if (e2) throw e2;
      return poll.id as string;
    },
    onSuccess: (pollId) => {
      toast.success('Enquete publicada!');
      qc.invalidateQueries({ queryKey: ['polls'] });
      resetForm(); setDialogOpen(false);
      if (pollId) {
        supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'poll', id: pollId } }).catch(() => {});
      }
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao criar enquete.'),
    onSettled: () => setSaving(false),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase.from('polls').update({ is_active: next }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.next ? 'Enquete publicada' : 'Enquete arquivada');
      qc.invalidateQueries({ queryKey: ['polls'] });
    },
    onError: () => toast.error('Falha ao atualizar.'),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('polls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enquete excluída');
      qc.invalidateQueries({ queryKey: ['polls'] });
      setToDelete(null);
    },
    onError: () => toast.error('Falha ao excluir'),
  });

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" /> Enquetes
          </h1>
          <p className="text-sm text-muted-foreground">Consultas populares — criadas apenas pela equipe editorial.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nova enquete
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard n={stats.total} label="Total" />
        <StatCard n={stats.ativas} label="Ao vivo" tone="text-success" />
        <StatCard n={stats.encerradas} label="Encerradas" tone="text-muted-foreground" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por pergunta..." className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativa">Ao vivo</SelectItem>
            <SelectItem value="encerrada">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed bg-card">
          <BarChart2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Nenhuma enquete encontrada.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Criar primeira enquete
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((poll) => {
            const total = poll.options.reduce((s, o) => s + o.votes, 0);
            const meta = STATUS_META[poll.isActive ? 'ativa' : 'encerrada'];
            const Icon = meta.icon;
            return (
              <li key={poll.id} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] gap-1 border-0 ${meta.className}`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                    {poll.allowMultiple && (
                      <Badge variant="outline" className="text-[10px]">Múltipla escolha</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{timeAgoBr(poll.createdAt)}</span>
                    <span className="text-[11px] text-muted-foreground">· {total} {total === 1 ? 'voto' : 'votos'}</span>
                  </div>
                </div>
                {poll.coverUrl && (
                  <img src={poll.coverUrl} alt="" className="mb-3 h-32 w-full object-cover rounded-xl" />
                )}
                <h3 className="font-bold text-sm sm:text-base leading-snug break-words mb-2">{poll.question}</h3>
                <ul className="space-y-1.5 mb-3">
                  {poll.options.map((o) => {
                    const pct = total ? Math.round((o.votes / total) * 100) : 0;
                    return (
                      <li key={o.id} className="text-xs">
                        <div className="flex justify-between mb-0.5 gap-2">
                          <span className="flex items-center gap-1.5 min-w-0 break-words">
                            {o.imageUrl && <img src={o.imageUrl} alt="" className="h-5 w-5 rounded object-cover" />}
                            {o.text}
                          </span>
                          <span className="text-muted-foreground tabular-nums shrink-0">{o.votes} · {pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex gap-2 flex-wrap pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5"
                    disabled={toggleActive.isPending}
                    onClick={() => toggleActive.mutate({ id: poll.id, next: !poll.isActive })}>
                    {poll.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Arquivar</> : <><Eye className="h-3.5 w-3.5" /> Publicar</>}
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="gap-1.5">
                    <Link to={`/enquetes/${poll.id}`}><Vote className="h-3.5 w-3.5" /> Ver</Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                    onClick={() => setToDelete(poll)}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Dialog: nova enquete */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!saving) { setDialogOpen(o); if (!o) resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" /> Nova enquete
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Pergunta</Label>
              <Textarea value={pergunta} onChange={(e) => setPergunta(e.target.value)} rows={2}
                placeholder="O que você quer perguntar pra cidade?" maxLength={200} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">{pergunta.length}/200</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label className="text-sm font-semibold">Múltipla escolha</Label>
                <p className="text-[11px] text-muted-foreground">Eleitor pode marcar mais de uma opção.</p>
              </div>
              <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
            </div>

            <div>
              <Label className="text-sm font-semibold">Banner de capa (opcional)</Label>
              {coverPreview ? (
                <div className="mt-2 relative rounded-xl overflow-hidden border aspect-[16/9]">
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleCoverPick(null)}
                    className="absolute top-2 right-2 rounded-full bg-background/90 p-1 shadow" aria-label="Remover capa">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50">
                  <ImagePlus className="h-4 w-4" />
                  <span>Adicionar capa — até 3MB</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleCoverPick(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Opções ({opcoes.length}/6)</Label>
                {opcoes.length < 6 && (
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => setOpcoes((p) => [...p, novaOpcaoVazia()])}>
                    + Opção
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {opcoes.map((o, i) => (
                  <div key={o.id} className="rounded-xl border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input value={o.text} placeholder={`Opção ${i + 1}`} maxLength={100}
                        onChange={(e) => setOpcoes((p) => p.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))} />
                      {opcoes.length > 2 && (
                        <Button type="button" variant="ghost" size="icon"
                          onClick={() => {
                            const rem = opcoes[i];
                            if (rem.preview) URL.revokeObjectURL(rem.preview);
                            setOpcoes((p) => p.filter((_, idx) => idx !== i));
                          }} aria-label="Remover opção">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {o.preview ? (
                        <div className="relative">
                          <img src={o.preview} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                          <button type="button" onClick={() => handleOpcaoImagem(i, null)}
                            className="absolute -top-1 -right-1 rounded-full bg-background border p-0.5 shadow"
                            aria-label="Remover imagem">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer rounded-lg border-2 border-dashed px-3 py-2 hover:bg-muted/40">
                          <ImagePlus className="h-3.5 w-3.5" /> Foto da opção
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => handleOpcaoImagem(i, e.target.files?.[0] ?? null)} />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => criar.mutate()} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar enquete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir enquete?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Todos os votos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && excluir.mutate(toDelete.id)}
              className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ n, label, tone }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className={`text-2xl font-black tabular-nums ${tone ?? ''}`}>{n}</p>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
