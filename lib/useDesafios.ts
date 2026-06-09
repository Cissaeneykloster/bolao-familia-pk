"use client";

import { useBolao } from "./store";
import { DESAFIO_CATS, DESAFIO_CATS_EN, ADMINS } from "./mock-data";
import type { DesafioCat } from "./types";

/**
 * Retorna os desafios do grupo ativo.
 * - Se o grupo tem lang="en" e não customizou → usa inglês
 * - Se customizou → usa a versão customizada
 */
export function useDesafioCats(): DesafioCat[] {
  const { desafioCatsByGroup, currentGrupoId, adminGrupoId, adminUnlocked } = useBolao();

  const grupoId = adminUnlocked && adminGrupoId ? adminGrupoId : currentGrupoId;
  if (!grupoId) return DESAFIO_CATS;

  // Se tem versão customizada pelo admin → usa ela
  if (desafioCatsByGroup[grupoId]) return desafioCatsByGroup[grupoId];

  // Detecta idioma do grupo
  const grupoCfg = ADMINS.find((a) => a.id === grupoId);
  if (grupoCfg?.lang === "en") return DESAFIO_CATS_EN;

  return DESAFIO_CATS;
}

export function getDesafioCatsForGroup(
  desafioCatsByGroup: Record<string, DesafioCat[]>,
  grupoId: string | null
): DesafioCat[] {
  if (!grupoId) return DESAFIO_CATS;
  if (desafioCatsByGroup[grupoId]) return desafioCatsByGroup[grupoId];
  const grupoCfg = ADMINS.find((a) => a.id === grupoId);
  if (grupoCfg?.lang === "en") return DESAFIO_CATS_EN;
  return DESAFIO_CATS;
}
