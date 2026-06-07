"use client";

import { useEffect, useRef } from "react";
import { useBolao } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  loadParticipantes, loadOfficialResults, loadMatchPts, loadGuesses,
} from "@/lib/supabase-sync";

/**
 * Hook que sincroniza os dados críticos do Supabase ao montar o app.
 * Também assina o canal Realtime para atualizações em tempo real.
 */
export function useSupabaseSync() {
  const {
    setParticipantes,
    setOfficialResults,
    setMatchPts,
    mergeGuesses,
    currentUserApelido,
  } = useBolao();

  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    async function syncAll() {
      // Carrega participantes
      const parts = await loadParticipantes();
      if (parts.length > 0) setParticipantes(parts);

      // Carrega resultados oficiais
      const results = await loadOfficialResults();
      if (Object.keys(results).length > 0) setOfficialResults(results);

      // Carrega pontos
      const pts = await loadMatchPts();
      if (Object.keys(pts).length > 0) setMatchPts(pts);

      // Carrega palpites do usuário atual (se identificado)
      if (currentUserApelido) {
        const guesses = await loadGuesses(currentUserApelido);
        if (Object.keys(guesses).length > 0) mergeGuesses(guesses);
      }
    }

    syncAll();

    // ── Realtime: ouve mudanças no banco ──────────────────────────

    const channel = supabase
      .channel("bolao-realtime")

      // Participante adicionado/alterado
      .on("postgres_changes", { event: "*", schema: "public", table: "participantes" }, async () => {
        const parts = await loadParticipantes();
        setParticipantes(parts);
      })

      // Resultado oficial lançado
      .on("postgres_changes", { event: "*", schema: "public", table: "official_results" }, async () => {
        const results = await loadOfficialResults();
        setOfficialResults(results);
      })

      // Pontos atualizados
      .on("postgres_changes", { event: "*", schema: "public", table: "match_pts" }, async () => {
        const pts = await loadMatchPts();
        setMatchPts(pts);
      })

      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [setParticipantes, setOfficialResults, setMatchPts, mergeGuesses, currentUserApelido]);
}
