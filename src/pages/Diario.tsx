import { Radio } from 'lucide-react';
import FeedStream from '@/components/feed/FeedStream';
import ApoiarButton from '@/components/apoio/ApoiarButton';

/** Diário do Magrão — só publicações oficiais do mandato/campanha. */
export default function Diario() {
  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl pt-5">
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
            <Radio className="h-3 w-3" /> Diário do Magrão
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            O trabalho do Magrão, dia por dia
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Agenda, cidades visitadas, pedidos entregues e resultados — direto da equipe.
          </p>
          <div className="mt-3">
            <ApoiarButton size="sm" />
          </div>
        </div>

        <FeedStream initialFilter="oficial" hideChips hideCity />
      </div>
    </div>
  );
}
