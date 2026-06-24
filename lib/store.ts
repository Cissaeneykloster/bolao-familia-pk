"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Draw, ChallengeRecord, FeedEvent, Match } from "./types";
import type { Participante } from "./mock-data";
import type { DesafioCat } from "./types";
import { DESAFIO_CATS as DEFAULT_CATS, MATCHES } from "./mock-data";
import { upsertGuess, upsertGroupPredictions } from "./supabase-sync";
import type { DailyDraw } from "./supabase-sync";
import { breakdown, computeMatchPts, PENALTY_START_MS } from "./scoring";
import { isMatchLocked, arePredictionsLocked } from "./standings";
import { canonicalApelido } from "./players";

// ── Tipos do estado ───────────────────────────────────────────────

/**
 * Resultado de salvar um palpite:
 * - "saved":   gravado e CONFIRMADO no servidor (Supabase)
 * - "local":   sem identificação — fica só neste aparelho (localStorage)
 * - "error":   identificado, mas o servidor não confirmou após as tentativas
 * - "skipped": nada a salvar (jogo travado ou sem palpite)
 */
export type SaveGuessResult = "saved" | "local" | "error" | "skipped";

type StyleGroup = "podium" | "card" | "palpite";
type StyleVal = "a" | "b" | "c";
type Screen =
  | "ranking" | "jogos" | "palpites" | "grupos"
  | "desafios" | "feed" | "admin" | "regulamento";

interface BolaoState {
  // UI
  theme: "dark" | "light";
  podium: StyleVal;
  card: StyleVal;
  palpite: StyleVal;
  sound: boolean;
  live: boolean;
  current: Screen;
  focusMatchId: string | null;

  // Grupo ativo (persiste — cada dispositivo sabe a qual grupo pertence)
  currentGrupoId: string | null;

  // Identidade do participante (salva do link de acesso)
  currentUserApelido: string | null;

  // Feed (gerado automaticamente + anúncios do admin)
  feedEvents: FeedEvent[];

  // Previsão dos grupos (pré-Copa) — trava ao salvar ou no kickoff do 1º jogo
  groupPredictions: Record<string, { first: string; second: string }>;
  groupPredictionsSaved: boolean;   // true = travado para sempre
  groupPredictionsSavedAt: number | null;

  // Jogo
  guesses: Record<string, { a: number; b: number }>;
  draw: Draw | null;                    // desafio do dia atual
  challengeHistory: ChallengeRecord[]; // histórico de desafios resolvidos
  totalChallengePoints: number;        // soma acumulada de pontos dos desafios
  // legado (mantido para não quebrar testes)
  desafios: Record<string, true>;
  evidence: Record<string, string>;
  comboBank: number;
  drawComboClaimed: boolean;
  penalty: number;

  // Desafios editáveis por grupo (cada grupo tem os seus)
  // Se o grupo não tiver personalizado, usa os padrões (DEFAULT_CATS)
  desafioCatsByGroup: Record<string, DesafioCat[]>;

  // Admin — sessão (NÃO persistida)
  adminUnlocked: boolean;
  adminGrupoId: string | null;   // grupo do admin logado (sessão)

  // Pontos de partidas por participante (apelido → total)
  // Calculado quando admin salva resultado. Inclui -3 se sem palpite.
  // Pontos de partidas por participante (apelido → total acumulado)
  matchPts: Record<string, number>;

  // Resultados oficiais lançados pelo admin — congela o jogo para todos
  officialResults: Record<string, { sa: number; sb: number }>;

  // Jogos (fonte de verdade = Supabase; inicia com o seed MATCHES p/ SSR/offline)
  matches: Match[];

  // Desafio diário (sorteado pelo sistema, propagado por grupo)
  dailyDraw: DailyDraw | null;
  myChallengeDone: boolean | null;        // estado do usuário atual hoje (null = não marcou)
  challengePts: Record<string, number>;   // apelido → total de pontos de desafios

  // Dados compartilhados
  adminDelta: Record<string, number>;
  betFix: Record<string, { a: number; b: number }>;
  resultFix: Record<string, { sa: number; sb: number }>;
  participantes: Participante[];  // todos os grupos

  // Streak
  streak: number;
  current_day: string;

