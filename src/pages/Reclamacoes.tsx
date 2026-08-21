import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PostCard from '@/components/feed/PostCard';
import { usePostsFeed, type FeedTab, type PostTipo, type PostSelo } from '@/hooks/usePostsFeed';
import { FeedSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';

type TipoFiltro = PostTipo | 'todos';
type SeloFiltro = PostSelo | 'todos';

const TIPOS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'denuncia', label: 'Denúncia' },
  { value: 'noticia', label: 'Notícia' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'discussao', label: 'Discussão' },
];

const SELOS: { value: SeloFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'resolvido_magrao', label: 'Resolvido pelo Magrão' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'encaminhado_camara', label: 'Encaminhado à Câmara' },
];

/**
 * Feed unificado — denúncias, notícias, projetos, enquetes e discussões
 * são todos "publicações" da mesma rede cívica. Um só card, uma só fonte.
 */
export default function Reclamacoes() {
  const [tab, setTab] = useState<FeedTab>('alta');
  const [tipo, setTipo] = useState<TipoFiltro>('todos');
  const [selo, setSelo] = useState<SeloFiltro>('todos');
  const { posts, loading } = usePostsFeed({
    tab,
    cidade: 'Rio Verde',
    tipo: tipo === 'todos' ? null : tipo,
    selo: selo === 'todos' ? null : selo,
  });

  return (
    <div className="px-4 pb-20 sm:pb-10 w-full max-w-full overflow-hidden">
      <div className="max-w-3xl mx-auto pt-4 sm:pt-6">
        <div className="mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Publicações de Rio Verde</h1>
          <p className="text-sm text-muted-foreground">
            Tudo o que o povo está publicando, apoiando e discutindo agora.
          </p>
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

