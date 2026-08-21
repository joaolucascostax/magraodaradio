import { PenLine } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const HIDE_ON = [/^\/enquetes/, /^\/criar/, /^\/admin/, /^\/perfil/, /^\/sobre/, /^\/reclamacao\//];

export default function FAB() {
  const loc = useLocation();

  if (HIDE_ON.some((rx) => rx.test(loc.pathname))) return null;

  return (
    <Link
      to="/criar"
      aria-label="Criar post"
      className="fixed bottom-5 right-4 z-30 flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lifted transition-all hover:scale-105 active:scale-95 sm:hidden"
    >
      <PenLine className="h-6 w-6" />
      <span className="text-base font-semibold">Criar</span>
    </Link>
  );
}

