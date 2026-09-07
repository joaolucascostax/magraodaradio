# Carga de 50 publicações do Diário do Magrão

Você enviou um arquivo com 50 publicações prontas (texto, categoria, bairro, selo, vídeo principal e vídeos complementares). O plano é só carregar esse conteúdo no banco — nada de mudança de código ou de layout.

## O que será feito

- Rodar a carga exatamente como você escreveu, sem reescrever textos, datas ou links.
- Todas entram como publicações oficiais do Magrão, já aprovadas, em Rio Verde/GO, com a data que você definiu em cada uma.
- Publicações que já existirem com o mesmo título são ignoradas, então a carga pode ser repetida sem duplicar.
- Os vídeos extras já aparecem na página da publicação (bloco "Veja a história completa") e o card do feed mostra a contagem total de vídeos — isso já está pronto, nada a fazer.

## Detalhes técnicos

- O conteúdo do arquivo `INSERT_posts_pasted.sql` é aplicado byte-a-byte via migração (INSERT ... SELECT FROM VALUES com guarda `WHERE NOT EXISTS` por título).
- Nenhuma alteração de schema, view, política ou grant.
- Após a carga, verifico a contagem inserida e abro o feed para conferir que os posts aparecem com vídeo e selo.
