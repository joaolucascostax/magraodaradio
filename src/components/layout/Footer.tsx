import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-muted/30">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size="md" asLink={false} showTagline />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A rede social cívica de Rio Verde-GO. Do povo pro povo — com o vereador Magrão da Rádio junto na luta.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> 1 cidadão = 1 voto
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/reclamacoes" className="text-foreground/80 hover:text-primary">Denúncias</Link></li>
            <li><Link to="/enquetes" className="text-foreground/80 hover:text-primary">Enquetes</Link></li>
            <li><Link to="/como-funciona" className="text-foreground/80 hover:text-primary">Como funciona</Link></li>
            <li><Link to="/sobre" className="text-foreground/80 hover:text-primary">Sobre o mandato</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Gabinete</h4>
          <p className="text-sm text-foreground/80">Câmara Municipal de Rio Verde</p>
          <p className="mt-1 text-sm text-muted-foreground">Rio Verde — Goiás</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Redes</h4>
          <div className="flex gap-2">
            <a href="#" aria-label="Instagram do Magrão" className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground/70 shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="WhatsApp do gabinete" className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground/70 shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rio Verde no Ar · Vereador Magrão da Rádio · Rio Verde-GO
      </div>
    </footer>
  );
}
