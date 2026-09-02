import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FAB from './FAB';
import BottomNav from './BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  const showFAB = pathname === '/demandas' || pathname === '/reclamacoes' || pathname === '/';
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
      <Header />
      <main className="min-w-0 w-full flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      {showFAB && <FAB />}
      <BottomNav />
    </div>
  );
}
