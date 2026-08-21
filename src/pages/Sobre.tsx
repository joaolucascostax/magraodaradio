import { Link } from 'react-router-dom';
import { Megaphone, Users, MessageSquare, CheckCircle2, ArrowRight, Radio, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { icon: Megaphone, title: 'Cidadão denuncia', desc: 'Foto, áudio ou texto — mostra o que tá errado em Rio Verde.' },
  { icon: Users, title: 'O bairro apoia', desc: 'Vizinhos apoiam e comentam. Quanto mais apoio, mais visibilidade.' },
  { icon: Radio, title: 'Gabinete recebe', desc: 'A denúncia chega direto no Magrão e na equipe do gabinete.' },
  { icon: CheckCircle2, title: 'Problema resolvido', desc: 'O caso vira acompanhamento oficial e o cidadão vê o resultado.' },
];

export default function Sobre() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-12 sm:py-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
            <BadgeCheck className="h-3.5 w-3.5" /> Mandato Vereador Magrão da Rádio
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
            Rio Verde no Ar
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            A rede social cívica de Rio Verde-GO. Feita para o cidadão participar todo dia da vida da cidade —
            com o vereador Magrão presente, ouvindo e cobrando resultados.
          </p>
        </div>
      </section>

      <div className="container max-w-3xl">
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          <h2 className="font-display text-2xl font-extrabold mb-3">Quem é o Magrão</h2>
          <p className="text-base text-foreground/80 leading-relaxed">
            Magrão da Rádio é vereador de Rio Verde-GO, comunicador conhecido pela rádio da cidade
            e por estar sempre próximo do povo. Este canal é o jeito digital dele continuar fazendo
            o que sempre fez: ouvir o cidadão, dar voz a quem não é ouvido e cobrar quem precisa cobrar.
          </p>
          <p className="mt-3 text-base text-foreground/80 leading-relaxed">
            Aqui não tem filtro de assessoria. Denúncia postada é denúncia lida. Enquete criada é
            enquete que vira pauta na Câmara.
          </p>
        </div>

        <div className="mt-10">
          <div className="text-center mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Como funciona</h2>
            <p className="text-sm text-muted-foreground mt-1">4 passos pra transformar reclamação em resultado</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/40 text-secondary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Passo {i + 1}</p>
                    <h3 className="font-display text-lg font-bold mt-0.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/nova-reclamacao"><Megaphone className="h-4 w-4" /> Fazer a primeira denúncia <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
