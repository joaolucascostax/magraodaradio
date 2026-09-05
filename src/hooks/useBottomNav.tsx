import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type BottomNavContextType = {
  hidden: boolean;
  setHidden: (value: boolean) => void;
};

const BottomNavContext = createContext<BottomNavContextType | null>(null);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const setHiddenCb = useCallback((value: boolean) => setHidden(value), []);
  return (
    <BottomNavContext.Provider value={{ hidden, setHidden: setHiddenCb }}>
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNavVisibility() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) throw new Error('useBottomNavVisibility must be used within BottomNavProvider');
  return ctx.hidden;
}

export function useSetBottomNavHidden() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) return () => {};
  return ctx.setHidden;
}
