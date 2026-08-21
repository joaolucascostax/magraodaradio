import { Link } from 'react-router-dom';
import { Megaphone, BarChart3, Flame, ArrowRight, Loader2 } from 'lucide-react';
import VereadorCard from '@/components/VereadorCard';
import PostCard from '@/components/feed/PostCard';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { Button } from '@/components/ui/button';
import magraoKombi from '@/assets/magrao-kombi.png.asset.json';

export default function Index() {
  const { posts, loading } = usePostsFeed({ tab: 'alta', limit: 5 });
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="container relative py-10 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              <img
                src="/brasao-rio-verde.webp"
                alt="Brasão do município de Rio Verde-GO"
                className="h-20 w-auto sm:h-24"
                width={96}
                height={96}
              />
              <span aria-hidden className="font-display text-2xl font-extrabold text-muted-foreground sm:text-3xl">×</span>
              <img
                src={magraoKombi.url}
                alt="Vereador Magrão da Rádio na Kombi"
                className="h-24 w-auto drop-shadow-md sm:h-32"
              />
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              A voz de Rio Verde <span className="text-gradient-brand">num só lugar</span>.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Notícias, Projetos, Denúncias, Reclamações, Enquetes, Discussões. A plataforma online que
              dará voz a população de Rio Verde!
            </p>
            <div className="mt-6 flex w-full max-w-md flex-wrap items-center justify-center gap-3">
              <Link
                to="/reclamacoes"
                className="group relative flex flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary py-4 pl-3 pr-4 text-[15px] font-bold leading-none tracking-tight text-secondary-foreground shadow-[0_4px_0_0_hsl(var(--accent))] transition-all duration-150 hover:bg-secondary/95 active:translate-y-1 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-center rounded-lg bg-accent p-1.5 text-accent-foreground transition-transform group-hover:scale-110">
                  <Megaphone className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="whitespace-nowrap">Ver postagens</span>
              </Link>

              <Link
                to="/enquetes"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-secondary bg-transparent py-4 pl-3 pr-4 text-[15px] font-bold leading-none tracking-tight text-secondary transition-all duration-150 hover:bg-secondary/5 active:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <BarChart3 className="h-4 w-4" strokeWidth={2.5} />
                <span className="whitespace-nowrap">Ver enquetes</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive">
                <Flame className="h-3 w-3" /> Em alta
              </div>
              <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                O que o povo tá falando
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                As 5 publicações mais quentes da plataforma.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Ainda não temos publicações em alta. Seja o primeiro a levantar a voz!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" variant="outline" className="gap-2 rounded-2xl font-bold">
              <Link to="/reclamacoes">
                Ver mais publicações <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container pb-10 sm:pb-14">
        <div className="mx-auto max-w-md">
          <VereadorCard />
        </div>
      </div>

    </div>
  );
}
