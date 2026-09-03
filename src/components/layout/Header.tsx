import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Megaphone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Diário do Magrão', path: '/diario' },
  { label: 'Demandas', path: '/demandas' },
  { label: 'Apoiadores', path: '/apoiadores' },
  { label: 'O Magrão', path: '/magrao' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, openAuth, signOut } = useAuth();
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo size="md" />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map(item => {
            const active = loc.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ApoiarButton size="sm" className="hidden lg:inline-flex" />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu" className="lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-4 py-3 text-base font-semibold ${
                  loc.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-foreground/80'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 space-y-2 border-t border-border pt-3">
              <Button asChild variant="outline" className="w-full gap-2 rounded-full">
                <Link to="/nova-demanda" onClick={() => setOpen(false)}>
                  <Megaphone className="h-4 w-4" /> Criar demanda
                </Link>
              </Button>
              {user ? (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start gap-2">
                    <Link to="/perfil" onClick={() => setOpen(false)}><User className="h-4 w-4" /> Meu perfil</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => { setOpen(false); signOut(); }}
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="w-full rounded-full" onClick={() => { setOpen(false); openAuth(); }}>
                  Entrar / Cadastrar
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
