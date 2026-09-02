import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, EyeOff, MessageCircle, Award, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComoFunciona() {
  return (
    <div className="container max-w-2xl px-4 py-6 sm:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-secondary">
        Como funciona o <span className="text-primary">Magrão no Ar</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Uma plataforma pra dar voz à cidade. Aqui vai o resumo do que rola por baixo do pano.
      </p>

      <div className="mt-8 space-y-5">
        <Bloco icon={<MessageCircle className="h-5 w-5" />} title="Cadastro rápido pelo WhatsApp">
          Você entra com seu número e confirma um código de 6 dígitos que chega no zap.
          Sem senha, sem e-mail, sem enrolação. Seu telefone fica <strong>privado</strong> — ninguém no feed vê ele.
        </Bloco>

        <Bloco icon={<EyeOff className="h-5 w-5" />} title="Publicar anônimo é sua escolha">
          Em cada publicação você decide se aparece com seu nome ou como <em>Anônimo</em>.
          Demandas polêmicas podem ir anônimas sem medo — só a equipe interna sabe a origem, e apenas em caso de investigação legítima.
        </Bloco>

        <Bloco icon={<ShieldCheck className="h-5 w-5" />} title="Moderação antes de publicar">
          Todo post passa por uma revisão rápida da equipe pra evitar spam, ofensa gratuita e fake news.
          Você é avisado no zap quando o seu post é aprovado ou recusado.
        </Bloco>

        <Bloco icon={<Award className="h-5 w-5" />} title="Selos de acompanhamento">
          Quando o Magrão resolve uma demanda, encaminha pro órgão responsável ou está acompanhando, o post recebe um selo colorido.
          Assim você vê preto no branco o que virou solução.
        </Bloco>

        <Bloco icon={<CheckCircle2 className="h-5 w-5" />} title="Regras básicas">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Pode: demanda com fato, projeto de bairro, discussão política, cobrança pública.</li>
            <li>Não pode: xingamento pessoal, calúnia sem base, discurso de ódio, spam comercial.</li>
            <li>Reincidência derruba a conta.</li>
          </ul>
        </Bloco>
      </div>

      <div className="mt-10 rounded-2xl border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground mb-3">Pronto pra dar sua contribuição?</p>
        <Button asChild size="lg" className="gap-1.5">
          <Link to="/criar">Publicar agora</Link>
        </Button>
      </div>
    </div>
  );
}

function Bloco({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold text-lg text-secondary mb-1">{title}</h2>
        <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
