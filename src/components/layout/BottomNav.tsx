import { Link, useLocation } from 'react-router-dom';
import { Home, Radio, Megaphone, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/diario', label: 'Diário', icon: Radio },
  { to: '/demandas', label: 'Demandas', icon: Megaphone },
  { to: '/apoiadores', label: 'Apoio', icon: Users },
  { to: '/perfil', label: 'Perfil', icon: User },
];

const HIDE_ON = [/^\/admin/, /^\/criar/, /^\/nova-demanda/];

export default function BottomNav() {
  const { pathname } = useLocation();
  if (HIDE_ON.some((rx) => rx.test(pathname))) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch">
        {items.map((it) => {
          const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
