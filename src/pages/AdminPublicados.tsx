import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Award, Search, ExternalLink, MapPin, Pencil, Trash2 } from 'lucide-react';
import EditPostDialog from '@/components/admin/EditPostDialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];
type Selo = Database['public']['Enums']['post_selo'];

const SELO_META: Record<Selo, { label: string; className: string }> = {
  resolvido_magrao: { label: 'Resolvido pelo Magrão', className: 'bg-success/15 text-success' },
  em_andamento: { label: 'Em andamento', className: 'bg-warning/15 text-warning' },
  encaminhado_camara: { label: 'Encaminhado à Câmara', className: 'bg-primary/15 text-primary' },
};

const tipoLabel: Record<string, string> = {
  noticia: 'Notícia', projeto: 'Projeto', enquete: 'Enquete', denuncia: 'Denúncia', discussao: 'Discussão',
};

export default function AdminPublicados() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);


  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-publicados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts').select('*').eq('status', 'aprovado')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const filtered = useMemo(() => posts.filter(p =>
    !q || `${p.titulo} ${p.autor_display_name ?? ''}`.toLowerCase().includes(q.toLowerCase())
  ), [posts, q]);

  const setSelo = useMutation({
    mutationFn: async ({ id, selo }: { id: string; selo: Selo | null }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from('posts').update({
        selo,
        selo_em: selo ? new Date().toISOString() : null,
        selo_por: selo ? userRes.user?.id ?? null : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-publicados'] });
      qc.invalidateQueries({ queryKey: ['posts-feed'] });
      toast.success(v.selo ? 'Selo aplicado.' : 'Selo removido.');
      if (v.selo) {
        supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'selo', id: v.id } })
          .then(({ error }) => { if (error) toast.error('Falha no disparo do zap: ' + error.message); });
      }
    },
    onError: () => toast.error('Falha ao atualizar selo.'),
  });

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Publicações aprovadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Aplique selos de acompanhamento (Resolvido pelo Magrão, Em andamento, Encaminhado à Câmara). Aplicar selo dispara aviso no WhatsApp.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-3 mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por título ou autor..." className="pl-9 h-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-14 text-center rounded-2xl border border-dashed bg-card text-muted-foreground">
          Nenhuma publicação encontrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(p => {
            const meta = p.selo ? SELO_META[p.selo as Selo] : null;
            return (
              <li key={p.id} className="rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">{tipoLabel[p.tipo] ?? p.tipo}</Badge>
                  {p.bairro && (
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{p.bairro}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    · {p.is_anonimo ? 'Anônimo' : p.autor_display_name} · {timeAgoBr(p.created_at)}
                  </span>
                  {meta && (
                    <Badge className={`text-[10px] border-0 ${meta.className}`}>{meta.label}</Badge>
                  )}
                </div>
                <p className="font-semibold text-sm sm:text-base leading-snug mb-2">{p.titulo}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={p.selo ?? 'none'}
                    onValueChange={(v) => setSelo.mutate({ id: p.id, selo: v === 'none' ? null : (v as Selo) })}
                  >
                    <SelectTrigger className="h-9 w-[240px]">
                      <SelectValue placeholder="Aplicar selo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem selo</SelectItem>
                      <SelectItem value="resolvido_magrao">✅ Resolvido pelo Magrão</SelectItem>
                      <SelectItem value="em_andamento">⏳ Em andamento</SelectItem>
                      <SelectItem value="encaminhado_camara">📋 Encaminhado à Câmara</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Link
                    to={`/reclamacao/${p.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    Ver post <ExternalLink className="h-3 w-3" />
                  </Link>

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
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['admin-publicados'] });
          qc.invalidateQueries({ queryKey: ['posts-feed'] });
        }}
      />
    </div>
  );
}

