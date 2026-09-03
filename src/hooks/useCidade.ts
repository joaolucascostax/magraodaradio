import { useCallback, useEffect, useState } from 'react';
const KEY = 'mna:cidade';
const EVT = 'mna:cidade-change';

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Cidade ativa do usuário dentro de Goiás. Vazio = Goiás inteiro (padrão). Guardada no aparelho e sincronizada
 * entre componentes por um evento próprio (sem provider global).
 */
export function useCidade() {
  const [cidade, setCidadeState] = useState<string>(read);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setCidadeState(detail);
    };
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);

  const setCidade = useCallback((nova: string) => {
    try {
      localStorage.setItem(KEY, nova);
    } catch {
      /* modo privado — segue só em memória */
    }
    window.dispatchEvent(new CustomEvent(EVT, { detail: nova }));
  }, []);

  return { cidade, setCidade, uf: 'GO' as const };
}
