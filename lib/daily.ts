import type { DesafioCat, Area, Draw, ChallengeRecord } from "./types";

// ── Timezone Vancouver ─────────────────────────────────────────────
// Junho 2026: Pacific Daylight Time (PDT) = UTC-7
const VANCOUVER_UTC_OFFSET = -7;

/** Data atual no calendário de Vancouver (YYYY-MM-DD) */
export function todayVancouver(now = new Date()): string {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const vMs = utcMs + VANCOUVER_UTC_OFFSET * 3_600_000;
  return new Date(vMs).toISOString().slice(0, 10);
}

/**
 * Janela do desafio diário em Vancouver:
 *   Abre: 01:00 Vancouver = 08:00 UTC
 *   Fecha: 00:00 Vancouver (dia seguinte) = 07:00 UTC
 */
export function getChallengeWindow(dateVancouver: string): { open: number; close: number } {
  const [y, m, d] = dateVancouver.split("-").map(Number);
  // 01:00 Vancouver = (1 - VANCOUVER_UTC_OFFSET) = 8h UTC
  const openHourUTC = 1 - VANCOUVER_UTC_OFFSET;   // 8
  // 24:00 Vancouver (meia-noite) = next-day 00:00 Vancouver = (24 - VANCOUVER_UTC_OFFSET) UTC
  const closeHourUTC = 24 - VANCOUVER_UTC_OFFSET; // 31 → dia seguinte 07:00 UTC

  const open = Date.UTC(y, m - 1, d, openHourUTC);
  // closeHourUTC = 31 → dia +1, hora 7
  const closeDay = closeHourUTC >= 24 ? d + 1 : d;
  const closeHour = closeHourUTC >= 24 ? closeHourUTC - 24 : closeHourUTC;
  const close = Date.UTC(y, m - 1, closeDay, closeHour);

  return { open, close };
}

/** Verifica se a janela do desafio está aberta agora */
export function isWindowOpen(dateVancouver: string, now = Date.now()): boolean {
  const { open, close } = getChallengeWindow(dateVancouver);
  return now >= open && now < close;
}

/** Millisegundos restantes para fechar a janela */
export function msUntilClose(dateVancouver: string, now = Date.now()): number {
  const { close } = getChallengeWindow(dateVancouver);
  return Math.max(0, close - now);
}

// ── Numeração das categorias ──────────────────────────────────────
export const AREA_NUMBER: Record<Area, number> = {
  quarto:      1,
  casa:        2,
  servico:     3,
  intelectual: 4,
  saude:       5,
};

/** Retorna o código do desafio, ex: "1.4" (categoria 1, item 4) */
export function challengeCode(area: Area, itemIdx: number): string {
  return `${AREA_NUMBER[area]}.${itemIdx + 1}`;
}

// ── Sorteio ───────────────────────────────────────────────────────
/**
 * Sorteia 1 desafio aleatório de TODOS os itens de TODAS as categorias.
 * Pode repetir — não há problema.
 */
export function rollDailyChallenge(
  cats: DesafioCat[],
  rnd = Math.random
): Draw {
  // Pool: todos os pares (area, itemIdx)
  const pool: { area: Area; itemIdx: number }[] = [];
  for (const cat of cats) {
    for (let i = 0; i < cat.items.length; i++) {
      pool.push({ area: cat.id, itemIdx: i });
    }
  }
  const pick = pool[Math.floor(rnd() * pool.length)];
  return {
    dateVancouver: todayVancouver(),
    area: pick.area,
    itemIdx: pick.itemIdx,
    done: false,
  };
}

// ── Resolução automática ao fechar a janela ───────────────────────
/**
 * Se existir um draw do dia anterior cuja janela já fechou,
 * retorna o ChallengeRecord correspondente (para adicionar ao histórico).
 * Retorna null se não há draw pendente ou se a janela ainda está aberta.
 */
export function resolvePendingDraw(
  draw: Draw | null,
  cats: DesafioCat[],
  now = Date.now()
): ChallengeRecord | null {
  if (!draw) return null;
  const today = todayVancouver(new Date(now));
  // Só resolve se é de um dia anterior ou se a janela já fechou
  if (draw.dateVancouver === today && isWindowOpen(draw.dateVancouver, now)) {
    return null; // janela ainda aberta
  }
  const cat = cats.find((c) => c.id === draw.area)!;
  const descricao = cat.items[draw.itemIdx] ?? "—";
  const pts = draw.done ? cat.pts : -cat.pts;
  return {
    dateVancouver: draw.dateVancouver,
    area: draw.area,
    itemIdx: draw.itemIdx,
    code: challengeCode(draw.area, draw.itemIdx),
    descricao,
    done: draw.done,
    pts,
  };
}

// ── Legado (mantido para não quebrar testes existentes) ───────────
/** @deprecated use todayVancouver */
export const todayStr = (d = new Date()): string => d.toISOString().slice(0, 10);
/** @deprecated */
export const activeDraw = (draw: Draw | null, today = todayStr()): Draw | null =>
  draw && (draw.dateVancouver === today || draw.dateVancouver === todayVancouver()) ? draw : null;
/** @deprecated */
export const drawnId = (_draw: Draw | null, _area: Area): string | null => null;
/** @deprecated */
export const dailyDoneCount = (_draw: Draw | null, _desafios: Record<string, true>, _areas: Area[]): number => 0;
/** @deprecated */
export const closeDayResult = (_draw: Draw | null, _desafios: Record<string, true>, _areas: Area[], _cats: DesafioCat[]) =>
  ({ lost: 0, missed: 0 });
/** @deprecated */
export const shouldClaimCombo = (_count: number, _claimed: boolean): boolean => false;
/** @deprecated */
export const rollDraw = (_cats: DesafioCat[], _areas: Area[], _rnd = Math.random): Draw =>
  ({ dateVancouver: todayVancouver(), area: "quarto", itemIdx: 0, done: false });
