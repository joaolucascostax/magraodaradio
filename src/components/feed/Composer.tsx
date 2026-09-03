import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCidade } from '@/hooks/useCidade';

/** Campo discreto de uma linha: única porta de entrada pra criar demanda. */
export default function Composer() {
  const { user, openAuth } = useAuth();
  const { cidade } = useCidade();
  const placeholder = `O que ${cidade} precisa?`;

  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PenLine className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{placeholder}</span>
      <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        Pedir
      </span>
    </>
  );

  const base =
    'flex w-full items-center gap-3 rounded-full border border-border bg-card px-3 py-2 text-left shadow-soft transition-colors hover:bg-muted/40';

  return user ? (
    <Link to="/nova-demanda" className={base} aria-label="Criar demanda">
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={openAuth} className={base} aria-label="Entrar para criar demanda">
      {inner}
    </button>
  );
}
