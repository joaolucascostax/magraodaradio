import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Megaphone } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import CitySelect from '@/components/CitySelect';
import { Button } from '@/components/ui/button';
import { usePostsFeed, type PostTipo } from '@/hooks/usePostsFeed';
import { useCidade } from '@/hooks/useCidade';
import { cn } from '@/lib/utils';

export type FeedFilter = 'tudo' | 'oficial' | 'demandas' | 'enquetes';

const CHIPS: { value: FeedFilter; label: string }[] = [
  { value: 'tudo', label: 'Tudo' },
  { value: 'oficial', label: 'Diário' },
  { value: 'demandas', label: 'Demandas' },
  { value: 'enquetes', label: 'Enquetes' },
];

function tipoOf(f: FeedFilter): PostTipo | null {
  if (f === 'demandas') return 'denuncia' as PostTipo;
  if (f === 'enquetes') return 'enquete' as PostTipo;
  return null;
}

interface Props {
  initialFilter?: FeedFilter;
  /** Esconde os chips (páginas já pré-filtradas). */
  hideChips?: boolean;
  /** Esconde o seletor de cidade (Diário é estadual). */
  hideCity?: boolean;
}

export default function FeedStream({ initialFilter = 'tudo', hideChips, hideCity }: Props) {
  const { cidade, setCidade } = useCidade();
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);
  const semCidade = hideCity || !cidade || filter === 'oficial';
  const { posts, loading } = usePostsFeed({
    tab: 'recentes',
    cidade: semCidade ? null : cidade,
    official: filter === 'oficial' ? true : null,
    tipo: tipoOf(filter),
    limit: 30,
  });

  return (
    <div>
      {(!hideChips || !hideCity) && (
        <div className="sticky top-16 z-20 -mx-4 mb-1 bg-background/90 px-4 py-2 backdrop-blur-md">
          {!hideChips && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {CHIPS.map((c) => {
                const active = filter === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFilter(c.value)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                      active
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
          {!hideCity && filter !== 'oficial' && (
            <div className="mt-1 flex items-center gap-2">
              <CitySelect
                value={cidade}
                onChange={setCidade}
                size="sm"
                allowAll
                className="max-w-[15rem]"
                label="Filtrar por cidade de Goiás"
              />
              {cidade && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 shrink-0 rounded-full text-xs font-bold"
                  onClick={() => setCidade('')}
                >
                  Goiás inteiro
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyFeed filter={filter} cidade={semCidade ? 'Goiás' : cidade} />
      ) : (
        <div className="divide-y divide-border">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyFeed({ filter, cidade }: { filter: FeedFilter; cidade: string }) {
  if (filter === 'oficial') {
    return (
      <div className="py-14 text-center">
        <p className="font-display text-lg font-extrabold">Nada no Diário ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A equipe publica agenda, visitas e resultados aqui. Volte logo.
        </p>
      </div>
    );
  }
  return (
    <div className="py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/50 text-secondary">
        <MapPin className="h-6 w-6" />
      </span>
      <p className="mt-3 font-display text-lg font-extrabold">Ninguém pediu nada em {cidade}</p>
      <p className="mt-1 text-sm text-muted-foreground">Seja o primeiro a dizer o que sua cidade precisa.</p>
      <Button asChild className="mt-4 gap-2 rounded-full font-bold">
        <Link to="/nova-demanda"><Megaphone className="h-4 w-4" /> Criar demanda</Link>
      </Button>
    </div>
  );
}
