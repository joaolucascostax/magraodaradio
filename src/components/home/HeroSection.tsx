import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStats } from '@/hooks/useAppStats';

export default function HeroSection() {
  const { data: stats } = useAppStats();
  const total = stats?.totalComplaints ?? 0;
  return (
    <section className="relative bg-foreground overflow-hidden -mt-px w-full max-w-full border-b-4 border-foreground">
      {/* Faixa de notícia urgente */}
      <div className="bg-destructive text-destructive-foreground py-1.5 overflow-hidden whitespace-nowrap border-b-2 border-foreground">
        <div className="flex items-center gap-6 text-[10px] sm:text-xs font-display uppercase tracking-widest animate-[shimmer_18s_linear_infinite] px-4">
          <span>🚨 Urgente</span>
          <span>O povo destampa o que tá escondido</span>
          <span>🔥 {total.toLocaleString('pt-BR')} denúncias no ar</span>
          <span>· Anônimo · Sem patrão · Sem censura</span>
          <span>🚨 Urgente</span>
        </div>
      </div>

      <div className="px-4 relative py-10 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Selo */}
          <div className="inline-block stamp bg-highlight text-foreground px-3 py-1 text-[10px] sm:text-xs mb-5 sm:mb-7 animate-fade-up">
            EDIÇÃO DE HOJE · GOIÁS
          </div>

          {/* Manchete */}
          <h1 className="font-display text-background text-[2.5rem] leading-[0.92] sm:text-7xl mb-3 sm:mb-5 uppercase animate-fade-up" style={{ animationDelay: '0.1s' }}>
            AQUI QUEM<br />
            MANDA É O <span className="bg-highlight text-foreground px-2 inline-block -rotate-1">POVO</span>
          </h1>

          {/* Lead jornal */}
          <p className="text-sm sm:text-lg text-background/80 mb-7 sm:mb-9 max-w-xl mx-auto font-semibold leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Denúncia anônima. Voto popular. Pressão coletiva.
            <br className="hidden sm:block" />
            <span className="text-highlight">O que tá escondido por baixo dos panos, o povo destampa.</span>
          </p>

          {/* CTA */}
          <div className="flex justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/nova-reclamacao" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-highlight text-foreground font-display uppercase border-2 border-background hover:bg-background hover:text-foreground rounded-sm text-base sm:text-lg px-8 sm:px-10 py-6 min-h-[52px] shadow-brutal-lg">
                <Flame className="h-5 w-5" />
                Soltar denúncia
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
