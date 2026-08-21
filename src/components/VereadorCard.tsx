import { Link } from 'react-router-dom';
import { BadgeCheck, MessageCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VereadorCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-soft shadow-card">
      <div className="flex items-center gap-3 border-b border-border/60 bg-background/60 px-4 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft">
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-display text-base font-extrabold leading-tight">Vereador Magrão da Rádio</p>
            <BadgeCheck className="h-4 w-4 text-primary" aria-label="Perfil verificado" />
          </div>
          <p className="text-xs text-muted-foreground">Câmara Municipal de Rio Verde-GO</p>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm text-foreground/80">
          Este canal é do povo de Rio Verde. Cada participação contribui pro crescimento da plataforma que dá voz a população de Rio Verde.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/nova-reclamacao"><MessageCircle className="h-4 w-4" /> Postar</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/sobre">Sobre o mandato</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
