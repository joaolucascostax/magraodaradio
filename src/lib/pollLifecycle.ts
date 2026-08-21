/**
 * Utilitários de ciclo de vida de enquete.
 * Uma enquete é considerada efetivamente ativa quando:
 *   - o admin não a arquivou (isActive === true)
 *   - E não tem data de encerramento OU a data ainda não passou.
 * O cron do banco fecha a cada 5min, mas o frontend antecipa a transição
 * pra UX não ficar dessincronizada.
 */
export function isPollLive(poll: { isActive: boolean; endsAt?: string | null }): boolean {
  if (!poll.isActive) return false;
  if (!poll.endsAt) return true;
  return new Date(poll.endsAt).getTime() > Date.now();
}

/**
 * Formata quanto falta pra encerrar. Retorna null se não tem prazo
 * ou já encerrou.
 */
export function timeUntilClose(endsAt?: string | null): string | null {
  if (!endsAt) return null;
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `encerra em ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `encerra em ${hours}h`;
  const days = Math.floor(hours / 24);
  return `encerra em ${days}d`;
}

export function formatEndedAt(endsAt?: string | null): string | null {
  if (!endsAt) return null;
  const d = new Date(endsAt);
  if (d.getTime() > Date.now()) return null;
  return `encerrada em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
}