  // ── Actions ──────────────────────────────────────────────────
  setStyle: (group: StyleGroup, val: StyleVal) => void;
  setTheme: (t: "dark" | "light") => void;
  toggleSound: () => void;
  toggleLive: () => void;
  setScreen: (s: Screen) => void;
  setFocusMatch: (id: string | null) => void;
  setCurrentGrupo: (id: string | null) => void;
  setCurrentUserApelido: (apelido: string | null) => void;

  setGuess: (id: string, side: "a" | "b", dir: 1 | -1) => void;
  saveGuess: (id: string) => Promise<SaveGuessResult>;

  // Sincronização Supabase → store
  setParticipantes: (p: Participante[]) => void;
  setMatches: (m: Match[]) => void;
  setDailyDraw: (d: DailyDraw | null) => void;
  setMyChallengeDone: (v: boolean | null) => void;
  setChallengePts: (m: Record<string, number>) => void;
  setOfficialResults: (r: Record<string, { sa: number; sb: number }>) => void;
  setMatchPts: (pts: Record<string, number>) => void;
  mergeGuesses: (g: Record<string, { a: number; b: number }>) => void;

  // Previsão dos grupos
  setGroupPrediction: (group: string, first: string, second: string) => void;
  saveGroupPredictions: () => void;
  mergeGroupPredictions: (
    preds: Record<string, { first: string; second: string }>,
    saved: boolean,
  ) => void;

  // Feed
  addFeedEvent: (event: Omit<FeedEvent, "id" | "timestamp">) => void;
  removeFeedEvent: (id: string) => void;
  clearFeed: () => void;

  // Desafio diário
  setDraw: (draw: Draw) => void;
  markChallengeDone: (done: boolean) => void;
  resolveChallenge: (record: ChallengeRecord) => void;
  // legado
  toggleDesafio: (id: string) => void;
  setEvidence: (id: string, dataUrl: string) => void;
  claimCombo: () => void;
  addPenalty: (n: number) => void;
  clearDay: () => void;

  // Edição dos desafios (scoped por grupoId do admin logado)
  setDesafioItem: (grupoId: string, catId: string, idx: number, text: string) => void;
  addDesafioItem: (grupoId: string, catId: string) => void;
  removeDesafioItem: (grupoId: string, catId: string, idx: number) => void;
  setDesafioPts: (grupoId: string, catId: string, pts: number) => void;
  resetDesafios: (grupoId: string) => void;

  setAdminUnlocked: (v: boolean) => void;
  setAdminGrupo: (grupoId: string | null) => void;
  setAdminDelta: (name: string, delta: number) => void;
  setAdminDeltas: (m: Record<string, number>) => void;
  resetAdminDelta: (name: string) => void;
  setBetFix: (id: string, score: { a: number; b: number }) => void;
  // Salva resultado E recalcula pontos (exceto treinos — não contam para ranking)
  // matchGuesses: palpites DESTE jogo por apelido (loadAllGuesses(...)[matchId])
  saveResultAndCalcPts: (
    matchId: string,
    score: { sa: number; sb: number },
    participantes: import("./mock-data").Participante[],
    grupoId: string,
    matchGuesses: Record<string, { a: number; b: number }>,
    matchPhase: import("./types").MatchPhase,
    isTraining?: boolean,
  ) => void;
  // Zera todos os pontos de partidas
  resetMatchPts: () => void;
  // Reconstrói TODOS os pontos a partir dos resultados oficiais + palpites
  // reais (loadAllGuesses). Idempotente — seguro clicar quantas vezes quiser.
  recalcAllMatchPts: (
    participantes: import("./mock-data").Participante[],
    allGuesses: Record<string, Record<string, { a: number; b: number }>>,
  ) => void;
  setResultFix: (id: string, score: { sa: number; sb: number }) => void;

  // Participantes — scoped por grupo
  addParticipante: (p: Omit<Participante, "id" | "token" | "ativo">) => Participante;
  updateParticipante: (id: string, data: Partial<Pick<Participante, "nome" | "apelido" | "email" | "telefone">>) => void;
  removeParticipante: (id: string) => void;
  toggleParticipanteAtivo: (id: string) => void;
  clearGrupoData: (grupoId: string) => void;
  // Migra participantes antigos (sem grupoId) para um grupo
  migrateParticipantes: (grupoId: string) => void;
}

// ── Valores iniciais ──────────────────────────────────────────────

