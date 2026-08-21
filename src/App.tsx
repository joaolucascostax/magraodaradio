import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import RequireAuth from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Reclamacoes from "./pages/Reclamacoes";
import DetalheReclamacao from "./pages/DetalheReclamacao";
import Enquetes from "./pages/Enquetes";
import EnqueteDetalhe from "./pages/EnqueteDetalhe";
import Sobre from "./pages/Sobre";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminModeracao from "./pages/AdminModeracao";
import AdminComentarios from "./pages/AdminComentarios";
import AdminEnquetes from "./pages/AdminEnquetes";
import AdminGrupos from "./pages/AdminGrupos";
import AdminPublicados from "./pages/AdminPublicados";
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
        <AuthProvider>
          <ScrollToTop />
          <AuthModal />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/reclamacoes" element={<ErrorBoundary><Reclamacoes /></ErrorBoundary>} />
              <Route
                path="/nova-reclamacao"
                element={<ErrorBoundary><NovoPost /></ErrorBoundary>}
              />

              <Route path="/reclamacao/:id" element={<ErrorBoundary><DetalheReclamacao /></ErrorBoundary>} />
              <Route path="/enquetes" element={<ErrorBoundary><Enquetes /></ErrorBoundary>} />
              <Route path="/enquetes/:id" element={<ErrorBoundary><EnqueteDetalhe /></ErrorBoundary>} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/como-funciona" element={<ErrorBoundary><ComoFunciona /></ErrorBoundary>} />
              <Route path="/perfil" element={<RequireAuth message="Entre pra ver suas denúncias e apoios."><ErrorBoundary><Perfil /></ErrorBoundary></RequireAuth>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/criar" element={<ErrorBoundary><NovoPost /></ErrorBoundary>} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ErrorBoundary><Admin /></ErrorBoundary>} />
              <Route path="moderacao" element={<ErrorBoundary><AdminModeracao /></ErrorBoundary>} />
              <Route path="comentarios" element={<ErrorBoundary><AdminComentarios /></ErrorBoundary>} />
              <Route path="enquetes" element={<ErrorBoundary><AdminEnquetes /></ErrorBoundary>} />
              <Route path="publicados" element={<ErrorBoundary><AdminPublicados /></ErrorBoundary>} />
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
