/**
 * Grupos temáticos do ranking, atribuídos por POSIÇÃO PERCENTIL (quartis).
 * 0 = topo (melhores 25%) … 3 = lanterna (piores 25%).
 */
export interface Tier {
  emoji: string;
  name: string;
  vibe: string;
}

export const TIERS: Tier[] = [
  { emoji: "🔮", name: "Nostradamus da Várzea", vibe: "acerta tudo" },
  { emoji: "🎯", name: "Sabe das Coisas",       vibe: "manja dos paranauê" },
  { emoji: "🎲", name: "Chutômetro",            vibe: "chuta e reza" },
  { emoji: "🍳", name: "Cozinha",               vibe: "queimando o feijão" },
];

/**
 * Tier (0..3) pela posição percentil dentro do ranking.
 * `index` é a posição 0-based (0 = 1º colocado); `total` é o nº de participantes.
 */
export function tierForRank(index: number, total: number): number {
  if (total <= 0) return 0;
  const t = Math.floor((index / total) * TIERS.length);
  return Math.min(TIERS.length - 1, Math.max(0, t));
}