const initialState = {
  theme: "dark" as const,
  podium: "a" as const,
  card: "a" as const,
  palpite: "a" as const,
  sound: true,
  live: false,
  current: "ranking" as Screen,
  focusMatchId: null as string | null,
  currentGrupoId: null as string | null,
  currentUserApelido: null as string | null,

  desafioCatsByGroup: {},
  matches: MATCHES,
  dailyDraw: null as DailyDraw | null,
  myChallengeDone: null as boolean | null,
  challengePts: {},
  matchPts: {},
  officialResults: {},
  feedEvents: [],
  groupPredictions: {},
  groupPredictionsSaved: false,
  groupPredictionsSavedAt: null,
  guesses: {},
  draw: null,
  challengeHistory: [],
  totalChallengePoints: 0,
  desafios: {} as Record<string, true>,
  evidence: {},
  comboBank: 0,
  drawComboClaimed: false,
  penalty: 0,

  adminUnlocked: false,
  adminGrupoId: null as string | null,
  adminDelta: {},
  betFix: {},
  resultFix: {},
  participantes: [],

  streak: 0,
  current_day: "",
};

// ── Store ─────────────────────────────────────────────────────────

export const useBolao = create<BolaoState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStyle: (group, val) => set({ [group]: val }),
      setTheme: (t) => set({ theme: t }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleLive: () => set((s) => ({ live: !s.live })),
      setScreen: (s) => set({ current: s }),
      setFocusMatch: (id) => set({ focusMatchId: id }),
      setCurrentGrupo: (id) => set({ currentGrupoId: id }),
      setCurrentUserApelido: (apelido) => set({ currentUserApelido: apelido }),

      setGuess: (id, side, dir) =>
        set((state) => {
          const prev = state.guesses[id] ?? { a: 0, b: 0 };
          const next = Math.min(20, Math.max(0, prev[side] + dir));
          return { guesses: { ...state.guesses, [id]: { ...prev, [side]: next } } };
        }),

      saveGuess: async (id) => {
        // Partida iniciada → palpite não pode mais ser salvo (regra do bolão)
        const match = get().matches.find((m) => m.id === id);
        if (match && isMatchLocked(match)) return "skipped";

        const { currentUserApelido, guesses, participantes } = get();
        const g = guesses[id];
        if (!g) return "skipped";

        // O palpite já está no store (persistido no localStorage via zustand).
        // Sem identificação NÃO há como gravar na nuvem — avisa que ficou local.
        if (!currentUserApelido) return "local";

        // Grava sob a MESMA grafia canônica usada na leitura (ignora acento/
        // maiúscula/espaço). Sem isto, palpite escrito como "Raíssa" e lido como
        // "Raissa" "some" do ranking/das telas (ver issue de divergência de apelido).
        const apelido = canonicalApelido(currentUserApelido, participantes);

        // Retry com backoff — NÃO declara "salvo" sem o servidor confirmar.
        // Antes, era fire-and-forget (`void upsertGuess`): na falha de rede o
        // usuário via "✅ Salvo!" e o palpite nunca chegava ao banco.
        for (let attempt = 0; attempt < 3; attempt++) {
          let ok = false;
          try {
            ok = await upsertGuess(apelido, id, g.a, g.b);
          } catch {
            ok = false;
          }
          if (ok) return "saved";
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          }
        }
        return "error";
      },

      toggleDesafio: (id) =>
        set((state) => {
          const next = { ...state.desafios };
          if (next[id]) { delete next[id]; } else { next[id] = true; }
          return { desafios: next };
        }),

      // Helper interno: retorna os cats do grupo (ou padrão se não personalizado)
      // Usado pelas actions abaixo

      setDesafioItem: (grupoId, catId, idx, text) =>
        set((s) => {
          const base = s.desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
          return {
            desafioCatsByGroup: {
              ...s.desafioCatsByGroup,
              [grupoId]: base.map((c) =>
                c.id === catId
                  ? { ...c, items: c.items.map((it, i) => (i === idx ? text : it)) }
                  : c
              ),
            },
          };
        }),

      addDesafioItem: (grupoId, catId) =>
        set((s) => {
          const base = s.desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
          return {
            desafioCatsByGroup: {
              ...s.desafioCatsByGroup,
              [grupoId]: base.map((c) =>
                c.id === catId ? { ...c, items: [...c.items, "Novo desafio"] } : c
              ),
            },
          };
        }),

      removeDesafioItem: (grupoId, catId, idx) =>
        set((s) => {
          const base = s.desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
          return {
            desafioCatsByGroup: {
              ...s.desafioCatsByGroup,
              [grupoId]: base.map((c) =>
                c.id === catId
                  ? { ...c, items: c.items.filter((_, i) => i !== idx) }
                  : c
              ),
            },
          };
        }),

      setDesafioPts: (grupoId, catId, pts) =>
        set((s) => {
          const base = s.desafioCatsByGroup[grupoId] ?? DEFAULT_CATS;
          return {
            desafioCatsByGroup: {
              ...s.desafioCatsByGroup,
              [grupoId]: base.map((c) =>
                c.id === catId ? { ...c, pts } : c
              ),
            },
          };
        }),

      resetDesafios: (grupoId) =>
        set((s) => {
          const next = { ...s.desafioCatsByGroup };
          delete next[grupoId];
          return { desafioCatsByGroup: next };
        }),

      // Supabase sync setters
      setParticipantes: (p) => set({ participantes: p }),
      setMatches: (m) => set({ matches: m }),
      setDailyDraw: (d) => set({ dailyDraw: d }),
      setMyChallengeDone: (v) => set({ myChallengeDone: v }),
      setChallengePts: (m) => set({ challengePts: m }),
      // Resultados oficiais (servidor autoritativo) também alimentam resultFix,
      // que é o que a aba Grupos e os pontos de previsão usam para calcular.
      setOfficialResults: (r) =>
        set((s) => ({ officialResults: r, resultFix: { ...s.resultFix, ...r } })),
      setMatchPts: (pts) => set({ matchPts: pts }),
      mergeGuesses: (g) =>
        set((s) => {
          // Servidor vence em jogos travados (resultado oficial lançado);
          // local vence onde há rascunho ainda não sincronizado
          const merged = { ...s.guesses };
          for (const [id, guess] of Object.entries(g)) {
            if (s.officialResults[id] || !merged[id]) merged[id] = guess;
          }
          return { guesses: merged };
        }),

      setGroupPrediction: (group, first, second) =>
        set((s) => {
          // Até o prazo, todos podem editar (mesmo já tendo salvo)
          if (arePredictionsLocked(s.groupPredictionsSaved)) return {};
          return {
            groupPredictions: { ...s.groupPredictions, [group]: { first, second } },
          };
        }),

      saveGroupPredictions: () => {
        const { currentUserApelido, groupPredictions } = get();
        if (currentUserApelido) {
          void upsertGroupPredictions(currentUserApelido, groupPredictions, true);
        }
        set({
          groupPredictionsSaved: true,
          groupPredictionsSavedAt: Date.now(),
        });
      },

      mergeGroupPredictions: (preds, saved) =>
        set((s) => {
          // Previsões travadas no servidor são autoritativas;
          // rascunhos locais vencem enquanto não houver trava
          if (saved) {
            return {
              groupPredictions: preds,
              groupPredictionsSaved: true,
              groupPredictionsSavedAt: s.groupPredictionsSavedAt ?? Date.now(),
            };
          }
          if (s.groupPredictionsSaved) return {};
          return { groupPredictions: { ...preds, ...s.groupPredictions } };
        }),

      addFeedEvent: (event) =>
        set((s) => ({
          feedEvents: [
            {
              ...event,
              id: Math.random().toString(36).slice(2, 12),
              timestamp: Date.now(),
            },
            ...s.feedEvents,
          ].slice(0, 200), // mantém os 200 mais recentes
        })),

      removeFeedEvent: (id) =>
        set((s) => ({ feedEvents: s.feedEvents.filter((e) => e.id !== id) })),

      clearFeed: () => set({ feedEvents: [] }),

      setDraw: (draw) => set({ draw }),

      markChallengeDone: (done) =>
        set((s) => s.draw ? { draw: { ...s.draw, done } } : {}),

      resolveChallenge: (record) =>
        set((s) => ({
          draw: null,
          challengeHistory: [record, ...s.challengeHistory].slice(0, 90), // guarda 90 dias
          totalChallengePoints: s.totalChallengePoints + record.pts,
        })),

      setEvidence: (id, dataUrl) =>
        set((state) => ({ evidence: { ...state.evidence, [id]: dataUrl } })),

      claimCombo: () =>
        set((state) => ({ comboBank: state.comboBank + 10, drawComboClaimed: true })),

      addPenalty: (n) => set((state) => ({ penalty: state.penalty + n })),

      clearDay: () =>
        set(() => ({ draw: null, evidence: {}, drawComboClaimed: false })),

      setAdminUnlocked: (v) => set({ adminUnlocked: v }),
      setAdminGrupo: (grupoId) => set({ adminGrupoId: grupoId }),

      setAdminDelta: (name, delta) =>
        set((state) => ({
          adminDelta: { ...state.adminDelta, [name]: (state.adminDelta[name] ?? 0) + delta },
        })),

      // Substitui todo o mapa (usado ao carregar do Supabase)
      setAdminDeltas: (m) => set({ adminDelta: m }),

      resetAdminDelta: (name) =>
        set((state) => {
          const next = { ...state.adminDelta };
          delete next[name];
          return { adminDelta: next };
        }),

      setBetFix: (id, score) =>
        set((state) => ({ betFix: { ...state.betFix, [id]: score } })),

      resetMatchPts: () => set({ matchPts: {} }),

      recalcAllMatchPts: (participantes, allGuesses) =>
        set((state) => ({
          matchPts: computeMatchPts(
            participantes.filter((p) => p.ativo),
            state.officialResults,
            allGuesses,
            state.matches,
            PENALTY_START_MS,
          ),
        })),

      saveResultAndCalcPts: (matchId, score, participantes, _grupoId, matchGuesses, matchPhase, isTraining = false) =>
        set((state) => {
          // Treinos NÃO calculam pontos — só salvam o resultado oficial
          if (isTraining) {
            return {
              resultFix: { ...state.resultFix, [matchId]: score },
              officialResults: { ...state.officialResults, [matchId]: score },
            };
          }

          const ativos = participantes.filter((p) => p.ativo);

          // Pontos de um participante para um placar: palpite real de cada
          // um (vindo do Supabase via loadAllGuesses); sem palpite = -3
          const ptsDe = (apelido: string, sc: { sa: number; sb: number }): number => {
            const g = matchGuesses[apelido];
            return g ? breakdown(sc, { a: g.a, b: g.b }, matchPhase).total : -3;
          };

          // Se já existe resultado anterior, estorna os pontos antigos antes de recalcular
          const newMatchPts = { ...state.matchPts };
          const prevScore = state.officialResults[matchId];

          for (const part of ativos) {
            const estorno = prevScore ? ptsDe(part.apelido, prevScore) : 0;
            newMatchPts[part.apelido] =
              (newMatchPts[part.apelido] ?? 0) - estorno + ptsDe(part.apelido, score);
          }

          return {
            resultFix: { ...state.resultFix, [matchId]: score },
            officialResults: { ...state.officialResults, [matchId]: score },
            matchPts: newMatchPts,
          };
        }),

      setResultFix: (id, score) =>
        set((state) => ({ resultFix: { ...state.resultFix, [id]: score } })),

      addParticipante: (data) => {
        const novo: Participante = {
          ...data,
          id: Math.random().toString(36).slice(2, 10),
          token: Math.random().toString(36).slice(2, 18),
          ativo: true,
        };
        set((s) => ({ participantes: [...s.participantes, novo] }));
        return novo;
      },

      updateParticipante: (id, data) =>
        set((s) => ({
          participantes: s.participantes.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      removeParticipante: (id) =>
        set((s) => ({ participantes: s.participantes.filter((p) => p.id !== id) })),

      toggleParticipanteAtivo: (id) =>
        set((s) => ({
          participantes: s.participantes.map((p) =>
            p.id === id ? { ...p, ativo: !p.ativo } : p
          ),
        })),

      migrateParticipantes: (grupoId) =>
        set((s) => ({
          participantes: s.participantes.map((p) =>
            (!p.grupoId || p.grupoId === "") ? { ...p, grupoId } : p
          ),
        })),

      // Limpa apenas os participantes do grupo informado
      clearGrupoData: (grupoId) =>
        set((s) => ({
          participantes: s.participantes.filter((p) => p.grupoId !== grupoId),
        })),
    }),
    {
      name: "bolao2026:v1",
      // adminUnlocked e adminGrupoId NÃO são persistidos (sessão)
      partialize: (state) => {
        // dados de servidor (matches/desafio diário) não são persistidos — vêm sempre fresh
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { adminUnlocked, adminGrupoId, matches, dailyDraw, myChallengeDone, challengePts, ...rest } = state;
        return rest;
      },
    }
  )
);
