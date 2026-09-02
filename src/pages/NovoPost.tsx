import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Newspaper, Landmark, AlertTriangle, MessageCircle, ImagePlus, X, Loader2, ArrowLeft, ArrowRight, Upload, MapPin, ShieldCheck, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCidade } from '@/hooks/useCidade';
import CitySelect from '@/components/CitySelect';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Tipo = Exclude<Database['public']['Enums']['post_tipo'], 'enquete'>;

const tipos: { v: Tipo; label: string; icon: any }[] = [
  { v: 'noticia', label: 'Notícia', icon: Newspaper },
  { v: 'projeto', label: 'Projeto', icon: Landmark },
  { v: 'denuncia', label: 'Demanda', icon: AlertTriangle },
  { v: 'discussao', label: 'Discussão', icon: MessageCircle },
];

const schema = z.object({
  tipo: z.enum(['noticia', 'projeto', 'denuncia', 'discussao']),
  titulo: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
  corpo: z.string().trim().min(10, 'Conte um pouco mais').max(5000),
  cidade: z.string().trim().min(2, 'Escolha uma cidade'),
  prefeitura_id: z.string().uuid().nullable(),
  uf: z.string().length(2),
});

type Prefeitura = { id: string; cidade: string; uf: string };

export default function NovoPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, openAuth } = useAuth();

  const [tipo, setTipo] = useState<Tipo>('noticia');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const { cidade: cidadePadrao, setCidade: setCidadePadrao } = useCidade();
  const [cidade, setCidade] = useState<Prefeitura | null>(
    (location.state as any)?.prefeitura ?? null,
  );
  const [cidadeNome, setCidadeNome] = useState<string>(
    (location.state as any)?.prefeitura?.cidade ?? cidadePadrao,
  );
  const MAX_IMAGENS = 3;
  const [imagens, setImagens] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [anonimo, setAnonimo] = useState(false);
  const [bairro, setBairro] = useState<string>('');
  const [bairroOutro, setBairroOutro] = useState<string>('');
  const [bairrosLista, setBairrosLista] = useState<{ nome: string }[]>([]);

  // Cidade escolhida pelo usuário (qualquer município de Goiás). A prefeitura
  // é opcional: se ainda não existir cadastro, o post fica só com cidade/UF.
  useEffect(() => {
    let ativo = true;
    supabase
      .from('prefeituras')
      .select('id,cidade,uf')
      .eq('cidade', cidadeNome)
      .eq('uf', 'GO')
      .maybeSingle()
      .then(({ data }) => {
        if (!ativo) return;
        setCidade({ id: (data as any)?.id ?? null, cidade: cidadeNome, uf: 'GO' } as unknown as Prefeitura);
      });
    return () => { ativo = false; };
  }, [cidadeNome]);

  useEffect(() => {
    supabase.from('bairros').select('nome').eq('ativo', true).order('ordem')
      .then(({ data }) => setBairrosLista((data ?? []) as { nome: string }[]));
  }, []);

  useEffect(() => {
    if (user && pendingSubmit) {
      setPendingSubmit(false);
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingSubmit]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const restantes = MAX_IMAGENS - imagens.length;
    if (restantes <= 0) { toast.error(`Máximo de ${MAX_IMAGENS} imagens.`); return; }
    const novos: { file: File; preview: string }[] = [];
    for (const f of Array.from(files).slice(0, restantes)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(`"${f.name}": use JPG, PNG ou WEBP.`); continue;
      }
      if (f.size > 2 * 1024 * 1024) { toast.error(`"${f.name}" maior que 2MB.`); continue; }
      novos.push({ file: f, preview: URL.createObjectURL(f) });
    }
    if (novos.length) setImagens((prev) => [...prev, ...novos]);
  }

  function removeImagem(idx: number) {
    setImagens((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  }

  async function submit() {
    if (!user) {
      // valida antes de pedir login pra evitar perder digitação sem motivo
      const preview = schema.safeParse({
        tipo,
        titulo,
        corpo,
        cidade: cidade?.cidade ?? '',
        prefeitura_id: cidade?.id ?? null,
        uf: cidade?.uf ?? '',
      });
      if (!preview.success) { toast.error(preview.error.issues[0]?.message ?? 'Verifique os campos.'); return; }
      setPendingSubmit(true);
      openAuth();
      return;
    }
    const parsed = schema.safeParse({
      tipo,
      titulo,
      corpo,
      cidade: cidade?.cidade ?? '',
      prefeitura_id: cidade?.id ?? null,
      uf: cidade?.uf ?? '',
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Verifique os campos.'); return; }

    setSubmitting(true);
    try {
      let cover_url: string | null = null;
      const media_urls: string[] = [];
      for (const { file } of imagens) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await supabase.storage.from('post-media').upload(path, file, { upsert: false });
        if (up.error) throw new Error('Falha no upload da imagem: ' + up.error.message);
        const { data: signed, error: signErr } = await supabase.storage
          .from('post-media')
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (signErr || !signed) throw new Error('Falha ao gerar URL da imagem.');
        media_urls.push(signed.signedUrl);
      }
      if (media_urls.length) cover_url = media_urls[0];

      const { data: prof } = await supabase
        .from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();

      const bairroFinal = bairro === '__outro__'
        ? (bairroOutro.trim() || null)
        : (bairro ? bairro : null);

      const { error } = await supabase.from('posts').insert({
        tipo,
        titulo: parsed.data.titulo,
        corpo: parsed.data.corpo,
        cidade: parsed.data.cidade,
        prefeitura_id: parsed.data.prefeitura_id,
        uf: parsed.data.uf,
        autor_id: user.id,
        autor_display_name: anonimo ? 'Anônimo' : (prof?.display_name ?? 'Cidadão'),
        cover_url,
        media_urls: media_urls.length ? media_urls : null,
        status: 'pendente',
        is_anonimo: anonimo,
        bairro: bairroFinal,
      });
      if (error) throw error;

      toast.success('Enviado para análise! Você será avisado quando for publicado.');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao publicar.');
    } finally {
      setSubmitting(false);
    }
  }

  

  const tipoAtivo = tipos.find((t) => t.v === tipo)!;
  const tituloPct = Math.min(100, (titulo.length / 120) * 100);
  const corpoPct = Math.min(100, (corpo.length / 5000) * 100);
  const canSubmit = titulo.trim().length >= 3 && corpo.trim().length >= 10 && !submitting;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-xl px-4 py-4 sm:py-8">
        <div className="rounded-[0.875rem] bg-card border border-border/60 shadow-[0_10px_40px_-15px_hsl(var(--secondary)/0.12)] overflow-hidden">
          {/* Header editorial */}
          <div className="p-5 sm:p-6 pb-2">
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5 text-secondary" />
              </button>
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                Nova publicação
              </span>
            </div>

            <h1 className="font-display text-[26px] sm:text-3xl font-extrabold tracking-[-0.02em] text-secondary leading-[1.1]">
              O que <span className="text-primary">sua cidade</span> precisa?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Mande sua demanda, uma notícia, um projeto ou abra um debate. O Magrão e a equipe leem.
            </p>
          </div>

          {/* Corpo */}
          <div className="px-5 sm:px-6 py-4 space-y-6">
            {/* Tipo — chips */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {tipos.map((t) => {
                  const Icon = t.icon;
                  const active = tipo === t.v;
                  return (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => setTipo(t.v)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-all min-h-[40px] ${
                        active
                          ? 'bg-accent border border-accent text-accent-foreground font-bold shadow-sm shadow-accent/40'
                          : 'bg-card border border-border text-secondary/80 font-medium hover:border-accent/60 hover:text-secondary'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="titulo" className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  TÍTULO
                </label>
                <span className={`text-[11px] font-semibold tabular-nums ${titulo.length > 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {titulo.length}/120
                </span>
              </div>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                placeholder="Ex: Buraco na Rua José Walter"
                className="text-base font-semibold h-12 bg-muted border-border/70 text-foreground placeholder:text-muted-foreground focus-visible:bg-card focus-visible:border-primary"
              />
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${tituloPct}%` }} />
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="corpo" className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  DESCRIÇÃO
                </label>
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    corpo.trim().length > 0 && corpo.trim().length < 10
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {corpo.trim().length < 10
                    ? `Faltam ${10 - corpo.trim().length} caracteres (mín. 10)`
                    : `${corpo.length}/5000`}
                </span>
              </div>
              <Textarea
                id="corpo"
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Descreva com mais informações sua publicação."
                className="text-[15px] leading-relaxed bg-muted border-border/70 text-foreground placeholder:text-muted-foreground focus-visible:bg-card focus-visible:border-primary resize-none"
              />
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${corpoPct}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                A descrição precisa ter pelo menos 10 caracteres para liberar o envio.
              </p>
            </div>

            {/* Imagens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Fotos <span className="text-muted-foreground font-medium normal-case tracking-normal">(opcional)</span>
                </label>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {imagens.length}/{MAX_IMAGENS}
                </span>
              </div>

              {imagens.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagens.map((img, i) => (
                    <div key={i} className="relative rounded-[0.75rem] overflow-hidden border border-border aspect-square">
                      <img src={img.preview} alt={`prévia ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-secondary/90 text-secondary-foreground px-1.5 py-0.5 text-[10px] font-semibold">
                          Capa
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImagem(i)}
                        className="absolute top-1 right-1 rounded-full bg-card/95 p-1 shadow"
                        aria-label="Remover imagem"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagens.length < MAX_IMAGENS && (
                <label className="group flex flex-col items-center justify-center gap-2 rounded-[0.875rem] border-2 border-dashed border-primary/25 bg-primary/[0.04] py-7 cursor-pointer hover:bg-primary/[0.08] hover:border-primary/40 transition-all">
                  <div className="w-11 h-11 rounded-full bg-card shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-secondary">
                    {imagens.length === 0 ? 'Adicionar foto ou vídeo' : 'Adicionar mais uma'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">JPG, PNG ou WEBP · até 2MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                  />
                </label>
              )}
            </div>

            {/* Cidade — qualquer município de Goiás */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Cidade</label>
              <CitySelect
                value={cidadeNome}
                onChange={(c) => { setCidadeNome(c); setCidadePadrao(c); }}
                className="w-full sm:w-auto"
              />
            </div>

            {/* Bairro — opcional */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Bairro <span className="text-muted-foreground font-medium normal-case tracking-normal">(opcional)</span>
              </label>
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger className="h-11 bg-muted border-border/70">
                  <SelectValue placeholder="Selecione seu bairro" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {bairrosLista.map((b) => (
                    <SelectItem key={b.nome} value={b.nome}>{b.nome}</SelectItem>
                  ))}
                  <SelectItem value="__outro__">Outro bairro…</SelectItem>
                </SelectContent>
              </Select>
              {bairro === '__outro__' && (
                <Input
                  value={bairroOutro}
                  onChange={(e) => setBairroOutro(e.target.value)}
                  maxLength={60}
                  placeholder="Digite o nome do bairro"
                  className="h-11 bg-muted border-border/70"
                />
              )}
            </div>


            {/* Modo anônimo */}
            <button
              type="button"
              onClick={() => setAnonimo((v) => !v)}
              aria-pressed={anonimo}
              className="w-full flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-2.5 text-left hover:border-primary/30 transition-colors"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${anonimo ? 'bg-primary text-primary-foreground' : 'bg-muted text-secondary'}`}>
                <EyeOff className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 text-sm font-semibold text-secondary">Publicar anônimo</span>
              <span
                role="switch"
                aria-checked={anonimo}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${anonimo ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${anonimo ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </span>
            </button>
          </div>


          {/* Ação */}
          <div className="p-5 sm:p-6 pt-2">
            <Button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full h-14 rounded-[0.875rem] bg-primary hover:bg-secondary text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  Realizar Publicação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Sua publicação passa pela moderação antes de ir pro feed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
