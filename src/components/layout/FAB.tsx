import { Megaphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const HIDE_ON = [/^\/enquetes/, /^\/criar/, /^\/nova-demanda/, /^\/admin/, /^\/perfil/, /^\/magrao/, /^\/reclamacao\//];

export default function FAB() {
  const loc = useLocation();

  if (HIDE_ON.some((rx) => rx.test(loc.pathname))) return null;

  return (
    <Link
      to="/nova-demanda"
      aria-label="Criar demanda para o Magrão"
      className="fixed bottom-20 right-4 z-40 flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lifted transition-all hover:scale-105 active:scale-95 md:bottom-6 md:hidden"
    >
      <Megaphone className="h-5 w-5" strokeWidth={2.5} />
      <span className="text-base font-bold">Demanda</span>
    </Link>
  );
}
