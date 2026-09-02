import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { BarChart3, Inbox, MessagesSquare, Shield, LogOut, ExternalLink, BarChart2, MessageSquare, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';

function AdminSidebar({ pendingPosts }: { pendingPosts: number }) {
  const { pathname } = useLocation();
  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  const items = [
    { title: 'Dashboard', url: '/admin', icon: BarChart3 },
    { title: 'Moderar posts', url: '/admin/moderacao', icon: Inbox, badge: pendingPosts },
    { title: 'Comentários', url: '/admin/comentarios', icon: MessagesSquare },
    { title: 'Enquetes', url: '/admin/enquetes', icon: BarChart2 },
    { title: 'Publicados & Selos', url: '/admin/publicados', icon: Award },
    { title: 'Grupos WhatsApp', url: '/admin/grupos', icon: MessageSquare },
  ];

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 w-full ${
      active ? 'font-semibold text-primary' : 'text-muted-foreground'
    }`;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold">Painel Admin</span>
            <span className="text-[10px] text-muted-foreground">Magrão no Ar</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Moderação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === '/admin'} className={linkClass(isActive(item.url))}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.title}</span>
                      {item.badge && item.badge > 0 ? (
                        <Badge className="h-5 min-w-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver site">
              <NavLink to="/" className="text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Ver site</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente')
      .then(({ count }) => setPending(count ?? 0));
    const channel = supabase
      .channel('admin-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendente')
          .then(({ count }) => setPending(count ?? 0));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AdminSidebar pendingPosts={pending} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-2 border-b bg-card px-3 sm:px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <span className="text-sm font-semibold truncate">Painel administrativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">
                {user.email}
              </span>
              <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
