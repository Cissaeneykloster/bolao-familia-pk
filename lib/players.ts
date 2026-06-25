/**
 * Converte os Participantes cadastrados pelo admin em Players para o ranking.
 * Pontos base = matchPts (partidas). O ajuste manual do admin (adminDelta) é
 * aplicado uma única vez em effPts/rankWithEff — NÃO deve ser somado aqui,
 * senão fica contado em dobro.
 */
import type { Player } from "./types";
import type { Participante } from "./mock-data";

/**
 * Chave normalizada de apelido: sem espaços nas pontas, minúscula e sem acentos.
 * Usada só para COMPARAR apelidos — nunca para gravar.
 */
export function apelidoKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove marcas de acento combinantes
}

/**
 * Resolve um apelido "cru" (ex.: vindo do link de acesso) para a grafia
 * canônica cadastrada em `participantes`, ignorando acento/maiúscula/espaço.
 * Assim os palpites são sempre gravados com o MESMO apelido do participante,
 * evitando que o ranking deixe de casar (ex.: "Raíssa" × "Raissa").
 * Sem correspondência, devolve o apelido apenas com `trim`.
 */
export function canonicalApelido(
  raw: string,
  participantes: { apelido: string }[],
): string {
  const key = apelidoKey(raw);
  const match = participantes.find((p) => apelidoKey(p.apelido) === key);
  return match ? match.apelido : raw.trim();
}


/**
 * True se o apelido (normalizado) já está em uso por OUTRO participante —
 * em QUALQUER grupo. Os dados por participante (palpites/pontos/previsões)
 * são chaveados só por apelido, então apelido repetido entre grupos mistura
 * os dados (issue #49). Use no cadastro/edição para impedir a colisão.
 */
export function apelidoEmUso(
  apelido: string,
  participantes: { id: string; apelido: string }[],
  exceptId?: string,
): boolean {
  const key = apelidoKey(apelido);
  if (!key) return false;
  return participantes.some((p) => p.id !== exceptId && apelidoKey(p.apelido) === key);
}

export function participantesToPlayers(
  participantes: Participante[],
  matchPts: Record<string, number> = {},
  challengePts: Record<string, number> = {},
  groupPredPts: Record<string, number> = {},
  matchStats: Record<string, { exact: number; winners: number }> = {}
): Player[] {
  return participantes
    .filter((p) => p.ativo)
    .map((p) => {
      const initials = p.apelido
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      // Base = partidas + desafios + previsão de grupos (adminDelta vai em effPts)
      const pts =
        (matchPts[p.apelido] ?? 0) +
        (challengePts[p.apelido] ?? 0) +
        (groupPredPts[p.apelido] ?? 0);

      const stats = matchStats[p.apelido];
      return {
        name: p.apelido,
        initials,
        pts,
        trend: "flat" as const,
        exact: stats?.exact ?? 0,
        winners: stats?.winners ?? 0,
        you: false,
      };
    })
    .sort((a, b) => b.pts - a.pts);
}
