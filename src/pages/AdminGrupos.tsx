import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Send, ToggleLeft, ToggleRight, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';

type Group = {
  id: string;
  jid: string;
  nome: string;
  ativo: boolean;
  created_at: string;
};

const schema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(80),
  jid: z.string().trim().regex(/@g\.us$/i, 'JID deve terminar com @g.us'),
});

export default function AdminGrupos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [jid, setJid] = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['wa-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Group[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ nome, jid });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      const { error } = await supabase.from('whatsapp_groups').insert({
        nome: parsed.data.nome, jid: parsed.data.jid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grupo adicionado');
      qc.invalidateQueries({ queryKey: ['wa-groups'] });
      setOpen(false); setNome(''); setJid('');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao adicionar'),
  });

  const toggle = useMutation({
    mutationFn: async (g: Group) => {
      const { error } = await supabase
        .from('whatsapp_groups').update({ ativo: !g.ativo }).eq('id', g.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-groups'] }),
    onError: () => toast.error('Falha ao alternar'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grupo removido');
      qc.invalidateQueries({ queryKey: ['wa-groups'] });
    },
    onError: () => toast.error('Falha ao remover'),
  });

  async function testar(g: Group) {
    const t = toast.loading(`Enviando ping para ${g.nome}…`);
    const { error, data } = await supabase.functions.invoke('whatsapp-broadcast', {
      body: { kind: 'ping', id: g.id, group_jid: g.jid },
    });
    toast.dismiss(t);
    if (error) { toast.error('Falha no disparo: ' + error.message); return; }
    const r = (data as any)?.results?.[0];
    if (r?.ok) toast.success(`Enviado para ${g.nome}`);
    else toast.error(`Falhou: ${r?.erro ?? 'desconhecido'}`);
  }

  const ativos = useMemo(() => groups.filter(g => g.ativo).length, [groups]);

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Grupos WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} cadastrado{groups.length === 1 ? '' : 's'} · {ativos} ativo{ativos === 1 ? '' : 's'}. Publicações aprovadas e novas enquetes são disparadas nos grupos ativos.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar grupo
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-4 mb-5 text-xs text-muted-foreground">
        <strong className="text-foreground">Como pegar o JID:</strong> abra a Evolution Manager → aba <em>Groups</em> da instância <code>{`{instância}`}</code>, copie o campo <code>id</code> do grupo (algo como <code>120363XXXXXXX@g.us</code>).
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed bg-card">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado ainda.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map(g => (
            <li key={g.id} className="rounded-2xl border bg-card p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{g.nome}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{g.jid}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${g.ativo ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {g.ativo ? 'Ativo' : 'Inativo'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => toggle.mutate(g)} disabled={toggle.isPending} className="gap-1.5">
                {g.ativo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {g.ativo ? 'Desativar' : 'Ativar'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => testar(g)} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> Testar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remover ${g.nome}?`)) remove.mutate(g.id); }}
                className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo grupo WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Nome amigável</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Grupo Magrão Goiás" />
            </div>
            <div>
              <Label className="text-sm">JID do grupo</Label>
              <Input value={jid} onChange={e => setJid(e.target.value)} placeholder="120363XXXXXXX@g.us" className="font-mono text-xs" />
              <p className="text-[11px] text-muted-foreground mt-1">A Evolution precisa estar dentro deste grupo.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
