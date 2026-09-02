import { Radio, Loader2 } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import ApoiarButton from '@/components/apoio/ApoiarButton';

/** Diário do Magrão — só publicações oficiais do mandato/campanha. */
export default function Diario() {
  const { posts, loading } = usePostsFeed({ tab: 'recentes', official: true, limit: 30 });

  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl pt-5">
        <div className="mb-5 rounded-2xl border border-border bg-gradient-soft p-5 shadow-card">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
            <Radio className="h-3 w-3" /> Diário do Magrão
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            O trabalho do Magrão, dia por dia
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Agenda, cidades visitadas, pedidos entregues e resultados. Tudo publicado direto pela
            equipe, sem intermediário.
          </p>
          <div className="mt-4">
            <ApoiarButton size="sm" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Nenhuma atualização publicada ainda. Volte logo — tem novidade toda semana.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
