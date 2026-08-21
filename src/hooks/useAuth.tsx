import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  openAuth: () => void;
  closeAuth: () => void;
  isAuthOpen: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1) Listener PRIMEIRO — evita perder eventos disparados durante o getSession.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      // qualquer callback com sessão resolvida já é sinal seguro pra liberar UI.
      setLoading(false);
    });

    // 2) Hidrata a sessão atual (fallback caso o listener não dispare INITIAL_SESSION).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    signOut: async () => { await supabase.auth.signOut(); },
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    isAuthOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
