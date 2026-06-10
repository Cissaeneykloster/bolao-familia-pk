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
    participantes: localParticipantes,
  } = useBolao();

  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    async function syncAll() {
      // Carrega participantes — faz MERGE com locais para não perder cadastros
      // que ainda não foram salvos no Supabase (ex: upsert falhou por rede)
      const parts = await loadParticipantes();
      if (parts.length > 0) {
        // Merge: Supabase tem prioridade por id; locais sem id no Supabase são mantidos
        const sbIds = new Set(parts.map((p) => p.id));
        const localOnly = localParticipantes.filter((p) => !sbIds.has(p.id));
        const merged = [...parts, ...localOnly];
        setParticipantes(merged);

        // Tenta re-enviar ao Supabase os participantes que só existem localmente
        if (localOnly.length > 0) {
          const { upsertParticipante } = await import("@/lib/supabase-sync");
          for (const p of localOnly) {
            upsertParticipante(p).catch(() => {/* silencioso */});
          }
        }
      } else {
        // Supabase vazio: mantém dados locais e tenta salvar no Supabase
        if (localParticipantes.length > 0) {
          const { upsertParticipante } = await import("@/lib/supabase-sync");
          for (const p of localParticipantes) {
            upsertParticipante(p).catch(() => {/* silencioso */});
          }
        }
      }

      // Carrega resultados oficiais
      const results = await loadOfficialResults();
      setOfficialResults(results); // sempre sobrescreve (dados do servidor são autoritativos)

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

    // Re-sync a cada 30s como fallback (caso Realtime não disparar)
    const pollId = setInterval(async () => {
      const results = await loadOfficialResults();
      setOfficialResults(results);
      const pts = await loadMatchPts();
      if (Object.keys(pts).length > 0) setMatchPts(pts);
    }, 30_000);

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

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [setParticipantes, setOfficialResults, setMatchPts, mergeGuesses, currentUserApelido]);
}
