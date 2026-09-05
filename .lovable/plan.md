# Votação, login e perfil: versão profissional

Três frentes: corrigir a contagem de votos (bug confirmado), deixar o ato de votar fluido, e transformar o perfil num perfil de verdade com edição.

## 1. O voto contando dobrado (bug confirmado)

Verifiquei no banco: existem **dois gatilhos duplicados** somando o mesmo voto. Hoje a enquete "Wilder Morais" mostra **2 votos**, mas só existe **1 voto real** registrado.

- Remover o gatilho duplicado, deixando apenas um.
- Recalcular os contadores de todas as opções a partir dos votos reais, para os números já exibidos ficarem corretos.
- Garantir na base que a mesma pessoa não pode votar duas vezes na mesma enquete (hoje isso é checado só antes de gravar, o que abre brecha em cliques rápidos ou duas abas).

## 2. Votar sem engasgo

- **Botão sobrepondo o menu de baixo**: o botão amarelo "Confirmar meu voto" vai passar a respeitar a barra Início/Diário/Demandas/Perfil, com o espaçamento correto no celular.
- **Resposta imediata ao toque**: ao escolher uma opção, o preenchimento acontece na hora (sem esperar o servidor); a barra e a porcentagem já se movem, e se algo falhar volta ao estado anterior com aviso claro.
- **Um clique = um voto**: o botão trava no primeiro toque e mostra "Registrando..." até terminar, sem chance de duplo envio.
- **Confirmação boa**: mensagem de voto registrado + estado "Você já votou" visível, sem a tela pular.
- Remover a tela de enquete antiga que ainda existe solta no código com uma segunda cópia da lógica de voto, para haver só um caminho de votação.

## 3. Login mais polido (mesmo fluxo)

Mantém WhatsApp + código, só melhora o acabamento:

- Mensagens de erro específicas em vez de textos genéricos ("número inválido", "código errado", "código expirado, pedir outro").
- Estados de carregamento em todos os botões e bloqueio de envio repetido.
- Se a pessoa estava escolhendo uma opção de enquete e o login abre, a escolha é preservada e o voto segue depois de entrar.
- Ajustes visuais: espaçamento, tamanho de toque e o texto vazio que sobrou embaixo do CPF.

## 4. Perfil de verdade, com edição

Hoje o perfil mostra "Cidadão" fixo e um código interno da conta. Passa a mostrar:

- **Foto**, **nome do cadastro**, cidade e selo de apoiador.
- WhatsApp mascarado (visível só para a própria pessoa), sem nunca mostrar código interno.
- Números: demandas criadas, apoios dados, enquetes em que votou.
- **Editar perfil**: trocar foto, nome e cidade, com salvamento e aviso de sucesso.
- **Sair da conta**.
- Lista das próprias demandas, como já existe, com estados vazios convidando à ação.

## Detalhes técnicos

- Migração: `DROP TRIGGER trg_votes_count ON public.poll_votes`; `UPDATE poll_options SET vote_count = (SELECT count(*) FROM poll_votes ...)`; índice único `(poll_id, user_id, option_id)` em `poll_votes` (compatível com múltipla escolha) e ajuste no tratamento de erro `23505` como "já votou".
- `EnqueteDetalhe.tsx`: barra de ação fixa com `bottom` respeitando a `BottomNav` (`z` abaixo de 40 / offset `pb`), `useMutation` com `onMutate` otimista sobre `['poll', id]` e rollback em `onError`.
- Nova storage bucket pública `avatars` (se ainda não existir) para a foto de perfil; `profiles.avatar_url`, `display_name`, `default_city` atualizados via update do próprio registro (RLS já permite).
- `Perfil.tsx` passa a ler `get_my_profile()`; excluir `src/components/home/ActivePoll.tsx` (não referenciado por nenhuma página).
- Sem mudança de paleta, tipografia ou estrutura do feed.
