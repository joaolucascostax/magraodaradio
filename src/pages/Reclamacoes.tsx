import { Megaphone } from 'lucide-react';
import Composer from '@/components/feed/Composer';
import FeedStream from '@/components/feed/FeedStream';

/** Demandas — mesmo feed da home, já filtrado nos pedidos do povo. */
export default function Reclamacoes() {
  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl space-y-4 pt-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Megaphone className="h-3 w-3" /> Demandas
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            O que o povo está pedindo
          </h1>
        </div>
        <Composer />
        <FeedStream initialFilter="demandas" />
      </div>
    </div>
  );
}
