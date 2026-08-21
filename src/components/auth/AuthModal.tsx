import { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Phone,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  IdCard,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCpf, cpfDigits, isValidCpf } from '@/lib/cpf';
import { cn } from '@/lib/utils';

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

type Step = 'phone' | 'signup';

export default function AuthModal() {
  const { isAuthOpen, closeAuth } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [lgpd, setLgpd] = useState(false);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const sessionStartedRef = useRef(false);

  const reset = () => {
    setStep('phone');
    setPhone('');
    setName('');
    setCpf('');
    setLgpd(false);
    inFlightRef.current = false;
    sessionStartedRef.current = false;
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const cpfOk = isValidCpf(cpf);
  const nameOk = name.trim().length >= 2;

  const login = async (signupData?: { name: string; cpf: string; lgpd: boolean }) => {
    if (inFlightRef.current || sessionStartedRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const body: Record<string, unknown> = { phone };
      if (signupData) {
        body.name = signupData.name;
        body.cpf = signupData.cpf;
        body.lgpd = signupData.lgpd;
      }
      const { data, error } = await supabase.functions.invoke('dev-phone-login', { body });
      const d = (data ?? {}) as { error?: string; needs_signup?: boolean; token_hash?: string; display_name?: string };
      if (error || d.error) {
        toast.error(d.error || error?.message || 'Erro ao entrar.');
        return;
      }
      if (d.needs_signup) {
        setStep('signup');
        return;
      }
      if (!d.token_hash) {
        toast.error('Falha ao iniciar sessão.');
        return;
      }
      sessionStartedRef.current = true;
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: d.token_hash,
      });
      if (verifyErr) {
        sessionStartedRef.current = false;
        toast.error('Falha ao iniciar sessão. Tente novamente.');
        return;
      }
      const first = (d.display_name || '').split(' ')[0];
      toast.success(first ? `Bem-vindo, ${first}!` : 'Bem-vindo!');
      closeAuth();
      reset();
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOk) return toast.error('Digite um WhatsApp válido.');
    await login();
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOk) return toast.error('Informe seu nome ou apelido.');
    if (!cpfOk) return toast.error('CPF inválido.');
    if (!lgpd) return toast.error('É preciso aceitar os termos.');
    await login({ name: name.trim(), cpf: cpfDigits(cpf), lgpd: true });
  };

  const stepIndex = step === 'phone' ? 0 : 1;
  const totalSteps = 2;

  return (
    <Dialog open={isAuthOpen} onOpenChange={(o) => { if (!o) { closeAuth(); reset(); } }}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl"
        aria-describedby={undefined}
      >
        <div className="relative bg-gradient-to-br from-secondary via-secondary to-primary/90 px-6 pt-6 pb-8 text-white">
          {step !== 'phone' && (
            <button
              onClick={() => {
                if (loading) return;
                setStep('phone');
              }}
              className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-secondary shadow-lg ring-4 ring-white/20">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-center text-2xl font-display font-black tracking-tight">
            <span>
              {step === 'phone' && 'Entrar no Portal da Cidade'}
              {step === 'signup' && 'Falta pouco!'}
            </span>
          </h2>
          <p className="mt-1 text-center text-sm text-white/85">
            <span>
              {step === 'phone' && '1 WhatsApp = 1 Pessoa'}
              {step === 'signup' && 'Complete seu cadastro'}
            </span>
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === stepIndex ? 'w-8 bg-primary' : i < stepIndex ? 'w-4 bg-primary/60' : 'w-4 bg-white/25',
                )}
              />
            ))}
          </div>
        </div>

        <div className="bg-background px-6 py-6">
          <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/80 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <span>
              <strong>Modo teste:</strong> a verificação por WhatsApp está temporariamente desativada. Em breve voltaremos com a confirmação por código.
            </span>
          </div>

          {step === 'phone' && (
            <form onSubmit={submitPhone} className="space-y-5 animate-fade-up">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                  Seu WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(64) 9 9999-9999"
                    inputMode="tel"
                    maxLength={16}
                    className="h-12 pl-11 text-base rounded-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Durante os testes, entramos direto sem enviar código.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !phoneOk}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Entrar <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                <span>Seu telefone não será exposto.</span>
              </div>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={submitSignup} className="space-y-4 animate-fade-up">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Número novo por aqui — vamos criar sua conta. É rapidinho.</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> Nome ou apelido
                </Label>
                <Input
                  id="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como quer ser chamado(a)"
                  maxLength={50}
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf" className="text-sm font-semibold flex items-center gap-1.5">
                  <IdCard className="h-3.5 w-3.5" /> CPF
                </Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={14}
                    className={cn(
                      'h-12 rounded-xl text-base pr-11',
                      cpf.length === 14 && !cpfOk && 'border-destructive focus-visible:ring-destructive',
                    )}
                  />
                  {cpfOk && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Usado só para garantir 1 pessoa = 1 voto. Nunca aparece publicamente.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    id="lgpd"
                    checked={lgpd}
                    onCheckedChange={(v) => setLgpd(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-foreground/85 leading-relaxed">
                    Li e aceito os <a href="/termos" target="_blank" className="font-semibold text-secondary underline">Termos de Uso</a> e a <a href="/privacidade" target="_blank" className="font-semibold text-secondary underline">Política de Privacidade</a> (LGPD).
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !nameOk || !cpfOk || !lgpd}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Concluir cadastro <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
