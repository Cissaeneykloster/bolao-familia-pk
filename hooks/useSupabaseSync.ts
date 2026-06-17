"use client";

import { useEffect, useRef } from "react";
import { useBolao } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  loadParticipantes, loadOfficialResults, loadMatchPts, loadGuesses,
  loadGroupPredictions, backfillGuesses, upsertGroupPredictions,
  loadMatches, syncAllMatches, seedMissingMatches, loadAdminDeltas,
  loadDailyDraw, insertDailyDraw, loadChallengePts, loadMyChallengeDone,
} from "@/lib/supabase-sync";
import { MATCHES } from "@/lib/mock-data";
import { rollDailyChallenge, todayBrasilia, isDrawTime } from "@/lib/daily";
import { getDesafioCatsForGroup } from "@/lib/useDesafios";

/**
 * Hook que sincroniza os dados críticos do Supabase ao montar o app.
 * Também assina o canal Realtime para atualizações em tempo real.
 */
export function useSupabaseSync() {
  const {
    setParticipantes,
    setMatches,
    setOfficialResults,
    setMatchPts,
    setAdminDeltas,
    setDailyDraw,
    setMyChallengeDone,
    setChallengePts,
    mergeGuesses,
    mergeGroupPredictions,
    currentUserApelido,
  } = useBolao();

  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    // Desafio diário (sorteio do sistema, lazy): 1º acesso após 07:00 BRT
    // sorteia e grava no banco (idempotente); os demais recebem via Realtime.
    async function syncDaily() {
      const date = todayBrasilia();
      const grupo = useBolao.getState().currentGrupoId;
      if (grupo) {
        let draw = await loadDailyDraw(grupo, date);
        if (!draw && isDrawTime()) {
          const cats = getDesafioCatsForGroup(useBolao.getState().desafioCatsByGroup, grupo);
          const rolled = rollDailyChallenge(cats);
          const cat = cats.find((c) => c.id === rolled.area);
          if (cat) {
            await insertDailyDraw({
              grupoId: grupo, dateBrt: date, area: rolled.area, itemIdx: rolled.itemIdx,
              descricao: cat.items[rolled.itemIdx] ?? "", pts: cat.pts,
            });
            draw = await loadDailyDraw(grupo, date);
          }
        }
        setDailyDraw(draw);
      }
      setChallengePts(await loadChallengePts());
      const apelido = useBolao.getState().currentUserApelido;
      if (apelido) setMyChallengeDone(await loadMyChallengeDone(apelido, date));
    }

    async function syncAll() {
      // Carrega jogos do banco; se a tabela estiver vazia, semeia a partir
      // do seed local (MATCHES, já com os horários corrigidos)
      const dbMatches = await loadMatches();
      if (dbMatches.length > 0) {
        // Reconcilia: libera para todos os jogos novos do seed que ainda não
        // estão no banco (mata-mata, rodadas adicionadas etc.). Não sobrescreve
        // os existentes — preserva edições do admin.
        const existingIds = new Set(dbMatches.map((m) => m.id));
        const added = await seedMissingMatches(MATCHES, existingIds);
        if (added > 0) {
          console.log(`[SB] matches liberados: +${added} jogo(s)`);
          setMatches(await loadMatches());
        } else {
          setMatches(dbMatches);
        }
      } else {
        const seeded = await syncAllMatches(MATCHES);
        if (seeded > 0) {
          console.log(`[SB] matches seed: ${seeded} jogo(s)`);
          const fresh = await loadMatches();
          if (fresh.length > 0) setMatches(fresh);
        }
      }

      // Carrega participantes
      const parts = await loadParticipantes();
      if (parts.length > 0) setParticipantes(parts);

      // Carrega resultados oficiais
      const results = await loadOfficialResults();
      setOfficialResults(results); // sempre sobrescreve (dados do servidor são autoritativos)

      // Carrega pontos
      const pts = await loadMatchPts();
      if (Object.keys(pts).length > 0) setMatchPts(pts);

      // Carrega ajustes manuais do admin (sempre sobrescreve — servidor é autoritativo)
      setAdminDeltas(await loadAdminDeltas());

      // Carrega palpites e previsões do usuário atual (se identificado)
      if (currentUserApelido) {
        // Snapshot do que existe só neste aparelho, antes do merge
        const localGuesses = { ...useBolao.getState().guesses };
        const localPreds = { ...useBolao.getState().groupPredictions };
        const localPredsSaved = useBolao.getState().groupPredictionsSaved;

        const guesses = await loadGuesses(currentUserApelido);
        if (Object.keys(guesses).length > 0) mergeGuesses(guesses);

        // Recupera para o servidor os palpites feitos antes da persistência
        const recovered = await backfillGuesses(currentUserApelido, localGuesses, guesses);
        if (recovered > 0) console.log(`[SB] backfill: ${recovered} palpite(s) recuperado(s)`);

        const { predictions, saved } = await loadGroupPredictions(currentUserApelido);
        if (Object.keys(predictions).length > 0) mergeGroupPredictions(predictions, saved);

        // Recupera previsões locais que o servidor ainda não tem
        const missingPreds = Object.fromEntries(
          Object.entries(localPreds).filter(([g]) => !(g in predictions))
        );
        if (Object.keys(missingPreds).length > 0) {
          await upsertGroupPredictions(currentUserApelido, missingPreds, localPredsSaved || saved);
        }
      }
    }

    syncAll();
    void syncDaily();

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

      // Jogos alterados (admin editou data/hora/placar)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, async () => {
        const m = await loadMatches();
        if (m.length > 0) setMatches(m);
      })

      // Ajuste manual de pontos do admin
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_deltas" }, async () => {
        setAdminDeltas(await loadAdminDeltas());
      })

      // Desafio diário sorteado/propagado
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_draws" }, async () => {
        const grupo = useBolao.getState().currentGrupoId;
        if (grupo) setDailyDraw(await loadDailyDraw(grupo, todayBrasilia()));
      })

      // Conclusão de desafios (pontos do ranking)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_done" }, async () => {
        setChallengePts(await loadChallengePts());
        const apelido = useBolao.getState().currentUserApelido;
        if (apelido) setMyChallengeDone(await loadMyChallengeDone(apelido, todayBrasilia()));
      })

      // Previsões dos grupos (sincroniza entre os dispositivos do mesmo usuário)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_predictions" }, async () => {
        const apelido = useBolao.getState().currentUserApelido;
        if (!apelido) return;
        const { predictions, saved } = await loadGroupPredictions(apelido);
        if (Object.keys(predictions).length > 0) mergeGroupPredictions(predictions, saved);
      })

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [setParticipantes, setMatches, setOfficialResults, setMatchPts, setAdminDeltas, setDailyDraw, setMyChallengeDone, setChallengePts, mergeGuesses, mergeGroupPredictions, currentUserApelido]);
}
