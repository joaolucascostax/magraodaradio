import { Link } from 'react-router-dom';
import { BadgeCheck, Megaphone, Radio, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import { useApoioStats } from '@/hooks/useApoio';

export default function MagraoCard() {
  const { totalApoiadores, totalCidades } = useApoioStats();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-soft shadow-card">
      <div className="flex items-center gap-3 border-b border-border/60 bg-background/60 px-4 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft">
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-display text-base font-extrabold leading-tight">Magrão da Rádio</p>
            <BadgeCheck className="h-4 w-4 text-primary" aria-label="Perfil verificado" />
          </div>
          <p className="text-xs text-muted-foreground">Candidato a deputado estadual · Goiás</p>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm text-foreground/80">
          Esta é a rede de quem caminha com o Magrão. Aqui você acompanha o trabalho de perto,
          manda a demanda da sua cidade e ajuda a levar a voz do interior pra Assembleia.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-background/70 px-3 py-2">
            <p className="font-display text-lg font-extrabold text-secondary">
              {totalApoiadores.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] text-muted-foreground">apoiadores</p>
          </div>
          <div className="rounded-xl bg-background/70 px-3 py-2">
            <p className="font-display text-lg font-extrabold text-secondary">{totalCidades}</p>
            <p className="text-[11px] text-muted-foreground">cidades de Goiás</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <ApoiarButton full size="lg" />
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full">
              <Link to="/nova-demanda"><Megaphone className="h-4 w-4" /> Demanda</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full">
              <Link to="/apoiadores"><Users className="h-4 w-4" /> Apoiadores</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
