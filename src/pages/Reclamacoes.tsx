import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PostCard from '@/components/feed/PostCard';
import { usePostsFeed, type FeedTab, type PostTipo, type PostSelo } from '@/hooks/usePostsFeed';
import { FeedSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import CitySelect from '@/components/CitySelect';
import { useCidade } from '@/hooks/useCidade';

type TipoFiltro = PostTipo | 'todos';
type SeloFiltro = PostSelo | 'todos';

const TIPOS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'denuncia', label: 'Demanda' },
  { value: 'noticia', label: 'Notícia' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'discussao', label: 'Discussão' },
];

const SELOS: { value: SeloFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'resolvido_magrao', label: 'Resolvido pelo Magrão' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'encaminhado_camara', label: 'Encaminhado' },
];

/**
 * Demandas da minha cidade — feed único de Goiás: pedidos do povo, notícias,
 * projetos e discussões, filtrados por cidade.
 */
export default function Reclamacoes() {
  const [tab, setTab] = useState<FeedTab>('alta');
  const [tipo, setTipo] = useState<TipoFiltro>('todos');
  const [selo, setSelo] = useState<SeloFiltro>('todos');
  const [todasCidades, setTodasCidades] = useState(false);
  const { cidade, setCidade } = useCidade();
  const { posts, loading } = usePostsFeed({
    tab,
    cidade: todasCidades ? null : cidade,
    tipo: tipo === 'todos' ? null : tipo,
    selo: selo === 'todos' ? null : selo,
  });

  return (
    <div className="px-4 pb-20 sm:pb-10 w-full max-w-full overflow-hidden">
      <div className="max-w-3xl mx-auto pt-4 sm:pt-6">
        <div className="mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            {todasCidades ? 'Demandas de Goiás' : `Demandas de ${cidade}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            O que o povo está pedindo, apoiando e discutindo com o Magrão agora.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CitySelect
              value={cidade}
              onChange={(c) => { setCidade(c); setTodasCidades(false); }}
              size="sm"
              className="max-w-[14rem]"
            />
            <Button
              size="sm"
              variant={todasCidades ? 'default' : 'outline'}
              className="h-9 rounded-full text-xs font-bold"
              onClick={() => setTodasCidades((v) => !v)}
            >
              Goiás inteiro
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as FeedTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="alta">Em alta</TabsTrigger>
            <TabsTrigger value="recentes">Recentes</TabsTrigger>
          </TabsList>

          <div className="mb-4 space-y-3">
            <FilterRow
              label="Categoria"
              options={TIPOS}
              value={tipo}
              onChange={(v) => setTipo(v as TipoFiltro)}
            />
            <FilterRow
              label="Selo"
              options={SELOS}
              value={selo}
              onChange={(v) => setSelo(v as SeloFiltro)}
            />
          </div>

          <TabsContent value="alta" className="space-y-4">
            <FeedList posts={posts} loading={loading} />
          </TabsContent>
          <TabsContent value="recentes" className="space-y-4">
            <FeedList posts={posts} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin">
      <span className="text-xs font-semibold text-muted-foreground shrink-0 pr-1">{label}:</span>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="rounded-full h-8 px-3 text-xs shrink-0"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

function FeedList({ posts, loading }: { posts: ReturnType<typeof usePostsFeed>['posts']; loading: boolean }) {
  if (loading) return <FeedSkeleton count={3} />;
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Nenhuma publicação encontrada com esses filtros.
      </div>
    );
  }
  return <>{posts.map((p) => <PostCard key={p.id} post={p} />)}</>;
}

