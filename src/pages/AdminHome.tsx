import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, Inbox, Users, MessageSquare, BarChart2, ArrowRight, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { timeAgoBr } from '@/lib/timeAgoBr';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

const tipoLabel: Record<string, string> = {
  noticia: 'Notícia', projeto: 'Projeto', enquete: 'Enquete', denuncia: 'Demanda', discussao: 'Conversa',
};

export default function AdminHome() {
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    staleTime: 30_000,
    queryFn: async () => {
      const [pend, apoios, coments, enquetes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('apoiadores').select('id', { count: 'exact', head: true }),
        supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('is_hidden', false),
        supabase.from('polls').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        pendentes: pend.count ?? 0,
        apoiadores: apoios.count ?? 0,
        comentarios: coments.count ?? 0,
        enquetes: enquetes.count ?? 0,
      };
    },
  });

  const { data: fila = [], isLoading } = useQuery({
    queryKey: ['admin-fila'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts').select('*').eq('status', 'pendente')
        .order('created_at', { ascending: true }).limit(5);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  async function decide(post: Post, aprovar: boolean) {
    const patch = aprovar
      ? { status: 'aprovado' as const, published_at: new Date().toISOString() }
      : { status: 'rejeitado' as const };
    const { error } = await supabase.from('posts').update(patch).eq('id', post.id);
    if (error) { toast.error('Não deu para salvar agora.'); return; }
    toast.success(aprovar ? 'Publicado no site.' : 'Recusado.');
    qc.invalidateQueries({ queryKey: ['admin-fila'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    qc.invalidateQueries({ queryKey: ['admin-conteudo'] });
    qc.invalidateQueries({ queryKey: ['posts-feed'] });
    supabase.functions.invoke('notify-post-status', { body: { post_id: post.id } }).catch(() => {});
    if (aprovar) supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'post', id: post.id } }).catch(() => {});
  }

  const cards = [
    { label: 'Esperando decisão', value: stats?.pendentes ?? 0, icon: Inbox, to: '/admin/conteudo' },
    { label: 'Apoiadores', value: stats?.apoiadores ?? 0, icon: Users, to: '/admin/conteudo' },
    { label: 'Comentários', value: stats?.comentarios ?? 0, icon: MessageSquare, to: '/admin/conteudo?aba=comentarios' },
    { label: 'Enquetes no ar', value: stats?.enquetes ?? 0, icon: BarChart2, to: '/admin/enquetes' },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">O que precisa da sua decisão hoje.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border bg-card p-3.5 transition hover:border-primary/40 hover:shadow-card"
          >
            <c.icon className="mb-2 h-4 w-4 text-primary" />
            <p className="font-display text-2xl font-black leading-none">{c.value}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-bold">Fila rápida</p>
          <Link to="/admin/conteudo" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : fila.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Check className="mx-auto mb-2 h-7 w-7 text-success" />
            Nada pendente. Tudo em dia!
          </div>
        ) : (
          <ul className="divide-y">
            {fila.map((p) => (
              <li key={p.id} className="p-3.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{tipoLabel[p.tipo] ?? p.tipo}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {p.is_anonimo ? 'Anônimo' : p.autor_display_name} · {timeAgoBr(p.created_at)}
                    {p.cidade ? ` · ${p.cidade}` : ''}
                  </span>
                </div>
                <p className="mb-2.5 text-sm font-semibold leading-snug">{p.titulo}</p>
                {p.corpo && <p className="mb-2.5 line-clamp-3 text-[13px] text-muted-foreground">{p.corpo}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="h-9 flex-1" onClick={() => decide(p, true)}>
                    <Check className="h-4 w-4" /> Publicar
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 flex-1" onClick={() => decide(p, false)}>
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-12 justify-start rounded-2xl">
          <Link to="/admin/diario"><Radio className="h-4 w-4" /> Publicar no Diário</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start rounded-2xl">
          <Link to="/admin/enquetes"><BarChart2 className="h-4 w-4" /> Criar enquete</Link>
        </Button>
      </div>
    </div>
  );
}
