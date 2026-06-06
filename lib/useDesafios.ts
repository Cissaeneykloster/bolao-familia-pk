"use client";

import { useBolao } from "./store";
import { DESAFIO_CATS as DEFAULT_CATS } from "./mock-data";
import type { DesafioCat } from "./types";

/**
 * Retorna os desafios do grupo ativo no dispositivo.
 * Se o admin estiver logado, usa o grupo dele.
 * Cada grupo tem sua própria lista — se não personalizada, usa os padrões.
 */
export function useDesafioCats(): DesafioCat[] {
  const { desafioCatsByGroup, currentGrupoId, adminGrupoId, adminUnlocked } = useBolao();

  // Admin em sessão: usa o grupo do admin logado
  const grupoId = adminUnlocked && adminGrupoId ? adminGrupoId : currentGrupoId;

  if (!grupoId) return DEFAULT_CATS;
  return desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
}

/**
 * Retorna os desafios de um grupo específico (para o sorteio).
 */
export function getDesafioCatsForGroup(
  desafioCatsByGroup: Record<string, DesafioCat[]>,
  grupoId: string | null
): DesafioCat[] {
  if (!grupoId) return DEFAULT_CATS;
  return desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
}
