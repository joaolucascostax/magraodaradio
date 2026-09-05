import { Radio } from 'lucide-react';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import { useApoioStats } from '@/hooks/useApoio';
import { useMeuApoio } from '@/hooks/useApoio';

/**
 * Bloco de topo do feed: a única área de cor cheia da tela.
 * Ação dominante = virar apoiador.
 */

export default function ApoioHero() {
  const { totalApoiadores, totalCidades } = useApoioStats();
  const { isApoiador } = useMeuApoio();

  // Após o login a barra de status do apoiador não é exibida aqui.
  if (isApoiador) return null;


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

        <span className="text-sm font-bold opacity-90">
          {totalApoiadores.toLocaleString('pt-BR')} apoiadores
        </span>
      </div>
    </section>
  );
}

