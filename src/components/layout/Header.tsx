import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PenLine, LogOut, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import CitySelect from '@/components/CitySelect';
import { useAuth } from '@/hooks/useAuth';
import { useCidade } from '@/hooks/useCidade';

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
  const { cidade, setCidade } = useCidade();
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo size="md" showTagline />

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

        <div className="flex items-center gap-2">
          <CitySelect value={cidade} onChange={setCidade} size="sm" className="hidden max-w-[12rem] sm:inline-flex" />
          <ApoiarButton size="sm" className="hidden sm:inline-flex" />
          {user ? (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden gap-1.5 font-semibold text-secondary sm:inline-flex">
                <Link to="/criar"><PenLine className="h-4 w-4" /> Postar</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={openAuth} className="hidden sm:inline-flex">Entrar</Button>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            <CitySelect value={cidade} onChange={setCidade} className="mb-1 w-full" />
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
            <div className="mt-2 space-y-2">
              <ApoiarButton full />
              {user ? (
                <Button asChild variant="outline" className="w-full gap-2 rounded-full">
                  <Link to="/nova-demanda" onClick={() => setOpen(false)}><Megaphone className="h-4 w-4" /> Criar demanda</Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full rounded-full" onClick={() => { setOpen(false); openAuth(); }}>
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
