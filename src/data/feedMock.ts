export type PostTipo = 'noticia' | 'projeto' | 'enquete' | 'denuncia' | 'discussao';

export interface FeedPost {
  id: string;
  tipo: PostTipo;
  titulo: string;
  resumo: string;
  cidade: string;
  uf: string;
  autor: string;
  is_official: boolean;
  cover?: string;
  reactions: { like: number; dislike: number; fire: number; angry: number };
  comments: number;
  createdAt: string;
  enquete?: { pergunta: string; opcoes: { id: string; texto: string; votos: number }[] };
}

export const mockFeed: FeedPost[] = [
  {
    id: '1', tipo: 'noticia', is_official: true,
    titulo: 'Câmara de Goiânia aprova reajuste de 22% no IPTU para 2027',
    resumo: 'Projeto passou em segunda votação ontem à noite. Vereadores divididos. Veja como cada um votou e diga o que você acha.',
    cidade: 'Goiânia', uf: 'GO', autor: 'Redação Rio Verde no Ar',
    reactions: { like: 142, dislike: 1203, fire: 87, angry: 945 },
    comments: 312, createdAt: 'há 2h',
  },
  {
    id: '2', tipo: 'enquete', is_official: true,
    titulo: 'Você aprova a gestão atual da prefeitura de Aparecida?',
    resumo: 'Votação aberta para todos os moradores. Resultado vira pesquisa publicada.',
    cidade: 'Aparecida de Goiânia', uf: 'GO', autor: 'Rio Verde no Ar',
    reactions: { like: 89, dislike: 22, fire: 14, angry: 8 },
    comments: 67, createdAt: 'há 5h',
    enquete: {
      pergunta: 'Aprova a gestão atual?',
      opcoes: [
        { id: 'a', texto: 'Aprovo totalmente', votos: 312 },
        { id: 'b', texto: 'Aprovo em parte', votos: 580 },
        { id: 'c', texto: 'Reprovo', votos: 1240 },
        { id: 'd', texto: 'Reprovo totalmente', votos: 890 },
      ],
    },
  },
  {
    id: '3', tipo: 'denuncia', is_official: false,
    titulo: 'Rua sem iluminação há 3 meses no setor Pedro Ludovico',
    resumo: 'Várias famílias passando perigo voltando do trabalho. Já abrimos chamado, ninguém atende.',
    cidade: 'Goiânia', uf: 'GO', autor: 'Cidadão de Goiânia',
    reactions: { like: 245, dislike: 3, fire: 198, angry: 412 },
    comments: 89, createdAt: 'há 1d',
  },
  {
    id: '4', tipo: 'projeto', is_official: true,
    titulo: 'Projeto cria passe livre estudantil em Anápolis',
    resumo: 'Vereador Marcos Silva (PT) protocolou projeto que beneficiaria 28 mil estudantes. Você apoia?',
    cidade: 'Anápolis', uf: 'GO', autor: 'Redação Rio Verde no Ar',
    reactions: { like: 892, dislike: 45, fire: 234, angry: 12 },
    comments: 156, createdAt: 'há 2d',
  },
  {
    id: '5', tipo: 'discussao', is_official: false,
    titulo: 'O que vocês acham da nova praça da Matriz?',
    resumo: 'Acabou de ser entregue. Fui visitar hoje, achei top mas o estacionamento ficou pequeno.',
    cidade: 'Rio Verde', uf: 'GO', autor: 'Maria de Rio Verde',
    reactions: { like: 67, dislike: 8, fire: 23, angry: 4 },
    comments: 42, createdAt: 'há 3d',
  },
];

export interface CityHighlight {
  cidade: string;
  uf: string;
  slug: string;
  prefeito: string;
  rating: number;
  ratingCount: number;
}

export const cityHighlights: CityHighlight[] = [
  { cidade: 'Goiânia', uf: 'GO', slug: 'goiania-go', prefeito: 'Sandro Mabel', rating: 2.4, ratingCount: 1840 },
  { cidade: 'Aparecida de Goiânia', uf: 'GO', slug: 'aparecida-de-goiania-go', prefeito: 'Leandro Vilela', rating: 3.1, ratingCount: 920 },
  { cidade: 'Anápolis', uf: 'GO', slug: 'anapolis-go', prefeito: 'Márcio Corrêa', rating: 3.8, ratingCount: 612 },
  { cidade: 'Rio Verde', uf: 'GO', slug: 'rio-verde-go', prefeito: 'Paulo do Vale', rating: 4.1, ratingCount: 478 },
];
