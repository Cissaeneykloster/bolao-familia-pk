"use client";

/**
 * Hook que retorna os desafios do store (editáveis pelo admin).
 * Substitui o uso direto de DESAFIO_CATS do mock-data nos componentes.
 */
import { useBolao } from "./store";

export function useDesafioCats() {
  return useBolao((s) => s.desafioCats);
}
