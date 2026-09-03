# Refazer o UX: feed único com apoio em primeiro lugar

O app hoje empilha cartões (identidade + compositor + duas seções vazias) e repete as mesmas ações várias vezes na mesma tela: o cartão do Magrão tem "Demanda" e "Apoiadores", o compositor repete "Demandas / Diário / apoiadores", e ainda existe o FAB "Demanda" sobre a barra inferior que já tem "Demandas". Nada guia o olho e, com o banco vazio, a home fica sem direção.

O redesenho troca isso por **um feed único e contínuo**, com o apoio como ação dominante.

## Estrutura nova da home

```text
┌──────────────────────────────────────┐
│ Header compacto: logo · cidade · ⋯   │  (sem "Postar", sem "Entrar" duplicado)
├──────────────────────────────────────┤
│ FAIXA DE APOIO (sticky-ish, topo)    │  CTA principal: "Sou apoiador"
│ Magrão da Rádio ✓ · Goiás            │  + contador vivo de apoiadores
│ [ ♡ Sou apoiador ]                   │  vira barra de status quando já apoia
├──────────────────────────────────────┤
│ Compositor enxuto                    │  "O que sua cidade precisa?" (1 ação)
├──────────────────────────────────────┤
│ Filtros do feed (chips, roláveis)    │  Tudo · Diário · Demandas · Enquetes
│ + seletor de cidade / Goiás inteiro  │
├──────────────────────────────────────┤
│ FEED ÚNICO (cronológico)             │  Diário + demandas + enquetes juntos
│  · post oficial (selo Verificado)    │
│  · demanda da cidade                 │
│  · enquete inline (votar no card)    │
│  · scroll infinito / "Carregar mais" │
└──────────────────────────────────────┘
```

Diário e Demandas deixam de ser seções separadas na home — passam a ser **filtros do mesmo feed**. As páginas `/diario` e `/demandas` continuam existindo (links compartilhados) e viram o feed já pré-filtrado.

## Hierarquia visual

Três níveis claros, em vez de tudo com o mesmo peso:

1. **Apoio** — único bloco com fundo cheio e cor primária. É o que grita na tela.
2. **Compositor** — campo claro, discreto, uma linha.
3. **Feed** — cards planos, separados por linha fina em vez de caixa dentro de caixa. Menos borda, mais respiro.

Cards do feed ganham: avatar + nome + cidade + tempo na mesma linha, corpo, e uma barra de ações só com o essencial (Apoiar · Comentar · Compartilhar). O selo de tipo do post vira um rótulo pequeno, não um bloco colorido grande.

## Corrigir a navegação

- **Remover o FAB.** A barra inferior já dá acesso a Demandas, e o compositor no topo do feed cobre a criação.
- **Barra inferior enxuta:** Início · Diário · Demandas · Perfil (4 itens, alvo 44px). "Apoio" sai da barra porque o CTA de apoio já domina a home e o perfil mostra o status.
- **Header:** só logo, cidade atual e menu. Ações de conta migram pro menu/perfil, eliminando a duplicação com a barra inferior.

## Estados vazios que dão direção

Com o banco vazio, cada estado vazio passa a oferecer a próxima ação concreta (ex.: "Ainda não tem demanda em Rio Verde. Seja o primeiro a pedir." + botão), em vez de só informar que está vazio. O feed sem conteúdo mostra o bloco de apoio e o compositor de forma proeminente.

## O que não muda

Paleta (creme, amarelo Brasil, azul, marinho), tipografia (Plus Jakarta Sans + Inter), radius e sombras suaves seguem iguais. Nenhuma mudança de banco, tabelas, RLS ou lógica de apoio/moderação — é redesenho de interface e copy.

## Detalhes técnicos

- `src/pages/Index.tsx`: reescrito como feed único; usa `usePostsFeed` sem separar em duas seções, com estado de filtro (`tudo | oficial | demandas | enquetes`) e cidade via `useCidade`.
- Novo `src/components/feed/FeedFilters.tsx` (chips roláveis + `CitySelect`) e `src/components/feed/Composer.tsx` (extraído da home, reutilizado em `/demandas`).
- Novo `src/components/apoio/ApoioHero.tsx` substituindo `MagraoCard` como bloco de topo; reusa `useApoioStats` / `ApoiarButton`.
- `src/components/feed/PostCard.tsx`: layout achatado, ações reduzidas, rótulo de tipo compacto, enquete votável inline.
- `src/pages/Diario.tsx` e `src/pages/Reclamacoes.tsx` (`/demandas`): passam a renderizar o mesmo feed com filtro pré-definido, eliminando duplicação de UI.
- `src/components/layout/FAB.tsx`: removido do `Layout` (arquivo deletado).
- `src/components/layout/BottomNav.tsx`: 4 itens.
- `src/components/layout/Header.tsx`: enxugado (logo + cidade + menu).
- `src/index.css`: sem novos tokens de cor; se precisar, apenas um utilitário de divisória de feed.
