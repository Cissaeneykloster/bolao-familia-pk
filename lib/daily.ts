import type { DesafioCat, Area, Draw } from "./types";

export const todayStr = (d = new Date()): string =>
  d.toISOString().slice(0, 10);

export const activeDraw = (draw: Draw | null, today = todayStr()): Draw | null =>
  draw && draw.date === today ? draw : null;

export const drawnId = (draw: Draw | null, area: Area): string | null => {
  const d = activeDraw(draw);
  return d && d.picks[area] != null ? `${area}-${d.picks[area]}` : null;
};

export function rollDraw(
  cats: DesafioCat[],
  areas: Area[],
  rnd = Math.random
): Draw {
  const picks: Partial<Record<Area, number>> = {};
  for (const a of areas) {
    const c = cats.find((x) => x.id === a)!;
    picks[a] = Math.floor(rnd() * c.items.length);
  }
  return { date: todayStr(), picks };
}

export const dailyDoneCount = (
  draw: Draw | null,
  desafios: Record<string, true>,
  areas: Area[]
): number =>
  areas.filter((a) => {
    const id = drawnId(draw, a);
    return id ? !!desafios[id] : false;
  }).length;

export function closeDayResult(
  draw: Draw | null,
  desafios: Record<string, true>,
  areas: Area[],
  cats: DesafioCat[]
) {
  let lost = 0;
  let missed = 0;
  const d = activeDraw(draw);
  if (!d) return { lost, missed };
  for (const a of areas) {
    const id = drawnId(draw, a);
    if (id && !desafios[id]) {
      lost += cats.find((c) => c.id === a)!.pts;
      missed++;
    }
  }
  return { lost, missed };
}

export const shouldClaimCombo = (count: number, claimed: boolean): boolean =>
  count === 4 && !claimed;
