import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Fallback customizado. Se ausente, usa a tela padrão. */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error Boundary por rota — captura erros de render em qualquer descendente
 * e mostra fallback amigável em vez de tela branca.
 * Class component é o único padrão suportado pelo React p/ boundaries.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log estruturado — não vaza segredos, ajuda debug em produção.
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <div className="container max-w-md py-16 sm:py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Encontramos um erro inesperado nesta página. Tente novamente — se persistir, recarregue.
        </p>
        <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-muted/60 p-3 text-left text-[11px] text-muted-foreground">
          {error.message}
        </pre>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={this.reset} className="min-h-[44px] gap-1.5 rounded-xl">
            <RotateCcw className="h-4 w-4" /> Tentar novamente
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-xl"
          >
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }
}
