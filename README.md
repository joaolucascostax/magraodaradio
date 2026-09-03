# Avalia Aí

PROMPT PARA LOVABLE — Reclame Aqui do Magrão

Colar tudo abaixo no Lovable:

Crie uma plataforma web completa chamada "Reclame Aqui do Magrão" — um portal de participação popular onde cidadãos podem registrar reclamações sobre problemas da cidade e do estado, interagir com outros cidadãos e ter suas demandas ouvidas pelo pré-candidato a deputado estadual Éder Magrão.

🎨 IDENTIDADE VISUAL

Nome: Reclame Aqui do Magrão

Paleta de cores principal: Azul institucional (#1E3A5F azul escuro, #2E6BAD azul médio, #4A90D9 azul claro) + Branco (#FFFFFF) + Cinza claro (#F5F7FA para backgrounds)

Cor de destaque/ação: Amarelo dourado (#F5A623) para botões de CTA e destaques

Tom visual: Profissional mas acessível — não é um site de governo burocrático, é uma ferramenta moderna do povo

Tipografia: Inter ou similar (clean, moderna, boa legibilidade)

Cantos arredondados nos cards, sombras sutis, design clean e arejado

Ícones: Lucide icons

100% responsivo — mobile first (a maioria dos acessos virá de celular)

Espaço reservado para logo no header (o logo será adicionado depois)

🗂 ESTRUTURA DE PÁGINAS

1. PÁGINA INICIAL (Home)

A home é o coração do portal. Deve conter:

Header fixo:

Logo à esquerda (placeholder por enquanto)

Nome "Reclame Aqui do Magrão" ao lado do logo

Menu de navegação: Início, Reclamações, Enquetes, Sobre, Ranking

Botão "Entrar" / "Cadastrar" à direita (se não logado)

Avatar e nome do usuário (se logado) com dropdown: Meu Perfil, Minhas Reclamações, Sair

Botão destaque "Nova Reclamação" (sempre visível, azul com ícone de +)

Seção Termômetro da Cidade (topo da home):

Painel visual com 4 cards de estatísticas:

Total de reclamações registradas

Reclamações respondidas

Compromissos assumidos pelo Magrão

Cidadãos participando

Design: cards com ícones, números grandes, animação de contagem ao carregar

Seção Enquete Ativa (se houver):

Se existir uma enquete ativa criada pelo admin, exibir em destaque logo abaixo do termômetro

Card grande com a pergunta, opções de voto, barra de progresso com porcentagens

Botão de votar (qualquer visitante pode votar, mas cadastrados têm voto com mais peso visual — selo "voto verificado")

Feed Principal de Reclamações:

Tabs de ordenação: "Mais Relevantes da Semana" (padrão) | "Mais Recentes" | "Mais Apoiadas de Todos os Tempos"

Filtros: por Categoria (dropdown) | por Cidade (dropdown/busca) | por Status (Todos, Pendente, Em Análise, Respondido, Resolvido)

Cada card de reclamação mostra:

Foto de perfil do autor (ou avatar genérico se anônimo/sem cadastro)

Nome do autor (ou "Cidadão Anônimo")

Selo se for usuário cadastrado verificado

Data de publicação (formato relativo: "há 2 horas", "há 3 dias")

Categoria (tag colorida: Saúde, Segurança, Infraestrutura, Educação, Transporte, Saneamento, Iluminação, Meio Ambiente, Outros)

Cidade (obrigatória) e Bairro (opcional)

Título da reclamação (em negrito)

Texto da reclamação (preview de 3 linhas, com "ver mais")

Foto anexada (se houver) — thumbnail clicável que abre modal

Ícone de áudio se tiver gravação de voz (com mini player inline)

Badge de status: Pendente (cinza), Em Análise (amarelo), Respondido (azul), Resolvido (verde)

Se tiver resposta oficial do Magrão: box destacado com selo "Resposta Oficial do Magrão" em azul

Se tiver "Antes e Depois": badge especial mostrando as duas fotos lado a lado

Barra de ações:

Botão "Eu também tenho esse problema!" (ícone de mão levantada + contador) — funciona como o sistema de apoio/curtida

Botão "Comentar" (ícone + contador)

Botão "Compartilhar no WhatsApp" (ícone do WhatsApp, verde) — gera link com preview

Botão "Compartilhar" genérico (copiar link)

Algoritmo de relevância semanal: Posts com mais "eu também" nos últimos 7 dias sobem para o topo na aba "Mais Relevantes da Semana". O ranking reseta toda segunda-feira.

Sidebar direita (desktop) / Seção inferior (mobile):

"Reclamações em Destaque" — top 3 da semana em mini cards

"Cidadãos Mais Ativos" — top 5 com avatar, nome e número de participações

"Categorias Populares" — tags clicáveis com contador

Link "Como funciona?" — mini FAQ

Footer:

Links: Termos de Uso, Política de Privacidade, Sobre o Magrão, Contato

Redes sociais do Magrão (Instagram, Facebook, WhatsApp, YouTube) — ícones

Texto: "Uma iniciativa do pré-candidato a deputado estadual Éder Magrão — Dando voz ao povo de Goiás"

2. PÁGINA DE NOVA RECLAMAÇÃO

Modal ou página dedicada com formulário:

Título da reclamação (input text, obrigatório, max 120 caracteres)

Descrição detalhada (textarea, obrigatório, max 2000 caracteres, com contador)

Categoria (select obrigatório): Saúde, Segurança, Infraestrutura, Educação, Transporte, Saneamento, Iluminação, Meio Ambiente, Outros

Cidade (input com autocomplete das cidades de Goiás — obrigatório)

Bairro (input text, opcional)

Anexar foto (upload de imagem, opcional, max 5MB, preview antes de enviar)

Gravar áudio (botão que ativa gravação pelo microfone do celular, max 60 segundos, com visualização de onda sonora durante gravação e player de preview antes de enviar)

Identificação:

Se logado: nome e foto do perfil já preenchidos

Se não logado: campo "Seu nome" (opcional — se deixar vazio, aparece como "Cidadão Anônimo") + campo "Email para notificações" (opcional)

Botão "Publicar Reclamação" (azul, destaque)

Texto informativo: "Sua reclamação será analisada pela equipe do Magrão. Respeite as regras de convivência."

3. PÁGINA DE DETALHE DA RECLAMAÇÃO

Página individual de cada reclamação com:

Conteúdo completo (título, texto, foto expandida, player de áudio)

Informações: autor, data, categoria, localização, status

Se houver "Antes e Depois": seção com slider comparativo das duas fotos

Resposta oficial do Magrão (se houver): box azul com selo, data, texto da resposta

Se houver "Promessa Pública": badge especial com compromisso e prazo

Linha do tempo de status: Recebida → Em Análise → Respondida → Resolvida (visual com ícones e datas)

Seção de comentários (thread simples):

Qualquer pessoa pode comentar

Comentários do admin/Magrão têm selo especial azul

Ordenação por mais recentes

Botão grande "Eu também tenho esse problema!" com contador

Botões de compartilhamento: WhatsApp (destaque), Facebook, Twitter, Copiar Link

Botão "Denunciar" (flag) para reportar conteúdo impróprio

4. PÁGINA DE ENQUETES

Lista de enquetes criadas pelo admin:

Enquete ativa em destaque no topo (card grande)

Enquetes encerradas abaixo com resultados visíveis

Cada enquete mostra:

Pergunta

Opções com barra de progresso e porcentagem

Total de votos

Status: Ativa / Encerrada

Data de criação e encerramento

Selo "Consulta Popular" para dar peso institucional

Texto: "Ajude o Magrão a definir as prioridades! Sua opinião importa."

5. PÁGINA SOBRE

Foto do Magrão (placeholder)

Bio/história resumida

Texto explicando o propósito do portal

Seção "Como funciona" com 4 passos ilustrados:

"Faça sua reclamação" (ícone megafone)

"A comunidade apoia" (ícone mãos unidas)

"O Magrão ouve e responde" (ícone chat)

"Juntos resolvemos" (ícone check/estrela)

CTA: "Faça sua primeira reclamação agora"

6. PÁGINA DE RANKING

Ranking semanal de "Cidadãos Mais Ativos"

Posição, avatar, nome, número de reclamações, número de apoios dados, selo conquistado

Selos/badges:

"Cidadão Ativo" (5+ reclamações)

"Voz do Bairro" (10+ reclamações no mesmo bairro)

"Fiscal da Cidade" (20+ reclamações)

"Mobilizador" (reclamação com 50+ apoios)

Design de ranking estilo leaderboard, gamificado mas sem ser infantil

7. PÁGINA MEU PERFIL (logado)

Avatar (upload), nome, email, cidade, bairro

Minhas reclamações (lista com status de cada uma)

Minhas reclamações apoiadas

Meus selos/badges conquistados

Notificações: reclamações do seu bairro que mudaram de status

Botão editar perfil

👨‍💼 PAINEL ADMIN (Magrão e equipe)

Acesso restrito via rota /admin com login diferenciado.

Dashboard:

Estatísticas gerais: total reclamações, por status, por categoria, por cidade

Gráficos: reclamações por semana (linha), categorias mais reclamadas (pizza/barra), cidades com mais reclamações (mapa ou ranking)

Reclamações mais apoiadas da semana (ação rápida pra responder)

Gerenciar Reclamações:

Lista de todas com filtros e busca

Mudar status: Pendente → Em Análise → Respondido → Resolvido

Responder oficialmente (texto com selo)

Adicionar foto "Depois" (para o antes/depois)

Criar "Promessa Pública" a partir de uma reclamação (texto do compromisso + prazo)

Excluir/ocultar reclamações impróprias

Gerenciar Enquetes:

Criar nova enquete: pergunta + 2 a 5 opções + data de encerramento

Encerrar enquete manualmente

Ver resultados detalhados

Gerenciar Usuários:

Lista de usuários cadastrados

Ver perfil, reclamações, atividade

Banir usuários se necessário

Moderação:

Fila de denúncias recebidas

Aprovar/rejeitar/ocultar conteúdo denunciado

🗄 BACKEND — SUPABASE

Tabelas do banco de dados:

profiles (extends auth.users)

id (uuid, FK auth.users)

name (text)

avatar_url (text)

city (text)

neighborhood (text)

role (enum: citizen, admin) — default: citizen

badges (text[]) — array de selos conquistados

created_at, updated_at

complaints (reclamações)

id (uuid, PK)

author_id (uuid, FK profiles, nullable — null = anônimo)

author_name_anonymous (text, nullable — nome dado por usuário não cadastrado)

title (text, not null)

description (text, not null)

category (enum: saude, seguranca, infraestrutura, educacao, transporte, saneamento, iluminacao, meio_ambiente, outros)

city (text, not null)

neighborhood (text, nullable)

photo_url (text, nullable)

audio_url (text, nullable)

after_photo_url (text, nullable) — foto do "depois"

status (enum: pendente, em_analise, respondido, resolvido) — default: pendente

official_response (text, nullable)

official_response_date (timestamptz, nullable)

promise_text (text, nullable) — texto da promessa pública

promise_deadline (date, nullable)

support_count (integer, default 0) — contador de "eu também"

weekly_support_count (integer, default 0) — contador semanal (reseta toda segunda)

created_at, updated_at

supports (apoios / "eu também")

id (uuid, PK)

complaint_id (uuid, FK complaints)

user_id (uuid, FK profiles, nullable)

session_id (text, nullable — para usuários não cadastrados, evitar apoio duplicado)

created_at

comments

id (uuid, PK)

complaint_id (uuid, FK complaints)

author_id (uuid, FK profiles, nullable)

author_name_anonymous (text, nullable)

content (text, not null)

is_official (boolean, default false) — comentário do admin/Magrão

created_at

polls (enquetes)

id (uuid, PK)

question (text, not null)

options (jsonb) — array de {id, text, votes: 0}

is_active (boolean, default true)

created_by (uuid, FK profiles)

ends_at (timestamptz, nullable)

created_at

poll_votes

id (uuid, PK)

poll_id (uuid, FK polls)

option_id (text, not null)

user_id (uuid, FK profiles, nullable)

session_id (text, nullable)

is_verified (boolean) — true se o voto veio de usuário cadastrado

created_at

reports (denúncias)

id (uuid, PK)

complaint_id (uuid, FK complaints, nullable)

comment_id (uuid, FK comments, nullable)

reporter_id (uuid, FK profiles, nullable)

reason (text)

status (enum: pending, reviewed, dismissed)

created_at

Row Level Security (RLS):

Reclamações: qualquer um pode ler, qualquer um pode criar, apenas autor ou admin pode editar

Supports: qualquer um pode criar (1 por complaint por user/session), apenas ler próprios

Comments: qualquer um pode ler, qualquer um pode criar

Polls: qualquer um pode ler, apenas admin pode criar/editar

Poll votes: qualquer um pode criar (1 por poll por user/session)

Profiles: qualquer um pode ler nome/avatar/city, apenas próprio pode editar, admin pode ler tudo

Reports: qualquer um pode criar, apenas admin pode ler/gerenciar

Storage Buckets:

complaint-photos (público, max 5MB por arquivo)

complaint-audio (público, max 10MB por arquivo)

after-photos (público, max 5MB)

avatars (público, max 2MB)

Edge Functions (se necessário):

reset-weekly-supports: roda toda segunda-feira às 00:00, zera weekly_support_count

update-badges: roda periodicamente, verifica critérios e atribui badges

⚙️ FUNCIONALIDADES TÉCNICAS

Compartilhamento WhatsApp:

Cada reclamação gera um link com Open Graph meta tags (título, descrição, imagem) para preview bonito no WhatsApp

Botão verde do WhatsApp que abre https://wa.me/?text= com texto pré-formatado:

"🔴 [TÍTULO DA RECLAMAÇÃO] — [CIDADE/BAIRRO] — Já tem X pessoas com o mesmo problema! Apoie também: [LINK]"

Gravação de áudio:

Usar Web Audio API / MediaRecorder

Interface: botão de gravar, visualização de onda, timer de contagem (max 60s), preview com player antes de enviar

Salvar como WebM ou MP3 no Supabase Storage

Sistema de "Eu Também":

Ao clicar, incrementa support_count e weekly_support_count

Animação satisfatória no botão (tipo like do Twitter)

Usuários não cadastrados: usar fingerprint/session para evitar duplicatas (localStorage sessionId)

Cadastrados: 1 apoio por reclamação por conta

Antes e Depois:

Na página de detalhe, quando tiver after_photo_url, mostrar slider comparativo (arrastar para comparar antes/depois)

Admin faz upload da foto "depois" pelo painel

Notificações (in-app por enquanto):

Dropdown de sino no header para usuários logados

"Sua reclamação mudou de status para: Em Análise"

"O Magrão respondeu sua reclamação!"

"Uma reclamação no seu bairro foi resolvida!"

SEO e Meta Tags:

Cada reclamação gera meta tags Open Graph dinâmicas para compartilhamento rico em redes sociais

Title format: "[Título] — Reclame Aqui do Magrão"

Sitemap dinâmico

📱 COMPORTAMENTO MOBILE

Header compacto com menu hambúrguer

Botão flutuante "Nova Reclamação" (FAB) no canto inferior direito

Feed em cards empilhados (estilo feed de rede social)

Botão WhatsApp sempre visível e fácil de tocar

Gravação de áudio com interface touch-friendly

Filtros em modal bottom sheet

Sidebar vira seções empilhadas abaixo do feed

🛡 REGRAS DE NEGÓCIO

Qualquer pessoa pode ver o feed, reclamações e enquetes sem cadastro

Qualquer pessoa pode criar reclamação e comentar (com ou sem cadastro)

Usuários cadastrados ganham: selo "Verificado", perfil com histórico, badges, notificações, nome fixo nas postagens

Usuários não cadastrados aparecem como "Cidadão Anônimo" ou com o nome que digitaram (sem garantia de unicidade)

Apoio ("Eu também"): 1 por reclamação por pessoa (por conta ou por sessão)

Enquetes: apenas admin cria. Qualquer um vota. Voto de cadastrado tem selo "Voto Verificado"

Apenas admin pode: mudar status de reclamações, dar resposta oficial, criar enquetes, moderar conteúdo, ver dashboard analítico

Ranking semanal reseta toda segunda-feira

Reclamações com conteúdo ofensivo, ataques pessoais ou propaganda partidária contra outros candidatos podem ser removidas pelo admin

Cidade é obrigatória em toda reclamação; bairro é opcional

🚀 PRIORIDADE DE IMPLEMENTAÇÃO

Gere TUDO na primeira versão, mas garanta que estas funcionalidades estejam 100% funcionais:

Feed de reclamações com sistema de apoio ("eu também") e ordenação por relevância semanal

Criação de reclamações (com foto e áudio)

Sistema de enquetes (admin cria, público vota)

Compartilhamento WhatsApp

Cadastro/login de usuários + modo anônimo

Painel admin completo

Sistema de status e resposta oficial

Antes e Depois com slider

Ranking e badges

Promessa pública

Use React + TypeScript + Tailwind CSS + shadcn/ui + Supabase. Gere o projeto completo e funcional.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://magraodaradio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f5cf0b8c-aa81-4a92-894c-df309b9b798d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
