import { Link } from 'react-router-dom';
import { Megaphone, Radio, Flame, ArrowRight, Loader2, PenLine, Users } from 'lucide-react';
import MagraoCard from '@/components/MagraoCard';
import PostCard from '@/components/feed/PostCard';
import CitySelect from '@/components/CitySelect';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { useCidade } from '@/hooks/useCidade';
import { useApoioStats } from '@/hooks/useApoio';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { cidade, setCidade } = useCidade();
  const { user, openAuth } = useAuth();
  const { totalApoiadores } = useApoioStats();
  const { posts: daCidade, loading: loadingCidade } = usePostsFeed({ tab: 'recentes', cidade, limit: 5 });
  const { posts: oficiais, loading: loadingOficiais } = usePostsFeed({ tab: 'recentes', official: true, limit: 3 });

  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl pt-4">
        {/* Cartão de identidade da rede */}
        <MagraoCard />

        {/* Compositor */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PenLine className="h-5 w-5" />
            </span>
            {user ? (
              <Link
                to="/nova-demanda"
                className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/70"
              >
                O que sua cidade precisa?
              </Link>
            ) : (
              <button
                onClick={openAuth}
                className="flex-1 rounded-full bg-muted px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70"
              >
                O que sua cidade precisa?
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost" className="gap-1.5 rounded-full text-secondary">
              <Link to="/demandas"><Megaphone className="h-4 w-4" /> Demandas</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5 rounded-full text-secondary">
              <Link to="/diario"><Radio className="h-4 w-4" /> Diário</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5 rounded-full text-secondary">
              <Link to="/apoiadores"><Users className="h-4 w-4" /> {totalApoiadores.toLocaleString('pt-BR')} apoiadores</Link>
            </Button>
          </div>
        </div>

        {/* Últimas do Magrão */}
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
                <Radio className="h-3 w-3" /> Diário do Magrão
              </div>
              <h2 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
                Últimas do mandato
              </h2>
            </div>
            <Button asChild size="sm" variant="ghost" className="gap-1 text-xs font-bold">
              <Link to="/diario">Ver tudo <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          {loadingOficiais ? (
            <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : oficiais.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              As primeiras atualizações do Magrão aparecem aqui.
            </div>
          ) : (
            <div className="space-y-4">{oficiais.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}
        </section>

        {/* Feed da cidade */}
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive">
                <Flame className="h-3 w-3" /> Na sua cidade
              </div>
              <h2 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
                O que o povo de {cidade} tá pedindo
              </h2>
            </div>
            <CitySelect value={cidade} onChange={setCidade} size="sm" className="max-w-[14rem]" />
          </div>

          {loadingCidade ? (
            <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : daCidade.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Ninguém publicou nada em {cidade} ainda. Comece você a conversa!
            </div>
          ) : (
            <div className="space-y-4">{daCidade.map((p) => <PostCard key={p.id} post={p} />)}</div>
          )}

          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" variant="outline" className="gap-2 rounded-full font-bold">
              <Link to="/demandas">Ver todas as demandas <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
