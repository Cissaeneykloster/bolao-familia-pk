"use client";

import { useBolao } from "./store";
import { ADMINS } from "./mock-data";

/** Retorna o idioma do grupo ativo ("pt" ou "en") */
export function useLang(): "pt" | "en" {
  const { currentGrupoId } = useBolao();
  if (!currentGrupoId) return "pt";
  const cfg = ADMINS.find((a) => a.id === currentGrupoId);
  return cfg?.lang ?? "pt";
}

/** Tradução das strings principais da UI */
export const T = {
  pt: {
    ranking: "Ranking",
    jogos: "Jogos",
    palpites: "Palpites",
    grupos: "Grupos",
    desafios: "Desafios",
    feed: "Feed",
    regras: "Regras",
    semParticipantes: "Nenhum participante cadastrado ainda.",
    semGrupo: "Sem grupo",
    salvarPalpite: "💾 Salvar palpite",
    alterarPalpite: "✏️ Alterar palpite",
    encerrado: "ENCERRADO",
    aoVivo: "🔴 AO VIVO",
    treino: "🎯 TREINO",
    treinoEncerrado: "🎯 TREINO · ENCERRADO",
    apostas: "Apostas sempre abertas",
    apostasDesc: "Jogos de treino — apostas sempre abertas, não contam para o ranking.",
    apostar: "🎯 Apostar",
  },
  en: {
    ranking: "Ranking",
    jogos: "Matches",
    palpites: "Bets",
    grupos: "Groups",
    desafios: "Challenges",
    feed: "Feed",
    regras: "Rules",
    semParticipantes: "No participants registered yet.",
    semGrupo: "No group",
    salvarPalpite: "💾 Save bet",
    alterarPalpite: "✏️ Change bet",
    encerrado: "FINISHED",
    aoVivo: "🔴 LIVE",
    treino: "🎯 TRAINING",
    treinoEncerrado: "🎯 TRAINING · FINISHED",
    apostas: "Bets always open",
    apostasDesc: "Training matches — bets always open, do not count for ranking.",
    apostar: "🎯 Bet",
  },
} as const;
