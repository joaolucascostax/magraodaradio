import { supabase } from '@/integrations/supabase/client';
import type { Complaint, Comment, Poll, Category, ComplaintStatus, PostTipo } from '@/data/mockData';
import type { Database } from '@/integrations/supabase/types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostCommentRow = Database['public']['Tables']['post_comments']['Row'];
type PollRow = Database['public']['Tables']['polls']['Row'];
type PollOptionRow = Database['public']['Tables']['poll_options']['Row'];

/**
 * Adapta uma linha de `posts` (tipo=denuncia) para a interface Complaint
 * que a UI ainda consome. Assim mantemos os componentes sem mudanças de contrato.
 */
export function mapComplaint(r: PostRow): Complaint {
  return {
    id: r.id,
    authorId: r.autor_id,
    authorName: r.autor_display_name,
    authorAvatar: null,
    isVerified: r.is_official,
    title: r.titulo,
    description: r.corpo ?? '',
    category: (r.categoria ?? 'outros') as Category,
    tipo: (r.tipo ?? 'discussao') as PostTipo,
    city: r.cidade ?? 'Rio Verde',
    neighborhood: r.bairro ?? undefined,
    photoUrl: r.cover_url ?? undefined,
    audioUrl: r.audio_url ?? undefined,
    afterPhotoUrl: r.after_photo_url ?? undefined,
    status: (r.status_denuncia ?? 'pendente') as ComplaintStatus,
    officialResponse: r.official_response ?? undefined,
    officialResponseDate: r.official_response_date ?? undefined,
    promiseText: r.promise_text ?? undefined,
    promiseDeadline: r.promise_deadline ?? undefined,
    supportCount: r.support_count ?? 0,
    weeklySupportCount: r.weekly_support_count ?? 0,
    commentCount: r.comment_count,
    createdAt: r.created_at,
  };
}

export function mapComment(r: PostCommentRow): Comment {
  return {
    id: r.id,
    complaintId: r.post_id,
    authorId: r.autor_id,
    authorName: r.autor_display_name,
    authorAvatar: null,
    content: r.conteudo,
    isOfficial: false,
    createdAt: r.created_at,
  };
}

export function mapPoll(row: any & { poll_options: any[] }): Poll {
  const options = [...(row.poll_options ?? [])].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    question: row.question,
    isActive: row.is_active,
    allowMultiple: !!row.allow_multiple,
    coverUrl: row.cover_url ?? null,
    createdBy: row.created_by ?? null,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    options: options.map((o: any) => ({
      id: o.id,
      text: o.text,
      votes: o.vote_count,
      imageUrl: o.foto_url ?? null,
    })),
  };
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const { data, error } = await supabase
    .from('posts_public' as never).select('*').eq('tipo', 'denuncia').eq('status', 'aprovado')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as PostRow[]).map(mapComplaint);
}

export async function fetchComplaint(id: string): Promise<Complaint | null> {
  // Não filtramos por tipo aqui: a rota /reclamacao/:id é usada como página de
  // detalhe genérica para qualquer post do feed (denúncia, notícia, projeto,
  // discussão). Filtrar por tipo fazia posts não-denúncia abrirem em branco.
  const { data, error } = await supabase
    .from('posts_public' as never).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapComplaint(data as unknown as PostRow) : null;
}

export async function fetchComments(complaintId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('post_comments_public' as never).select('*').eq('post_id', complaintId)
    .eq('is_hidden', false).order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as PostCommentRow[]).map(mapComment);
}

export async function fetchPolls(): Promise<Poll[]> {
  const { data, error } = await supabase
    .from('polls').select('*, poll_options(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => mapPoll(p));
}

export async function fetchPoll(id: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls').select('*, poll_options(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapPoll(data as any) : null;
}

/**
 * Retorna o Set de option_ids em que o usuário votou.
 * Suporta enquetes de múltipla escolha (várias opções por poll).
 */
export async function fetchUserVotes(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('poll_votes').select('option_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((v) => v.option_id));
}

export async function fetchUserSupports(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('user_id', userId)
    .eq('tipo', 'like');
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.post_id));
}
