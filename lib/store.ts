"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Draw, ChallengeRecord, FeedEvent } from "./types";
import type { Participante } from "./mock-data";

// ── Tipos do estado ───────────────────────────────────────────────

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

  // Admin — sessão (NÃO persistida)
  adminUnlocked: boolean;
  adminGrupoId: string | null;   // grupo do admin logado (sessão)

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
  setCurrentGrupo: (id: string | null) => void;
  setCurrentUserApelido: (apelido: string | null) => void;

  setGuess: (id: string, side: "a" | "b", dir: 1 | -1) => void;
  saveGuess: (id: string) => void;

  // Previsão dos grupos
  setGroupPrediction: (group: string, first: string, second: string) => void;
  saveGroupPredictions: () => void;

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

  setAdminUnlocked: (v: boolean) => void;
  setAdminGrupo: (grupoId: string | null) => void;
  setAdminDelta: (name: string, delta: number) => void;
  resetAdminDelta: (name: string) => void;
  setBetFix: (id: string, score: { a: number; b: number }) => void;
  setResultFix: (id: string, score: { sa: number; sb: number }) => void;

  // Participantes — scoped por grupo
  addParticipante: (p: Omit<Participante, "id" | "token" | "ativo">) => Participante;
  removeParticipante: (id: string) => void;
  toggleParticipanteAtivo: (id: string) => void;
  clearGrupoData: (grupoId: string) => void;
}

// ── Valores iniciais ──────────────────────────────────────────────

const initialState = {
  theme: "dark" as const,
  podium: "a" as const,
  card: "a" as const,
  palpite: "a" as const,
  sound: true,
  live: true,
  current: "ranking" as Screen,
  currentGrupoId: null as string | null,
  currentUserApelido: null as string | null,

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
    (set) => ({
      ...initialState,

      setStyle: (group, val) => set({ [group]: val }),
      setTheme: (t) => set({ theme: t }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleLive: () => set((s) => ({ live: !s.live })),
      setScreen: (s) => set({ current: s }),
      setCurrentGrupo: (id) => set({ currentGrupoId: id }),
      setCurrentUserApelido: (apelido) => set({ currentUserApelido: apelido }),

      setGuess: (id, side, dir) =>
        set((state) => {
          const prev = state.guesses[id] ?? { a: 0, b: 0 };
          const next = Math.min(20, Math.max(0, prev[side] + dir));
          return { guesses: { ...state.guesses, [id]: { ...prev, [side]: next } } };
        }),

      saveGuess: (id) => {
        void id;
        set((state) => ({ guesses: { ...state.guesses } }));
      },

      toggleDesafio: (id) =>
        set((state) => {
          const next = { ...state.desafios };
          if (next[id]) { delete next[id]; } else { next[id] = true; }
          return { desafios: next };
        }),

      setGroupPrediction: (group, first, second) =>
        set((s) => {
          if (s.groupPredictionsSaved) return {}; // já travado
          return {
            groupPredictions: { ...s.groupPredictions, [group]: { first, second } },
          };
        }),

      saveGroupPredictions: () =>
        set(() => ({
          groupPredictionsSaved: true,
          groupPredictionsSavedAt: Date.now(),
        })),

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

      resetAdminDelta: (name) =>
        set((state) => {
          const next = { ...state.adminDelta };
          delete next[name];
          return { adminDelta: next };
        }),

      setBetFix: (id, score) =>
        set((state) => ({ betFix: { ...state.betFix, [id]: score } })),

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

      removeParticipante: (id) =>
        set((s) => ({ participantes: s.participantes.filter((p) => p.id !== id) })),

      toggleParticipanteAtivo: (id) =>
        set((s) => ({
          participantes: s.participantes.map((p) =>
            p.id === id ? { ...p, ativo: !p.ativo } : p
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { adminUnlocked, adminGrupoId, ...rest } = state;
        return rest;
      },
    }
  )
);
