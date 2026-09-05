import { Link } from 'react-router-dom';
import { Radio, Megaphone, Users, BadgeCheck, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApoiarButton from '@/components/apoio/ApoiarButton';
import magraoCampanha from '@/assets/magrao-campanha-2026.jpg.asset.json';

const PILARES = [
  {
    icon: Radio,
    titulo: 'Voz de quem sempre falou pelo povo',
    texto:
      'São anos no rádio ouvindo Goiás de perto: o problema do bairro, a fila do posto, a estrada sem asfalto. Essa escuta continua aqui, agora em rede.',
  },
  {
    icon: Megaphone,
    titulo: 'Demanda que chega e volta com resposta',
    texto:
      'Você registra o que sua cidade precisa, a equipe organiza por região e o Magrão levanta a pauta onde tem que levantar. Cada demanda tem retorno público.',
  },
  {
    icon: Users,
    titulo: 'Mandato aberto, do início ao fim',
    texto:
      'Esta plataforma nasce na campanha, mas fica pra sempre: é o canal definitivo entre o gabinete e as 246 cidades de Goiás.',
  },
];

export default function Magrao() {
  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl pt-5">
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-soft shadow-card">
          <div className="flex flex-col items-center px-5 py-6 text-center">
            <img src={magraoCampanha.url} alt="Magrão da Rádio em campanha pelas cidades de Goiás" className="h-32 w-auto drop-shadow-md" />
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
              <BadgeCheck className="h-3 w-3" /> Perfil oficial
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Magrão da Rádio
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Candidato a deputado estadual · Goiás
            </p>
            <p className="mt-4 max-w-lg text-sm text-foreground/80 sm:text-base">
              Do microfone da rádio pra Assembleia Legislativa: a mesma missão de dar voz a quem nunca
              foi ouvido. Aqui você caminha junto — acompanha o dia a dia, cobra e participa.
            </p>
            <div className="mt-5 w-full max-w-xs space-y-2">
              <ApoiarButton full />
              <Button asChild variant="outline" className="w-full gap-2 rounded-full font-bold">
                <Link to="/diario">Ver o Diário do Magrão <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-3">
          {PILARES.map((p) => (
            <article key={p.titulo} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-extrabold leading-snug">{p.titulo}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-secondary p-5 text-center text-secondary-foreground shadow-card">
          <h2 className="font-display text-xl font-extrabold">Goiás inteiro, no mesmo lugar</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm opacity-90">
            246 municípios, uma rede só. Escolha sua cidade, entre no time e mostre o que precisa
            mudar aí.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm" variant="secondary" className="gap-1.5 rounded-full bg-background font-bold text-secondary hover:bg-background/90">
              <Link to="/demandas"><Megaphone className="h-4 w-4" /> Demandas</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
