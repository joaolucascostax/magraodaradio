import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já logado e admin, manda pro painel
  useEffect(() => {
    if (!authLoading && !roleLoading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      toast.error('Credenciais inválidas.');
      return;
    }
    // Aguarda role
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setLoading(false); toast.error('Falha ao carregar sessão.'); return; }
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', u.id);
    setLoading(false);
    if (!roles?.some((r) => r.role === 'admin')) {
      await supabase.auth.signOut();
      toast.error('Esta conta não tem permissão de administrador.');
      return;
    }
    toast.success('Bem-vindo ao painel!');
    navigate('/admin', { replace: true });
  };

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black tracking-tight">Painel Administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a administradores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-lg">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                className="h-11 pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-10 rounded-xl"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || !email || !password} className="w-full h-11 rounded-xl font-bold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            Contas de administrador são criadas apenas pela equipe técnica.
          </p>
        </form>
      </div>
    </div>
  );
}
