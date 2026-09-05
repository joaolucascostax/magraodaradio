import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/enquetes', label: 'Enquetes', icon: BarChart2 },
  { to: '/perfil', label: 'Perfil', icon: User },
];

const HIDE_ON = [/^\/admin/, /^\/criar/, /^\/nova-demanda/];

export default function BottomNav() {
  const { pathname } = useLocation();
  if (HIDE_ON.some((rx) => rx.test(pathname))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-[62px] max-w-[360px] items-center justify-between overflow-hidden rounded-[32px] border border-border/40 bg-background/70 shadow-[0_8px_32px_-8px_hsl(var(--secondary)_/_0.12)] backdrop-blur-xl"
      >
        {items.map((it) => {
          const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                'group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5 mx-1 transition-all duration-300',
                active
                  ? 'bg-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)_/_0.35)]'
                  : 'hover:bg-muted/70',
              )}
            >
              <Icon
                className={cn(
                  'h-[22px] w-[22px] transition-colors',
                  active ? 'stroke-[2.5] text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold leading-none transition-colors',
                  active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
