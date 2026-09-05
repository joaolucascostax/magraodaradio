import { useState, useEffect, useCallback, type ReactNode } from 'react';

let hidden = false;
const listeners = new Set<(value: boolean) => void>();

function emit() {
  listeners.forEach((fn) => fn(hidden));
}

export function useBottomNavVisibility() {
  const [isHidden, setIsHidden] = useState(hidden);
  useEffect(() => {
    listeners.add(setIsHidden);
    return () => {
      listeners.delete(setIsHidden);
    };
  }, []);
  return isHidden;
}

export function useSetBottomNavHidden() {
  return useCallback((value: boolean) => {
    if (hidden !== value) {
      hidden = value;
      emit();
    }
  }, []);
}

// Mantido apenas para compatibilidade; o estado agora vive em módulo.
export function BottomNavProvider({ children }: { children: ReactNode }) {
  return children;
}
