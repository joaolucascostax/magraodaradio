export function timeAgoBr(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias < 7) return `há ${dias}d`;
  const sem = Math.floor(dias / 7);
  if (sem < 5) return `há ${sem} sem`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} mês${meses > 1 ? 'es' : ''}`;
  return `há ${Math.floor(dias / 365)}a`;
}