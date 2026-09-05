import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Radio, BarChart2, MessageSquare, LogOut, ExternalLink, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/conteudo', label: 'Conteúdo', icon: ListChecks, end: false },
  { to: '/admin/diario', label: 'Diário', icon: Radio, end: false },
  { to: '/admin/enquetes', label: 'Enquetes', icon: BarChart2, end: false },
  { to: '/admin/grupos', label: 'Grupos', icon: MessageSquare, end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const count = () =>
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .then(({ count }) => setPending(count ?? 0));
    count();
    const channel = supabase
      .channel('admin-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { count(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold">Painel do Magrão</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {pending > 0 ? `${pending} aguardando você` : 'Tudo em dia'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild size="sm" variant="ghost" className="h-9 px-2">
              <NavLink to="/" aria-label="Ver site"><ExternalLink className="h-4 w-4" /></NavLink>
            </Button>
            <Button size="sm" variant="ghost" className="h-9 px-2" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="mx-auto max-w-4xl overflow-x-auto px-3 pb-2">
          <ul className="flex gap-1.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                  {item.to === '/admin/conteudo' && pending > 0 && (
                    <span className="ml-0.5 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {pending}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
