import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Users, MessageSquare, Vote, Inbox, MessagesSquare, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStats } from '@/hooks/useAppStats';
import { Badge } from '@/components/ui/badge';
import { timeAgoBr } from '@/lib/timeAgoBr';
import { StatsSkeleton } from '@/components/ui/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

type PendingPost = { id: string; titulo: string; tipo: string; autor_display_name: string; created_at: string };

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useAppStats();
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ['admin-counts'],
    queryFn: async () => {
      const [pending, hidden, banned] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('is_hidden', true),
        supabase.from('banned_users').select('user_id', { count: 'exact', head: true }),
      ]);
      return {
        pendentes: pending.count ?? 0,
        ocultos: hidden.count ?? 0,
        banidos: banned.count ?? 0,
      };
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, titulo, tipo, autor_display_name, created_at')
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        setPendingPosts((data ?? []) as PendingPost[]);
        setPendingLoading(false);
      });
    supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalComments(count ?? 0));
  }, []);

  const kpisLoading = countsLoading;

  const kpis = [
    { icon: Inbox, label: 'Posts pendentes', value: counts?.pendentes ?? 0, tone: 'text-primary', href: '/admin/moderacao' },
    { icon: MessagesSquare, label: 'Comentários ocultos', value: counts?.ocultos ?? 0, tone: 'text-warning', href: '/admin/comentarios' },
    { icon: Users, label: 'Usuários banidos', value: counts?.banidos ?? 0, tone: 'text-destructive', href: '/admin/comentarios' },
    { icon: MessageSquare, label: 'Comentários (total)', value: totalComments, tone: 'text-secondary', href: '/admin/comentarios' },
  ];

  const secondary = [
    { icon: FileText, label: 'Reclamações totais', value: stats?.totalComplaints ?? 0 },
    { icon: MessageSquare, label: 'Respondidas', value: stats?.respondedComplaints ?? 0 },
    { icon: Users, label: 'Cidadãos ativos', value: stats?.activeCitizens ?? 0 },
    { icon: Vote, label: 'Compromissos', value: stats?.commitments ?? 0 },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da moderação e engajamento</p>
      </div>

      {kpisLoading ? (
        <div className="mb-6"><StatsSkeleton /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => (
            <Link
              key={k.label}
              to={k.href}
              className="group rounded-2xl border bg-card p-4 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <k.icon className={`h-5 w-5 ${k.tone}`} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="text-2xl font-black text-foreground tabular-nums">{k.value.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{k.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">Fila de moderação</h2>
            </div>
            <Link to="/admin/moderacao" className="text-xs text-primary font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>
          {pendingLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : pendingPosts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Fila vazia. Tudo em dia!</div>
          ) : (
            <ul className="divide-y">
              {pendingPosts.map((p) => (
                <li key={p.id} className="px-4 py-3 hover:bg-muted/40 transition">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">{p.tipo}</Badge>
                    <span className="text-[11px] text-muted-foreground">{timeAgoBr(p.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold line-clamp-1">{p.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">por {p.autor_display_name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-secondary" />
            <h2 className="font-bold text-sm">Engajamento</h2>
          </div>
          <ul className="space-y-3">
            {secondary.map((s) => (
              <li key={s.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </span>
                <span className="text-sm font-bold">{s.value.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
