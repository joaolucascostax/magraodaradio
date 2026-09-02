import { Users, MapPin, Loader2, Heart } from 'lucide-react';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import { useApoioStats, useMeuApoio } from '@/hooks/useApoio';
import { useCidade } from '@/hooks/useCidade';
import CitySelect from '@/components/CitySelect';
import { Progress } from '@/components/ui/progress';

export default function Apoiadores() {
  const { cidades, totalApoiadores, totalCidades, loading } = useApoioStats();
  const { isApoiador, apoio } = useMeuApoio();
  const { cidade, setCidade } = useCidade();

  const maior = cidades[0]?.total ?? 1;
  const minhaCidade = cidades.find((c) => c.cidade === cidade);

  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl pt-5">
        <div className="rounded-2xl border border-border bg-gradient-soft p-5 shadow-card">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
            <Users className="h-3 w-3" /> Time do Magrão
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {totalApoiadores.toLocaleString('pt-BR')} apoiadores em {totalCidades}{' '}
            {totalCidades === 1 ? 'cidade' : 'cidades'} de Goiás
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cada apoiador é uma voz do interior chegando na Assembleia. Declare seu apoio e mostre a
            força da sua cidade.
          </p>
          <div className="mt-4">
            <ApoiarButton />
          </div>
          {isApoiador && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <Heart className="h-3.5 w-3.5 fill-current" /> Você apoia o Magrão em {apoio?.cidade}.
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold">Minha cidade</h2>
            <CitySelect value={cidade} onChange={setCidade} size="sm" className="max-w-[14rem]" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> {cidade}
              </span>
              <span className="font-display text-lg font-extrabold text-secondary">
                {(minhaCidade?.total ?? 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <Progress value={Math.min(100, ((minhaCidade?.total ?? 0) / maior) * 100)} className="mt-3 h-2" />
          </div>
        </div>

        <h2 className="mt-8 font-display text-lg font-extrabold">Ranking das cidades</h2>
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : cidades.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Ninguém declarou apoio ainda. Seja o primeiro da sua cidade!
          </div>
        ) : (
          <ol className="mt-3 space-y-2">
            {cidades.slice(0, 30).map((c, i) => (
              <li
                key={`${c.cidade}-${c.uf}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-soft"
              >
                <span className="w-6 text-center font-display text-sm font-extrabold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.cidade}</span>
                <span className="font-display text-sm font-extrabold text-secondary">
                  {c.total.toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Mostramos apenas o total por cidade. Nenhum dado pessoal de apoiador é exibido.
        </p>
      </div>
    </div>
  );
}
