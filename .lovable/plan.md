# Corrigir o erro no cadastro e mostrar mensagens claras

## O que está acontecendo

O registro de erro do servidor mostra o motivo real da falha: o **CPF digitado já está cadastrado** em outro número de WhatsApp (o banco recusa CPF repetido). Ou seja, não é uma falha aleatória — é uma regra de "1 pessoa = 1 cadastro" sendo aplicada.

O problema é que essa explicação nunca chega na tela. O aviso amigável ("CPF já cadastrado") é enviado com um código de erro técnico, e o app descarta a mensagem e mostra apenas "Edge function returned 400: Error". Foi por isso que você tentou duas vezes sem entender o motivo.

Um segundo efeito: na primeira tentativa a conta de acesso chega a ser criada antes do cadastro falhar, deixando um registro pela metade.

## O que vamos fazer

1. **Fazer as mensagens chegarem na tela.** Toda resposta de erro do cadastro passa a ser entregue de um jeito que o app consiga ler, e a tela de login também passa a ler o texto do erro quando ele vier em formato técnico. Resultado: a pessoa lê o motivo, não um código.

2. **Checar o CPF antes de criar qualquer coisa.** Se o CPF já pertencer a outro número, avisamos na hora — sem criar conta pela metade.

3. **Textos melhores, em português claro:**
   - CPF já usado: "Esse CPF já tem cadastro em outro número de WhatsApp. Entre com aquele número ou fale com a gente."
   - Código errado: "Código incorreto. Confira os 4 dígitos da mensagem." (mostrando quantas tentativas restam)
   - Código vencido / não encontrado: "Esse código venceu. Toque em 'Reenviar código'."
   - Muitas tentativas: "Muitas tentativas. Peça um novo código."
   - Falhas nossas: "Tivemos um problema aqui do nosso lado. Tente de novo em instantes."
   - O erro volta destacado no próprio formulário (não só como aviso que desaparece), e o campo com problema fica marcado.

4. **Limpeza visual:** remover a linha em branco solta embaixo do campo de CPF e acrescentar a explicação "O CPF garante um cadastro por pessoa e não aparece no site."

## Detalhes técnicos

- `supabase/functions/whatsapp-verify-otp/index.ts`: respostas de erro passam a usar status 200 com `{ error, code }` (o `functions.invoke` engole o corpo em respostas não-2xx); consulta prévia em `profiles` por `cpf` antes de `auth.admin.createUser`; se o profile falhar depois da criação do usuário, remover o usuário órfão; incluir `attempts_left` na resposta de código incorreto.
- `src/components/auth/AuthModal.tsx`: helper para extrair mensagem de `FunctionsHttpError` via `error.context.json()`; estado `formError` renderizado acima do botão em cada etapa; mapeamento de `code` para a cópia acima; remover o `<p>{"\n"}</p>`.
- `supabase/functions/whatsapp-send-otp/index.ts`: mesmo tratamento de mensagens (limite de envio, número sem WhatsApp) com `code` e status 200.
- Sem mudanças de banco de dados.
