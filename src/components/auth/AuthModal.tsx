import { useEffect, useRef, useState } from 'react';
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
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { formatCpf, cpfDigits, isValidCpf } from '@/lib/cpf';
import { cn } from '@/lib/utils';

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

type Step = 'phone' | 'code' | 'signup';

type FnResult = {
  ok?: boolean;
  error?: string;
  code?: string;
  field?: 'name' | 'cpf' | 'lgpd';
  needs_signup?: boolean;
  token_hash?: string;
  display_name?: string;
};

/** Lê o corpo da resposta mesmo quando a função responde com status de erro. */
async function readFnError(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (!ctx?.json) return null;
  try {
    const body = (await ctx.json()) as { error?: string };
    return body?.error ?? null;
  } catch {
    return null;
  }
}

export default function AuthModal() {
  const { isAuthOpen, closeAuth } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [lgpd, setLgpd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'name' | 'cpf' | 'lgpd' | null>(null);
  const inFlightRef = useRef(false);
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const reset = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setName('');
    setCpf('');
    setLgpd(false);
    setResendIn(0);
    setFormError(null);
    setErrorField(null);
    inFlightRef.current = false;
    sessionStartedRef.current = false;
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const codeOk = /^\d{4}$/.test(code);
  const cpfOk = isValidCpf(cpf);
  const nameOk = name.trim().length >= 2;

  const sendCode = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setFormError(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send-otp', { body: { phone } });
      const d = (data ?? {}) as FnResult;
      const msg = d.error ?? (error ? await readFnError(error) : null);
      if (msg || error) {
        const finalMsg = msg || 'Não conseguimos enviar o código agora. Tente de novo em instantes.';
        setFormError(finalMsg);
        toast.error(finalMsg);
        return;
      }
      setStep('code');
      setResendIn(60);
      toast.success('Código enviado no seu WhatsApp.');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const verify = async (signupData?: { name: string; cpf: string; lgpd: boolean }) => {
    if (inFlightRef.current || sessionStartedRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setFormError(null);
    setErrorField(null);
    try {
      const body: Record<string, unknown> = { phone, code };
      if (signupData) {
        body.name = signupData.name;
        body.cpf = signupData.cpf;
        body.lgpd = signupData.lgpd;
      }
      const { data, error } = await supabase.functions.invoke('whatsapp-verify-otp', { body });
      const d = (data ?? {}) as FnResult;
      const msg = d.error ?? (error ? await readFnError(error) : null);
      if (msg || error) {
        const finalMsg = msg || 'Não conseguimos confirmar o código agora. Tente de novo em instantes.';
        if (d.needs_signup) setStep('signup');
        setErrorField(d.field ?? null);
        setFormError(finalMsg);
        toast.error(finalMsg);
        return;
      }
      if (d.needs_signup) {
        setStep('signup');
        return;
      }
      if (!d.token_hash) {
        setFormError('Não conseguimos abrir sua sessão. Peça um novo código.');
        toast.error('Não conseguimos abrir sua sessão. Peça um novo código.');
        return;
      }
      sessionStartedRef.current = true;
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: d.token_hash,
      });
      if (verifyErr) {
        sessionStartedRef.current = false;
        setFormError('Não conseguimos abrir sua sessão. Tente novamente.');
        toast.error('Não conseguimos abrir sua sessão. Tente novamente.');
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
    if (!phoneOk) { setFormError('Digite um WhatsApp válido, com DDD.'); return; }
    await sendCode();
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeOk) { setFormError('Digite os 4 dígitos que enviamos.'); return; }
    await verify();
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOk) { setErrorField('name'); setFormError('Escreva seu nome ou apelido.'); return; }
    if (!cpfOk) { setErrorField('cpf'); setFormError('Esse CPF não é válido. Confira os números.'); return; }
    if (!lgpd) { setErrorField('lgpd'); setFormError('Aceite os termos para continuar.'); return; }
    await verify({ name: name.trim(), cpf: cpfDigits(cpf), lgpd: true });
  };

  const stepIndex = step === 'phone' ? 0 : step === 'code' ? 1 : 2;
  const totalSteps = 3;

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
                setFormError(null);
                setErrorField(null);
                setStep(step === 'signup' ? 'code' : 'phone');
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
              {step === 'phone' && 'Entrar no site'}
              {step === 'code' && 'Confirme seu código'}
              {step === 'signup' && 'Falta pouco!'}
            </span>
          </h2>
          <p className="mt-1 text-center text-sm text-white/85">
            <span>
              {step === 'phone' && 'Cadastro seguro.'}
              {step === 'code' && `Enviamos um código para ${phone}`}
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
                  Enviamos um código de 4 dígitos no seu WhatsApp.
                </p>
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !phoneOk}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Receber código <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                <span>Seu telefone não será exposto.</span>
              </div>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={submitCode} className="space-y-5 animate-fade-up">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80 flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Confira a mensagem do WhatsApp. O código expira em 15 minutos.</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-foreground">
                  Código de 4 dígitos
                </Label>
                <Input
                  id="code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  inputMode="numeric"
                  maxLength={4}
                  className="h-14 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !codeOk}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Confirmar <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>

              <button
                type="button"
                onClick={() => { if (resendIn === 0 && !loading) sendCode(); }}
                disabled={resendIn > 0 || loading}
                className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                {resendIn > 0 ? `Reenviar código em ${resendIn}s` : 'Não recebeu? Reenviar código'}
              </button>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={submitSignup} className="space-y-4 animate-fade-up">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                 <span>Número novo por aqui — vamos criar seu cadastro.</span>
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
                  className={cn(
                    'h-12 rounded-xl text-base',
                    errorField === 'name' && 'border-destructive focus-visible:ring-destructive',
                  )}
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
                      ((cpf.length === 14 && !cpfOk) || errorField === 'cpf') &&
                        'border-destructive focus-visible:ring-destructive',
                    )}
                  />
                  {cpfOk && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O CPF garante um cadastro por pessoa e não aparece no site.
                </p>
              </div>

              <div className={cn(
                'rounded-xl border bg-muted/30 p-3',
                errorField === 'lgpd' ? 'border-destructive' : 'border-border',
              )}>
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

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

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
