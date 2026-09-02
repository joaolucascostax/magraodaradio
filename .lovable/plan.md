# Magrão no Ar — rebrand estadual + rede social de apoiadores

Transformar a plataforma municipal ("Rio Verde no Ar / vereador Magrão da Rádio") em **Magrão no Ar**: uma rede social de apoiadores para todo o estado de Goiás, usável na campanha a deputado estadual e definitiva durante o mandato.

## Posicionamento

- Nome: **Magrão no Ar** · assinatura: "A rede do povo de Goiás com o Magrão".
- Escopo: Goiás inteiro. Cada pessoa escolhe sua cidade; feed e demandas podem ser filtrados por município e região.
- Papel do Magrão: hoje candidato a deputado estadual, amanhã deputado. A copy nunca fixa "vereador" nem "Rio Verde" como limite — fala de mandato, estado e cidades.
- Tom: cara de rede social. Feed contínuo, perfis, avatares, reações, contadores, "seguir", stories-like nos destaques. Nada de tabloide/brutalismo; segue a paleta atual (creme, amarelo Brasil, azul, marinho), tipografia Plus Jakarta Sans + Inter.

## Os três pilares

1. **Sou apoiador** — botão principal da plataforma. Pessoa se cadastra (WhatsApp OTP já existente), escolhe cidade, entra no contador público de apoiadores ("X apoiadores em Y cidades de Goiás"), ganha selo de apoiador no perfil e link para convidar amigos.
2. **Diário do Magrão** — feed oficial com selo verificado: agenda, visitas às cidades, vídeos, projetos, prestação de contas. Vira a aba inicial do feed ("Magrão" ao lado de "Comunidade").
3. **Demandas da minha cidade** — as denúncias atuais reposicionadas como demandas ao mandato: cidadão publica, vizinhos apoiam, o gabinete responde com status (Recebida → Em andamento → Encaminhada → Resolvida). Ranking de demandas por cidade.

Enquetes continuam existindo (participação), mas fora do destaque principal.

## Estrutura de navegação

```text
Início (feed)   Diário do Magrão   Demandas   Apoiadores   Perfil
```

- Header: logo "Magrão no Ar" + busca + botão "Sou apoiador" (ou avatar quando logado).
- Barra inferior fixa no mobile (5 ícones, estilo app de rede social) substituindo o FAB solto.
- Home = feed unificado com abas: **Para você · Diário do Magrão · Minha cidade · Enquetes**.

## Telas que mudam

- **Home**: sai o hero "A voz de Rio Verde" (brasão + Kombi) e entra topo de rede social: card de identidade do Magrão, contador de apoiadores por Goiás, seletor de cidade, composer "O que sua cidade precisa?" e o feed.
- **Perfil do Magrão** (`/magrao`, reaproveitando `Sobre`): bio de comunicador e candidato a deputado estadual, base em Rio Verde, atuação no estado, números do mandato, botão "Sou apoiador".
- **Apoiadores** (`/apoiadores`): mapa/lista de Goiás com contagem por cidade, últimos apoiadores, convite.
- **Demandas** (`/demandas`, com redirecionamento das rotas `/reclamacoes` e `/nova-reclamacao`): filtro por cidade/categoria/status.
- **Como funciona**: reescrito nos 3 pilares, sem menções a "denúncia anônima contra a prefeitura" como eixo.
- **Rodapé, textos de compartilhamento, e-mails/WhatsApp, metadados do `index.html`**: nome, descrição, título e OG atualizados.
- **Componentes de marca**: `Logo`, `VereadorBadge` → selo "Magrão · Verificado", `AdminBadge` → "Equipe Magrão", `VereadorCard` → card de perfil oficial.

## Cidade em todo o produto

Hoje a criação de post fixa `cidade = "Rio Verde"`. Passa a usar o seletor com as cidades de Goiás (`src/data/goiasCities.ts`), guardando a cidade escolhida no perfil como padrão e permitindo filtrar o feed por cidade/região.

## Detalhes técnicos

- Trabalho majoritariamente de copy, layout e navegação em React/Tailwind; nenhuma tabela existente é destruída.
- Backend (Lovable Cloud) precisa de dois ajustes pequenos: coluna/uso de `cidade` no perfil como padrão do usuário e uma tabela `apoiadores` (user_id, cidade, criado_em) com RLS + GRANTs para o contador público e o selo de apoiador. Contagem pública exposta por view agregada, sem revelar telefone.
- `posts` já possui `cidade`, `uf` e `prefeitura_id`, então o filtro por município usa o que existe; a dependência de `prefeitura_id` fixo em Rio Verde é removida.
- Rotas antigas (`/reclamacoes`, `/reclamacao/:id`, `/sobre`) mantidas como redirects para não quebrar links compartilhados.
- Admin continua funcionando; apenas rótulos ("Denúncias" → "Demandas") e uma visão de apoiadores por cidade.

## Fora de escopo agora

- Mapa interativo avançado de Goiás (começa como lista/ranking por cidade).
- Grupos de WhatsApp por cidade e gamificação de apoiadores (fase seguinte).
