import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PenLine, LogOut, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Denúncias', path: '/reclamacoes' },
  { label: 'Enquetes', path: '/enquetes' },
  { label: 'Sobre', path: '/sobre' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, openAuth, signOut } = useAuth();
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo size="md" showTagline />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(item => {
            const active = loc.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 text-secondary font-semibold">
            <Link to="/nova-reclamacao"><Megaphone className="h-4 w-4" /> Denunciar</Link>
          </Button>
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex gap-1.5">
                <Link to="/criar"><PenLine className="h-4 w-4" /> Postar</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={openAuth} className="hidden sm:inline-flex">Entrar</Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
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
            {user ? (
              <Button asChild className="mt-2 gap-2"><Link to="/criar" onClick={() => setOpen(false)}><PenLine className="h-4 w-4" /> Criar post</Link></Button>
            ) : (
              <Button className="mt-2" onClick={() => { setOpen(false); openAuth(); }}>Entrar / Cadastrar</Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
