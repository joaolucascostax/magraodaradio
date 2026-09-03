# Criar posts do Diário pelo painel admin

Hoje o painel só modera o que os apoiadores enviam. Vamos dar ao Magrão (e à equipe) um editor próprio para publicar as atualizações do Diário direto do painel — já publicadas, marcadas como oficiais e com aviso opcional no WhatsApp. A criação de demandas continua exatamente como está para os apoiadores.

## Nova página: Painel → Diário

Item novo na barra lateral do painel: **Diário do Magrão**, em `/admin/diario`.

A página tem duas partes:

1. **Editor de publicação**
   - Tipo: Notícia/atualização, Projeto/conquista ou Vídeo.
   - Título (até 120 caracteres) e texto.
   - Cidade (opcional): seletor de município de Goiás — sem cidade o post vale para o estado inteiro.
   - Fotos: mesmo upload já usado no formulário público (até 2MB por imagem, primeira imagem vira a capa).
   - Vídeo: campo de link do YouTube ou Instagram, exibido como player/preview no card do post.
   - Caixa "Avisar nos grupos de WhatsApp" (marcada por padrão).
   - Botão **Publicar agora** — o post entra publicado na hora, como conteúdo oficial do Diário.

2. **Lista das publicações do Diário**
   - Últimos posts oficiais com capa, título, cidade e data.
   - Ações: editar título/texto, despublicar (volta a rascunho/oculto) e excluir.

## Como o post aparece no site

- Marcado como oficial, então cai automaticamente no filtro **Diário** do feed e no topo de `/diario`.
- Mostra o selo "Magrão · Verificado" que já existe.
- Se tiver vídeo, o card mostra o player incorporado; a capa continua valendo para posts com foto.

## O que não muda

- `/criar` segue igual para os apoiadores (notícia, projeto, discussão e demanda, tudo entrando como pendente).
- Fila de moderação, comentários, enquetes, selos e grupos continuam iguais.
- Paleta, tipografia e layout do site permanecem os mesmos.

## Detalhes técnicos

- **Banco**: adicionar `video_url text` em `public.posts` (nulável). Nenhuma outra mudança de schema — as políticas existentes já permitem que admin/editor insiram posts com `is_official = true` e `status = 'aprovado'` via a policy `Admins and editors manage all posts`.
- **Rota**: `/admin/diario` dentro de `AdminLayout`, com item novo em `AdminSidebar`.
- **Insert**: `posts` com `is_official: true`, `status: 'aprovado'`, `published_at: now()`, `autor_display_name: 'Magrão'`, `autor_id` = usuário admin, `tipo` conforme a escolha (vídeo usa `noticia` + `video_url`).
- **Upload**: reaproveitar a lógica de `post-media` de `NovoPost.tsx`, extraída para um helper compartilhado (`src/lib/uploadPostMedia.ts`).
- **WhatsApp**: após o insert, `supabase.functions.invoke('whatsapp-broadcast', { body: { kind: 'post', id } })` quando a caixa estiver marcada.
- **Vídeo no card**: helper que converte link do YouTube/Instagram em URL de embed; renderizado em `PostCard` e no detalhe do post.
- **Validação**: Zod (título 3–120, texto mínimo 10, URL de vídeo válida quando o tipo é vídeo).
