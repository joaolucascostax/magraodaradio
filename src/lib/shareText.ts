export function buildShareText({
  title,
  url,
  supportCount = 0,
  tipo = 'publicação',
}: {
  title: string;
  url: string;
  supportCount?: number;
  tipo?: string;
}) {
  const hasVotes = supportCount > 0;
  const votesLine = hasVotes
    ? `Já tem *${supportCount.toLocaleString('pt-BR')} ${supportCount === 1 ? 'apoio' : 'apoios'}* — e a sua voz conta!`
    : 'Seja o primeiro a apoiar — a sua voz conta!';

  return `🔥 *${title}* no Magrão no Ar\n\n${votesLine}\n\n👉 Veja e participe:\n${url}`;
}
