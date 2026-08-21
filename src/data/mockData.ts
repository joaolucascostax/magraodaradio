export type ComplaintStatus = 'pendente' | 'em_analise' | 'respondido' | 'resolvido';
export type Category = 'saude' | 'seguranca' | 'infraestrutura' | 'educacao' | 'transporte' | 'saneamento' | 'iluminacao' | 'meio_ambiente' | 'outros';
export type PostTipo = 'noticia' | 'projeto' | 'enquete' | 'denuncia' | 'discussao';

export interface Complaint {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string | null;
  isVerified: boolean;
  title: string;
  description: string;
  category: Category;
  tipo: PostTipo;
  city: string;
  neighborhood?: string;
  photoUrl?: string;
  audioUrl?: string;
  afterPhotoUrl?: string;
  status: ComplaintStatus;
  officialResponse?: string;
  officialResponseDate?: string;
  promiseText?: string;
  promiseDeadline?: string;
  supportCount: number;
  weeklySupportCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  complaintId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  isOfficial: boolean;
  createdAt: string;
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number; imageUrl: string | null }[];
  isActive: boolean;
  allowMultiple: boolean;
  coverUrl: string | null;
  createdBy: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  city: string;
  neighborhood?: string;
  badges: string[];
  complaintCount: number;
  supportCount: number;
}

export const categoryLabels: Record<Category, string> = {
  saude: 'Saúde',
  seguranca: 'Segurança',
  infraestrutura: 'Infraestrutura',
  educacao: 'Educação',
  transporte: 'Transporte',
  saneamento: 'Saneamento',
  iluminacao: 'Iluminação',
  meio_ambiente: 'Meio Ambiente',
  outros: 'Outros',
};

export const categoryColors: Record<Category, string> = {
  saude: 'bg-red-100 text-red-700',
  seguranca: 'bg-orange-100 text-orange-700',
  infraestrutura: 'bg-yellow-100 text-yellow-700',
  educacao: 'bg-blue-100 text-blue-700',
  transporte: 'bg-purple-100 text-purple-700',
  saneamento: 'bg-teal-100 text-teal-700',
  iluminacao: 'bg-amber-100 text-amber-700',
  meio_ambiente: 'bg-green-100 text-green-700',
  outros: 'bg-gray-100 text-gray-700',
};

export const postTipoLabels: Record<PostTipo, string> = {
  noticia: 'Notícia',
  projeto: 'Projeto',
  enquete: 'Enquete',
  denuncia: 'Denúncia',
  discussao: 'Discussão',
};

export const postTipoColors: Record<PostTipo, string> = {
  noticia: 'bg-blue-100 text-blue-700',
  projeto: 'bg-amber-100 text-amber-700',
  denuncia: 'bg-red-100 text-red-700',
  discussao: 'bg-purple-100 text-purple-700',
  enquete: 'bg-green-100 text-green-700',
};

export const statusLabels: Record<ComplaintStatus, string> = {
  pendente: 'PENDENTE',
  em_analise: '👁️ O POVO TÁ DE OLHO',
  respondido: '📢 RESPONDERAM',
  resolvido: '✊ O POVO RESOLVEU',
};

export const statusColors: Record<ComplaintStatus, string> = {
  pendente: 'bg-destructive text-destructive-foreground border-2 border-foreground',
  em_analise: 'bg-foreground text-highlight border-2 border-foreground',
  respondido: 'bg-background text-foreground border-2 border-foreground',
  resolvido: 'bg-success text-success-foreground border-2 border-foreground',
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const goiasCities = [
  'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia',
  'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama',
  'Senador Canedo', 'Catalão', 'Itumbiara', 'Jataí', 'Planaltina',
  'Caldas Novas', 'Inhumas', 'Mineiros', 'Goianésia', 'Jaraguá',
];
