/**
 * Formata a contagem regressiva em ms para exibição.
 * ≤ 0      → "fechado"
 * ≥ 24h   → "Nd Xh"
 * senão   → "Xh MMm"
 */
export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "fechado";
  const totalMin = Math.floor(ms / 60_000);
  const totalH = Math.floor(totalMin / 60);
  const days = Math.floor(totalH / 24);
  if (days >= 1) {
    const remH = totalH % 24;
    return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
  }
  const remMin = totalMin % 60;
  return `${totalH}h ${String(remMin).padStart(2, "0")}m`;
}

/**
 * Formata a idade de um evento do feed (em minutos).
 * 0       → "agora"
 * < 60    → "Nmin atrás"
 * senão  → "Nh atrás"
 */
export function feedAge(min: number): string {
  if (min <= 0) return "agora";
  if (min < 60) return `${min}min atrás`;
  return `${Math.floor(min / 60)}h atrás`;
}
