import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FAB from './FAB';

export default function Layout() {
  const { pathname } = useLocation();
  const showFAB = pathname === '/reclamacoes';
  return (
    <div className="flex min-h-screen flex-col w-full max-w-[100vw] overflow-x-hidden">
      <Header />
      <main className="flex-1 min-w-0 w-full">
        <Outlet />
      </main>
      <Footer />
      {showFAB && <FAB />}
    </div>
  );
}
