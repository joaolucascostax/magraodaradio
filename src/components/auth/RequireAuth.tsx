import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsBanned } from '@/hooks/useIsBanned';
import { AuthSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Se true, abre o modal de auth automaticamente quando não logado. */
  autoOpenAuth?: boolean;
  /** Texto exibido ao visitante deslogado. */
  message?: string;
}

/**
 * Guard client-side para rotas que exigem cadastro.
 * - Aguarda hidratação da sessão (não pisca "deslogado" em refresh).
 * - Bloqueia banidos com mensagem clara.
 */
export default function RequireAuth({ children, autoOpenAuth = false, message }: Props) {
  const { user, loading: authLoading, openAuth } = useAuth();
  const { banned, motivo, loading: banLoading } = useIsBanned();

  useEffect(() => {
    if (!authLoading && !user && autoOpenAuth) openAuth();
  }, [authLoading, user, autoOpenAuth, openAuth]);

  if (authLoading || (user && banLoading)) return <AuthSkeleton />;

  if (!user) {
    return (
      <div className="container max-w-md py-16 sm:py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight">Faça login para continuar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message ?? 'Crie uma conta rápida pelo WhatsApp — leva menos de um minuto.'}
        </p>
        <Button onClick={openAuth} className="mt-5 min-h-[44px] rounded-xl px-6 font-bold">
          Entrar / Cadastrar
        </Button>
      </div>
    );
  }

  if (banned) {
    return (
      <div className="container max-w-md py-16 sm:py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-black">Conta suspensa</h1>
        <p className="mt-2 text-sm text-muted-foreground">{motivo ?? 'Você foi suspenso da plataforma.'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
