import { Link } from 'react-router-dom';
import { BadgeCheck, Radio, ArrowRight, Heart } from 'lucide-react';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import { useApoioStats } from '@/hooks/useApoio';
import { useMeuApoio } from '@/hooks/useApoio';

/**
 * Bloco de topo do feed: a única área de cor cheia da tela.
 * Ação dominante = virar apoiador. Quando já apoia, vira barra de status.
 */

export default function ApoioHero() {
  const { totalApoiadores, totalCidades } = useApoioStats();
  const { isApoiador, apoio } = useMeuApoio();

  if (isApoiador) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-secondary/10 bg-card p-4 shadow-card">
        {/* Acento de marca no canto */}
        <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent opacity-10" />

        <div className="relative flex items-center justify-between gap-4">
          {/* Esquerda: selo + info */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <BadgeCheck className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <span className="absolute -bottom-1 -right-1 rounded border border-card bg-accent px-1.5 py-0.5 font-display text-[8px] font-extrabold text-secondary shadow-sm">
                20.111
              </span>
            </div>

            <div className="flex min-w-0 flex-col">
              <h3 className="truncate font-display text-[15px] font-bold leading-tight text-secondary">
                Você é apoiador{apoio?.cidade ? ` em ${apoio.cidade}` : ''}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-secondary/60">
                Somos <span className="font-semibold text-primary">{totalApoiadores.toLocaleString('pt-BR')}</span> apoiadores
                em <span className="font-semibold text-primary">{totalCidades}</span> {totalCidades === 1 ? 'cidade' : 'cidades'} de Goiás
              </p>
            </div>
          </div>

          {/* Direita: chip de status */}
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/10 bg-background px-3 py-2 shadow-sm">
              <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-display text-[11px] font-bold uppercase tracking-wider text-secondary">
                {apoio?.cidade ?? 'Goiás'}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-lifted">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider opacity-90">
        <Radio className="h-3.5 w-3.5" /> Magrão da Rádio · Goiás
      </div>
      <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
        Entre no time do Magrão
      </h1>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed opacity-90">
        Apoie, acompanhe o trabalho de perto e mande a demanda da sua cidade direto pra Assembleia.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ApoiarButton size="lg" />

        <Link
          to="/apoiadores"
          className="inline-flex items-center gap-1 text-sm font-bold underline-offset-4 hover:underline"
        >
          {totalApoiadores.toLocaleString('pt-BR')} apoiadores <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

