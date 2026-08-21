
# Plano: Engajamento + Distribuição via WhatsApp

Quatro frentes: (1) disparo automático em grupos do WhatsApp via Evolution, (2) bairro nas publicações, (3) selos de status controlados pelo admin, (4) melhorias de marketing (compartilhar, enquete fixa, ranking de bairros, página `/como-funciona`).

---

## 1. Disparo automático no WhatsApp

**Quando dispara:** post aprovado (mudança de status `pendente → aprovado`) **e** nova enquete criada com `is_active=true`. Também redispara quando admin ativa/muda um selo.

**Alvo:** vários grupos gerenciados no admin (nova tela `/admin/grupos`).

**Formato da mensagem (médio, sem resumo):**
```
📢 [Categoria] Título do post
👤 Autor · 📍 Bairro (se houver)
👉 https://rioverdenoar.lovable.app/post/<id>
```
Para enquete: `🗳️ Nova enquete: Pergunta ... 👉 link`.

**Arquitetura**
- Nova tabela `whatsapp_groups` (jid, nome, ativo).
- Nova tabela `whatsapp_dispatch_log` (post_id/poll_id, group_jid, status, tentativas, erro, criado_em) — usada pra retry e histórico.
- Edge function `whatsapp-broadcast` (nova): recebe `{ kind: 'post'|'poll'|'selo', id }`, monta mensagem, itera grupos ativos, envia via Evolution, grava log. Retry automático até 3x com backoff quando Evolution retorna erro.
- Trigger no banco: `AFTER UPDATE ON posts` (quando `status` vira `aprovado` ou `selo` muda) e `AFTER INSERT ON polls` (quando `is_active=true`) → chama a function via `pg_net.http_post` com o service key.
- Reutiliza `_shared/evolution.ts` (já existe); adiciona helper `sendGroupText(jid, text)`.

**Tela `/admin/grupos`**
- Lista grupos, botão "Adicionar" (JID + nome), toggle ativo, botão testar (envia "ping" pro grupo). Rota protegida por role admin.

---

## 2. Campo Bairro (sempre opcional)

- Nova coluna `posts.bairro TEXT` (nullable).
- Nova tabela `bairros` (id, nome, ordem) pré-populada com principais bairros de Rio Verde. Admin pode adicionar mais depois.
- Em `NovoPost.tsx`: combobox com lista fixa + opção "Outro bairro" que abre input livre. Não bloqueia envio.
- Exibido no `PostCard` como pill discreta ao lado da cidade quando presente.

---

## 3. Selos admin

**Enum novo** `post_selo`: `resolvido_magrao` | `em_andamento` | `encaminhado_camara` | `null`.

- Coluna `posts.selo post_selo`, `posts.selo_em timestamptz`, `posts.selo_por uuid` (admin que setou).
- Só admin/editor pode alterar (RLS + policy).
- UI no `AdminModeracao.tsx`: dropdown "Marcar selo" em cada post aprovado, com opção "Remover selo".
- Alterar selo dispara `whatsapp-broadcast` com kind `selo` (mensagem tipo "✅ Atualização: 'Título' — Resolvido pelo Magrão").

**Visual (Faixa no topo do card + filtro no feed)**
- `PostCard`: quando `selo` presente, renderiza faixa colorida acima do card (verde=resolvido, amarelo=em andamento, azul=encaminhado) com ícone e texto.
- Feed (`Reclamacoes.tsx` e/ou home): chips de filtro "Todos / Resolvidas / Em andamento / Encaminhadas". Query filtra por `selo`.

---

## 4. Marketing / engajamento (itens 1, 2, 3, 5 da estratégia)

**4.1 Compartilhar no WhatsApp (item 1)**
- Botão "Compartilhar no zap" em cada `PostCard` → `https://wa.me/?text=...` com título + link do post.
- OG image dinâmica: como não temos SSR, cria um template estático bonito por categoria em `index.html` como fallback + preenche `<title>` e `og:` na página de detalhe do post via `react-helmet-async`. (Melhoria opcional futura: edge function que gera og-image on-demand.)

**4.2 Selo "Resolvida" + filtro (item 2)**
- Já coberto na seção 3.

**4.3 Ranking de bairros (item 3)**
- Nova query no `Sidebar` (ou card na home): top 5 bairros com mais publicações nos últimos 30 dias. Alimentado pelo campo `posts.bairro`.

**4.4 Página `/como-funciona` (item 5)**
- Rota nova + link no Footer/Header. Explica: cadastro por WhatsApp, anonimato (o que é privado e o que aparece público), moderação, o que pode/não pode postar, selos, contato do Magrão. Reforça confiança.

---

## Detalhes técnicos

**Migrações (uma migration só):**
- `CREATE TYPE post_selo AS ENUM (...)`.
- `ALTER TABLE posts ADD COLUMN bairro TEXT, selo post_selo, selo_em timestamptz, selo_por uuid`.
- `CREATE TABLE bairros (...)` + GRANT + RLS (select público, insert/update admin) + seed dos bairros.
- `CREATE TABLE whatsapp_groups (...)` + GRANT + RLS (só admin).
- `CREATE TABLE whatsapp_dispatch_log (...)` + GRANT + RLS (só admin/service_role).
- Trigger `posts_notify_broadcast` (após approve ou mudança de selo) e `polls_notify_broadcast` (insert ativo) usando `pg_net.http_post` para chamar a edge function. Requer extensão `pg_net`.
- View `posts_public` precisa expor `bairro` e `selo`.

**Edge functions:**
- `whatsapp-broadcast` (nova): valida payload, busca grupos ativos, monta texto, envia via Evolution, grava log, retry.
- Reaproveita `_shared/evolution.ts`. Adiciona função `sendGroupText`.

**Secrets:** todos os necessários já existem (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `SUPABASE_SERVICE_ROLE_KEY`). Nenhum novo.

**Frontend a mudar:**
- `NovoPost.tsx` (bairro), `PostCard.tsx` (faixa selo, pill bairro, botão compartilhar), `Reclamacoes.tsx`/`Index.tsx` (filtro selo), `Sidebar.tsx` (ranking bairros), `AdminModeracao.tsx` (dropdown selo), novo `AdminGrupos.tsx`, nova `ComoFunciona.tsx`, `App.tsx` (rotas), `Footer.tsx` (link).
- Hook `usePostsFeed.ts`: aceitar filtro `selo`.

**Fora de escopo (pra próxima rodada):** OG image dinâmica via edge function, notificar autor quando post ganha selo, agendamento de disparos.

---

## Ordem de implementação

1. Migration (tipos, colunas, tabelas, seed, triggers, view).
2. Edge function `whatsapp-broadcast` + helper Evolution.
3. Admin: `/admin/grupos` + dropdown de selo em `AdminModeracao`.
4. Frontend público: bairro no NovoPost, faixa de selo + botão compartilhar no PostCard, filtro selo, ranking bairros no Sidebar.
5. Página `/como-funciona` + link no Footer.
