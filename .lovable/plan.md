# Mostrar o número de apoiadores sempre atualizado

## O que está acontecendo

O número já está certo nos dados: existem 3 apoios reais + base de 231 = **234**. O problema é onde ele aparece.

Hoje o contador só existe dentro do bloco azul de boas-vindas da tela inicial, e esse bloco desaparece por completo assim que a pessoa entra como apoiadora. Quem já apoia (o seu caso) simplesmente não vê número nenhum — por isso parece que não atualizou.

## O que vou fazer

1. Criar uma faixa fina de destaque na tela inicial, visível para todo mundo (apoiador ou não), com o total de apoiadores e o número de cidades: "234 apoiadores em 1 cidade de Goiás".
2. Manter o bloco azul de convite apenas para quem ainda não apoia, como é hoje.
3. Mostrar o mesmo total na página de perfil, ao lado do selo de apoiador, para reforçar o crescimento do time.
4. Fazer o número recarregar sozinho ao voltar para a tela inicial, para nunca ficar com valor antigo em cache.

## Detalhes técnicos

- `useApoioStats` (`src/hooks/useApoio.ts`): manter `BASE_APOIADORES = 231`; ajustar `totalCidades` para nunca exibir 0 quando há apoios, e reduzir o cache (`staleTime`) com `refetchOnMount`.
- Novo componente `src/components/apoio/ApoioCounter.tsx`: faixa compacta com ícone, total formatado em pt-BR e contagem de cidades, usando tokens semânticos existentes (creme/marinho/amarelo), sem cor fixa.
- `src/pages/Index.tsx`: renderizar `ApoioCounter` acima do `Composer`, sempre.
- `src/components/apoio/ApoioHero.tsx`: continua oculto para apoiadores (sem duplicar o número).
- `src/pages/Perfil.tsx`: exibir o total ao lado do selo "Apoiador".
- Nada muda no banco.
