import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import CitySelect from '@/components/CitySelect';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMeuApoio } from '@/hooks/useApoio';
import { fetchUserSupports, mapComplaint } from '@/lib/api';
import { statusLabels, statusColors } from '@/data/mockData';

interface MyProfile {
  display_name: string | null;
  avatar_url: string | null;
  phone_e164: string | null;
  phone_verified: boolean;
  default_city: string | null;
  created_at: string;
}

function maskPhone(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ••••-${digits.slice(-4)}`;
}

function initials(name?: string | null) {
  if (!name) return 'A';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Perfil() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarSigned, setAvatarSigned] = useState<string | null>(null);

  // Rota protegida por <RequireAuth>; user é garantido aqui.
  if (!user) return null;

  const { apoio, isApoiador, apoiar, remover } = useMeuApoio();

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user.id],
    queryFn: async (): Promise<MyProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name,avatar_url,phone_e164,phone_verified,default_city,created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as MyProfile) ?? null;
    },
  });

  useEffect(() => {
    setNome(
      profile?.display_name?.trim() ||
        (user.user_metadata?.display_name as string | undefined)?.trim() ||
        (user.email ? user.email.split('@')[0] : ''),
    );
    setCidade(profile?.default_city ?? apoio?.cidade ?? '');
  }, [profile, apoio?.cidade, user]);

  // Avatar é privado no armazenamento: gera URL assinada quando necessário.
  useEffect(() => {
    const path = profile?.avatar_url;
    if (!path) {
      setAvatarSigned(null);
      return;
    }
    if (path.startsWith('http')) {
      setAvatarSigned(path);
      return;
    }
    let active = true;
    supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data }) => {
        if (active) setAvatarSigned(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  const { data: myComplaints = [] } = useQuery({
    queryKey: ['my-complaints', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('tipo', 'denuncia')
        .eq('autor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapComplaint);
    },
  });

  const { data: supports = new Set<string>() } = useQuery({
    queryKey: ['my-supports', user.id],
    queryFn: () => fetchUserSupports(user.id),
  });

  const { data: supported = [] } = useQuery({
    queryKey: ['my-supported-posts', user.id, [...supports].length],
    enabled: supports.size > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('id', [...supports])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapComplaint);
    },
  });

  const { data: myComments = [] } = useQuery({
    queryKey: ['my-comments', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id,conteudo,created_at,post_id,is_anonimo')
        .eq('autor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: voteCount = 0 } = useQuery({
    queryKey: ['my-vote-count', user.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('poll_votes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const nomeLimpo = nome.trim();
      if (nomeLimpo.length < 2) throw new Error('Escreva seu nome com pelo menos 2 letras.');
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: user.id, display_name: nomeLimpo, default_city: cidade || null, default_uf: 'GO' },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
      if (cidade && isApoiador && apoio?.cidade !== cidade) await apoiar.mutateAsync(cidade);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile', user.id] });
      setEditOpen(false);
      toast.success('Perfil atualizado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAvatar(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A foto precisa ter menos de 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: user.id, display_name: nomeExibido, avatar_url: path },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['my-profile', user.id] });
      toast.success('Foto atualizada!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  }

  const nomeFallback =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    (user.email ? user.email.split('@')[0] : '') ||
    'Apoiador';
  const nomeExibido = profile?.display_name?.trim() || nomeFallback;
  const cidadeExibida = profile?.default_city || apoio?.cidade || null;
  const desde = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null;

  // Nível de participação: quanto mais o apoiador age, mais completo fica.
  const checklist = [
    { label: 'Cadastro confirmado', done: true },
    { label: 'Foto no perfil', done: !!profile?.avatar_url },
    { label: 'Apoio declarado', done: isApoiador },
    { label: 'Primeira demanda', done: myComplaints.length > 0 },
    { label: 'Primeiro voto', done: voteCount > 0 },
  ];
  const feitos = checklist.filter((c) => c.done).length;
  const progresso = Math.round((feitos / checklist.length) * 100);


  return (
    <div className="pb-24 sm:pb-10">
      <div className="relative h-32 sm:h-48 bg-gradient-hero">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full h-6 sm:h-8" preserveAspectRatio="none">
            <path d="M0 48h1440V24C1200 48 960 0 720 24S240 48 0 24v24z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto -mt-12 sm:-mt-16 relative z-10 space-y-5">
        {/* Cartão de identidade */}
        <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <div className="relative -mt-12 sm:-mt-16">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-card shadow-elevated">
                {avatarSigned && <AvatarImage src={avatarSigned} alt={`Foto de ${nomeExibido}`} className="object-cover" />}
                <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-2xl font-black">
                  {initials(nomeExibido)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Trocar foto do perfil"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated border-2 border-card"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                  e.target.value = '';
                }}
              />
            </div>

            <h1 className="mt-3 text-lg sm:text-xl font-black text-foreground break-words">{nomeExibido}</h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              {isApoiador && (
                <Badge className="rounded-full bg-highlight/15 text-highlight font-semibold text-[11px]">
                  <Sparkles className="mr-1 h-3 w-3" /> Apoiador
                </Badge>
              )}
              {cidadeExibida && (
                <Badge variant="outline" className="rounded-full font-semibold text-[11px]">
                  <MapPin className="mr-1 h-3 w-3" /> {cidadeExibida} / GO
                </Badge>
              )}
              {profile?.phone_verified && (
                <Badge variant="outline" className="rounded-full font-semibold text-[11px]">
                  <ShieldCheck className="mr-1 h-3 w-3 text-primary" /> Verificado
                </Badge>
              )}
            </div>
            {desde && <p className="mt-2 text-xs text-muted-foreground">No Magrão no Ar desde {desde}</p>}
            {profile?.phone_e164 && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {maskPhone(profile.phone_e164)}
              </p>
            )}

            <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => setEditOpen(true)} className="h-11 rounded-full font-bold">
                <Pencil className="mr-1.5 h-4 w-4" /> Editar perfil
              </Button>
              {isApoiador ? (
                <Button
                  variant="outline"
                  className="h-11 rounded-full font-semibold"
                  onClick={() => remover.mutate()}
                  disabled={remover.isPending}
                >
                  Remover meu apoio
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-11 rounded-full font-semibold"
                  onClick={() => (cidade ? apoiar.mutate(cidade) : setEditOpen(true))}
                  disabled={apoiar.isPending}
                >
                  <Heart className="mr-1.5 h-4 w-4" /> Quero apoiar
                </Button>
              )}
            </div>
          </div>
        </div>


        {/* Participação */}
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-sm text-foreground">Sua participação</h2>
            <span className="text-xs font-bold text-primary">{progresso}%</span>
          </div>
          <Progress value={progresso} className="mt-2 h-2" />
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${c.done ? 'text-primary' : 'text-muted-foreground/40'}`} />
                <span className={c.done ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Minha atividade */}
        <Tabs defaultValue="demandas">
          <TabsList className="w-full rounded-full">
            <TabsTrigger value="demandas" className="flex-1 rounded-full text-xs sm:text-sm">
              Demandas
            </TabsTrigger>
            <TabsTrigger value="apoios" className="flex-1 rounded-full text-xs sm:text-sm">
              Apoios
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="flex-1 rounded-full text-xs sm:text-sm">
              Comentários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demandas" className="mt-3 space-y-2.5">
            {myComplaints.map((c) => (
              <Link
                key={c.id}
                to={`/reclamacao/${c.id}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-base text-foreground">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.city} · {c.supportCount} apoios
                  </p>
                </div>
                <Badge className={`${statusColors[c.status]} shrink-0 rounded-lg font-semibold text-[10px]`}>
                  {statusLabels[c.status]}
                </Badge>
              </Link>
            ))}
            {myComplaints.length === 0 && (
              <p className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                Você ainda não registrou demandas.
              </p>
            )}
          </TabsContent>

          <TabsContent value="apoios" className="mt-3 space-y-2.5">
            {supported.map((c) => (
              <Link
                key={c.id}
                to={`/reclamacao/${c.id}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all min-h-[44px]"
              >
                <Heart className="h-4 w-4 shrink-0 text-highlight" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-base text-foreground">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground">{c.city}</p>
                </div>
              </Link>
            ))}
            {supported.length === 0 && (
              <p className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                Você ainda não apoiou publicações.
              </p>
            )}
          </TabsContent>

          <TabsContent value="comentarios" className="mt-3 space-y-2.5">
            {myComments.map((c) => (
              <Link
                key={c.id}
                to={`/reclamacao/${c.post_id}`}
                className="block rounded-2xl border bg-card p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all"
              >
                <p className="text-xs sm:text-sm text-foreground line-clamp-3">{c.conteudo}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  {c.is_anonimo ? ' · enviado como anônimo' : ''}
                </p>
              </Link>
            ))}
            {myComments.length === 0 && (
              <p className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                Você ainda não comentou.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <Button variant="ghost" className="w-full h-11 rounded-full font-semibold text-muted-foreground" onClick={() => signOut()}>
          <LogOut className="mr-1.5 h-4 w-4" /> Sair da conta
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[min(28rem,92vw)] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="perfil-nome">Seu nome</Label>
              <Input
                id="perfil-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como você quer aparecer"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sua cidade</Label>
              <CitySelect value={cidade} onChange={setCidade} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-11 w-full rounded-full font-bold"
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
