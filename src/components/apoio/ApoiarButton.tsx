import { useState } from 'react';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CitySelect from '@/components/CitySelect';
import Placa20111 from '@/components/campanha/Placa20111';
import { useApoioStats, useMeuApoio } from '@/hooks/useApoio';
import { useAuth } from '@/hooks/useAuth';
import { useCidade } from '@/hooks/useCidade';
import { cn } from '@/lib/utils';


interface Props {
  className?: string;
  size?: 'sm' | 'lg';
  full?: boolean;
}

export default function ApoiarButton({ className, size = 'lg', full }: Props) {
  const { user, openAuth } = useAuth();
  const { cidade, setCidade } = useCidade();
  const { isApoiador, apoio, apoiar, remover } = useMeuApoio();
  const { totalApoiadores } = useApoioStats();
  const [open, setOpen] = useState(false);
  const [escolhida, setEscolhida] = useState(cidade);

  function handleClick() {
    if (!user) {
      openAuth();
      return;
    }
    setEscolhida(apoio?.cidade ?? cidade);
    setOpen(true);
  }

  async function confirmar() {
    try {
      await apoiar.mutateAsync(escolhida);
      setCidade(escolhida);
      setOpen(false);
      toast.success(`Apoio confirmado em ${escolhida}! Bem-vindo ao time do Magrão.`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível registrar seu apoio.');
    }
  }

  async function retirar() {
    try {
      await remover.mutateAsync();
      setOpen(false);
      toast.success('Apoio removido.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Não foi possível remover seu apoio.');
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        size={size === 'lg' ? 'lg' : 'sm'}
        variant={isApoiador ? 'outline' : 'default'}
        className={cn(
          'gap-2 font-bold',
          isApoiador
            ? 'rounded-full'
            : 'rounded-2xl border-2 border-secondary bg-accent text-accent-foreground shadow-card hover:bg-accent/90',
          full && 'w-full',
          className,
        )}
      >
        {isApoiador ? (
          <Heart className="h-4 w-4 fill-primary text-primary" />
        ) : (
          <Placa20111 size="xs" className="shadow-none" label="Número de campanha 20.111" />
        )}
        {isApoiador ? `Apoiador · ${apoio?.cidade}` : 'Sou apoiador'}
      </Button>


      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">
              {isApoiador ? 'Seu apoio ao Magrão' : 'Entrar no time do Magrão'}
            </DialogTitle>
            <DialogDescription>
              {isApoiador
                ? 'Você já faz parte. Pode atualizar sua cidade ou retirar o apoio quando quiser.'
                : `Já somos ${totalApoiadores.toLocaleString('pt-BR')} apoiadores em Goiás. Diga de qual cidade você é.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Minha cidade</span>
              <CitySelect value={escolhida} onChange={setEscolhida} className="w-full" />
            </div>
            <Button onClick={confirmar} disabled={apoiar.isPending} className="w-full gap-2 rounded-full font-bold">
              {apoiar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {isApoiador ? 'Atualizar minha cidade' : 'Confirmar meu apoio'}
            </Button>
            {isApoiador && (
              <Button
                onClick={retirar}
                disabled={remover.isPending}
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
              >
                <HeartOff className="h-4 w-4" /> Retirar apoio
              </Button>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              Só a contagem por cidade fica pública. Seu telefone nunca aparece.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
