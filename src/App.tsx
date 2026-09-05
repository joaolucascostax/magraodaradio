import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { BottomNavProvider } from "@/hooks/useBottomNav";
import AuthModal from "@/components/auth/AuthModal";
import RequireAuth from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Reclamacoes from "./pages/Reclamacoes";
import DetalheReclamacao from "./pages/DetalheReclamacao";
import Enquetes from "./pages/Enquetes";
import EnqueteDetalhe from "./pages/EnqueteDetalhe";
import Magrao from "./pages/Magrao";
import Diario from "./pages/Diario";
import Apoiadores from "./pages/Apoiadores";
import Perfil from "./pages/Perfil";
import AdminHome from "./pages/AdminHome";
import AdminLogin from "./pages/AdminLogin";
import AdminConteudo from "./pages/AdminConteudo";
import AdminEnquetes from "./pages/AdminEnquetes";
import AdminGrupos from "./pages/AdminGrupos";
import AdminDiario from "./pages/AdminDiario";
import AdminLayout from "./layouts/AdminLayout";
import NovoPost from "./pages/NovoPost";
import ComoFunciona from "./pages/ComoFunciona";
import NotFound from "./pages/NotFound";

// Defaults sensatos: reduz refetch agressivo em foco/mount e retry em erro.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <BottomNavProvider>
          <AuthProvider>
            <ScrollToTop />
            <AuthModal />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/demandas" element={<ErrorBoundary><Reclamacoes /></ErrorBoundary>} />
              <Route path="/nova-demanda" element={<ErrorBoundary><NovoPost /></ErrorBoundary>} />
              <Route path="/diario" element={<ErrorBoundary><Diario /></ErrorBoundary>} />
              <Route path="/apoiadores" element={<ErrorBoundary><Apoiadores /></ErrorBoundary>} />
              <Route path="/magrao" element={<ErrorBoundary><Magrao /></ErrorBoundary>} />

              {/* Rotas antigas — mantidas para não quebrar links compartilhados */}
              <Route path="/reclamacoes" element={<Navigate to="/demandas" replace />} />
              <Route path="/nova-reclamacao" element={<Navigate to="/nova-demanda" replace />} />
              <Route path="/sobre" element={<Navigate to="/magrao" replace />} />

              <Route path="/reclamacao/:id" element={<ErrorBoundary><DetalheReclamacao /></ErrorBoundary>} />
              <Route path="/enquetes" element={<ErrorBoundary><Enquetes /></ErrorBoundary>} />
              <Route path="/enquetes/:id" element={<ErrorBoundary><EnqueteDetalhe /></ErrorBoundary>} />
              <Route path="/como-funciona" element={<ErrorBoundary><ComoFunciona /></ErrorBoundary>} />
              <Route path="/perfil" element={<RequireAuth message="Entre pra ver suas demandas e seu apoio."><ErrorBoundary><Perfil /></ErrorBoundary></RequireAuth>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/criar" element={<ErrorBoundary><NovoPost /></ErrorBoundary>} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ErrorBoundary><AdminHome /></ErrorBoundary>} />
              <Route path="conteudo" element={<ErrorBoundary><AdminConteudo /></ErrorBoundary>} />
              <Route path="moderacao" element={<Navigate to="/admin/conteudo" replace />} />
              <Route path="publicados" element={<Navigate to="/admin/conteudo?aba=publicadas" replace />} />
              <Route path="comentarios" element={<Navigate to="/admin/conteudo?aba=comentarios" replace />} />
              <Route path="enquetes" element={<ErrorBoundary><AdminEnquetes /></ErrorBoundary>} />
              <Route path="diario" element={<ErrorBoundary><AdminDiario /></ErrorBoundary>} />
              <Route path="grupos" element={<ErrorBoundary><AdminGrupos /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
