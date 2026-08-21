export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (days < 30) return `há ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? 's' : ''}`;
  return `há ${Math.floor(days / 30)} mês${Math.floor(days / 30) > 1 ? 'es' : ''}`;
}
