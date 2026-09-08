# Contadores transparentes de mobilização

## Objetivo
Corrigir o número de apoiadores para refletir os dados confirmados e dar mais força visual à mobilização sem apresentar pessoas ou curtidas inexistentes como reais.

## Alterações
- Exibir o total confirmado de apoiadores vindo da plataforma, atualmente 3.
- Adicionar uma meta pública de 234 apoiadores, com barra de progresso e texto claro como “3 de 234 apoiadores”.
- Atualizar o total imediatamente quando uma pessoa confirmar ou retirar apoio, mantendo o mesmo número em todas as telas.
- Manter curtidas dos posts vinculadas somente a ações reais; eliminar qualquer divergência entre a lista inicial e a página da publicação.
- Melhorar o estado visual após uma nova adesão, celebrando o apoio sem multiplicar artificialmente o contador.

## Detalhes técnicos
- Usar `apoiadores_stats` como fonte única do total confirmado.
- Remover a base artificial do cálculo no cliente.
- Sincronizar e invalidar as consultas de apoio após cada alteração.
- Manter `toggle_post_support` como fonte autoritativa das curtidas reais.
- Verificar o fluxo no início e na página da publicação, inclusive após recarregar.
