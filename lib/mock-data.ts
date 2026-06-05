import type {
  Player, Match, ScoringRule, Group, FeedEvent,
  DesafioCat, Area, LockedBet,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────────
export function hoursFromNow(h: number): number {
  return Date.now() + h * 60 * 60 * 1000;
}

// ── Emojis de bandeiras ──────────────────────────────────────────
export const ENG: Record<string, string> = {
  BRA: "🇧🇷", ARG: "🇦🇷", ESP: "🇪🇸", CRC: "🇨🇷",
  FRA: "🇫🇷", ING: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", GER: "🇩🇪", POR: "🇵🇹",
  MEX: "🇲🇽", CAN: "🇨🇦", USA: "🇺🇸", JPN: "🇯🇵",
  KOR: "🇰🇷", AUS: "🇦🇺", DEN: "🇩🇰", IRN: "🇮🇷",
};

// ── Abreviações de área ──────────────────────────────────────────
export const AREA_SHORT: Record<Area, string> = {
  quarto:      "🛏️ Quarto",
  casa:        "🏠 Casa",
  servico:     "❤️ Serviço",
  intelectual: "📚 Intelectual",
  saude:       "💧 Saúde",
};

export const DAILY_AREAS: Area[] = ["quarto", "servico", "intelectual", "saude"];

// ── Grupos e admins ──────────────────────────────────────────────
export interface AdminConfig {
  id: string;       // identificador único do grupo
  usuario: string;  // login do admin
  senha: string;    // senha do admin
  nomeGrupo: string;// nome exibido no app
  emoji: string;    // emoji do grupo
}

export const ADMINS: AdminConfig[] = [
  { id: "pk",    usuario: "Admin", senha: "Lelo", nomeGrupo: "Família PK",    emoji: "⭐" },
  { id: "cissa", usuario: "Cissa", senha: "3015", nomeGrupo: "Grupo da Cissa", emoji: "🌟" },
];

// Helper: encontra admin pelo login
export function findAdmin(usuario: string, senha: string): AdminConfig | undefined {
  return ADMINS.find(
    (a) => a.usuario === usuario && a.senha === senha
  );
}

/** @deprecated usar ADMINS */
export const ADMIN_USER = ADMINS[0].usuario;
export const ADMIN_PASS = ADMINS[0].senha;
export const ADMIN_PIN  = "2026";

// ── Pontos do vencedor por fase mata-mata ────────────────────────
export const WINNER_PTS_BY_PHASE: Record<string, number> = {
  oitavas: 27,
  quartas: 37,
  semi:    47,
  terceiro: 47,
  final:   57,
};

// ── Prazo extra após kickoff (ms) ────────────────────────────────
export const EXTRA_MS_AFTER_KICKOFF = 5 * 60 * 1000; // 5 minutos

// ── Ranking — populado pelo admin via participantes ───────────────
// Começa vazio; o admin cadastra as pessoas reais pelo painel
export const RANKING: Player[] = [];

// ── Partidas ─────────────────────────────────────────────────────
export const MATCHES: Match[] = [
  {
    id: "m1", phase: "grupos", group: "Grupo A",
    a: { name: "Brasil",    flag: ENG.BRA },
    b: { name: "Argentina", flag: ENG.ARG },
    status: "finished", sa: 2, sb: 1,
    guess: { a: 2, b: 0 },
  },
  {
    id: "m2", phase: "grupos", group: "Grupo B",
    a: { name: "Espanha",    flag: ENG.ESP },
    b: { name: "Costa Rica", flag: ENG.CRC },
    status: "finished", sa: 3, sb: 0,
    guess: { a: 2, b: 0 },
  },
  {
    id: "m3", phase: "grupos", group: "Grupo C",
    a: { name: "França",     flag: ENG.FRA },
    b: { name: "Inglaterra", flag: ENG.ING },
    status: "live", sa: 1, sb: 1, minute: 47,
    guess: { a: 1, b: 1 },
  },
  {
    id: "m4", phase: "grupos", group: "Grupo D",
    a: { name: "Alemanha", flag: ENG.GER },
    b: { name: "Portugal", flag: ENG.POR },
    status: "upcoming", kickoff: hoursFromNow(14.5), label: "amanhã 15h",
  },
  {
    id: "m5", phase: "grupos", group: "Grupo E",
    a: { name: "México", flag: ENG.MEX },
    b: { name: "EUA",    flag: ENG.USA },
    status: "upcoming", kickoff: hoursFromNow(17.5), label: "amanhã 18h",
  },
  {
    id: "m6", phase: "grupos", group: "Grupo F",
    a: { name: "Japão",           flag: ENG.JPN },
    b: { name: "Coreia do Sul",   flag: ENG.KOR },
    status: "upcoming", kickoff: hoursFromNow(35), label: "depois de amanhã 09h",
  },
];

// ── Regras de pontuação ──────────────────────────────────────────
export const SCORING: ScoringRule[] = [
  { key: "exact",  label: "Placar exato",      pts: 10 },
  { key: "winner", label: "Vencedor",          pts: 5  },
  { key: "total",  label: "Total de gols",     pts: 3  },
  { key: "diff",   label: "Diferença de gols", pts: 3  },
  { key: "golsA",  label: "Gols time A",       pts: 2  },
  { key: "golsB",  label: "Gols time B",       pts: 2  },
];

// ── Grupos ───────────────────────────────────────────────────────
export const GROUPS: Group[] = [
  {
    name: "Grupo A",
    teams: [
      { name: "Brasil",    flag: ENG.BRA, j: 2, v: 2, e: 0, d: 0, sg: 4,  pts: 6 },
      { name: "Argentina", flag: ENG.ARG, j: 2, v: 1, e: 0, d: 1, sg: 1,  pts: 3 },
      { name: "México",    flag: ENG.MEX, j: 2, v: 0, e: 1, d: 1, sg: -1, pts: 1 },
      { name: "Canadá",    flag: ENG.CAN, j: 2, v: 0, e: 1, d: 1, sg: -4, pts: 1 },
    ],
    pred: { first: "Brasil", second: "Argentina" },
    predResult: "ok",
    predPts: 25,
    games: [{ t: "Brasil × Argentina" }, { t: "México × Canadá" }],
  },
  {
    name: "Grupo B",
    teams: [
      { name: "França",      flag: ENG.FRA, j: 2, v: 1, e: 1, d: 0, sg: 1,  pts: 4 },
      { name: "Inglaterra",  flag: ENG.ING, j: 2, v: 1, e: 1, d: 0, sg: 1,  pts: 4 },
      { name: "Austrália",   flag: ENG.AUS, j: 2, v: 0, e: 1, d: 1, sg: 0,  pts: 1 },
      { name: "Dinamarca",   flag: ENG.DEN, j: 2, v: 0, e: 1, d: 1, sg: -2, pts: 1 },
    ],
    pred: { first: "França", second: "Inglaterra" },
    predResult: "wait",
    predPts: 0,
    games: [{ t: "França × Inglaterra" }, { t: "Austrália × Dinamarca" }],
  },
  {
    name: "Grupo C",
    teams: [
      { name: "Alemanha", flag: ENG.GER, j: 1, v: 1, e: 0, d: 0, sg: 3,  pts: 3 },
      { name: "Portugal", flag: ENG.POR, j: 1, v: 0, e: 1, d: 0, sg: 0,  pts: 1 },
      { name: "Irã",      flag: ENG.IRN, j: 1, v: 0, e: 1, d: 0, sg: 0,  pts: 1 },
      { name: "Japão",    flag: ENG.JPN, j: 1, v: 0, e: 0, d: 1, sg: -3, pts: 0 },
    ],
    pred: { first: "Alemanha", second: "Portugal" },
    predResult: "wait",
    predPts: 0,
    games: [{ t: "Alemanha × Japão" }, { t: "Portugal × Irã" }],
  },
];

// ── Feed ─────────────────────────────────────────────────────────
export const FEED: FeedEvent[] = [
  {
    type: "exact", age: 2,
    body: "Rafael acertou o placar exato! Brasil 2×1 Argentina — subiu do 2º para o 1º lugar 🚀",
    pts: "+25 pts",
  },
  {
    type: "result", age: 5,
    body: "Resultado confirmado",
    score: { a: "Brasil", sa: 2, sb: 1, b: "Argentina" },
    stats: ["6 de 10 acertaram o vencedor", "2 de 10 acertaram o placar"],
  },
  {
    type: "winner", age: 12,
    body: "Marcos acertou o vencedor — Brasil × Argentina",
    pts: "+8 pts",
  },
  {
    type: "sent", age: 15,
    body: "Ana fez seu palpite em Brasil × Argentina",
  },
  {
    type: "result", age: 31,
    body: "Resultado confirmado",
    score: { a: "Espanha", sa: 3, sb: 0, b: "Costa Rica" },
    stats: ["8 de 10 acertaram o vencedor", "1 de 10 acertou o placar"],
  },
  {
    type: "winner", age: 33,
    body: "Carla acertou o vencedor — Espanha × Costa Rica",
    pts: "+5 pts",
  },
  {
    type: "sent", age: 44,
    body: "Pedro fez seu palpite em Alemanha × Portugal",
  },
  {
    type: "sent", age: 58,
    body: "Lucia fez seu palpite em México × EUA",
  },
];

export const LIVE_FEED_POOL: FeedEvent[] = [
  { type: "sent", age: 0, body: "João fez seu palpite em França × Inglaterra" },
  { type: "sent", age: 0, body: "Bruno fez seu palpite em Japão × Coreia do Sul" },
  { type: "winner", age: 0, body: "Marina acertou o vencedor — França × Inglaterra", pts: "+5 pts" },
];

// ── Desafios ──────────────────────────────────────────────────────
export const DESAFIO_CATS: DesafioCat[] = [
  {
    id: "quarto", icon: "🛏️", name: "Quarto", pts: 3,
    items: [
      "Arrumar a cama antes das 9h",
      "Organizar a roupa do dia anterior",
      "Limpar a mesa de cabeceira",
      "Varrer o quarto",
    ],
  },
  {
    id: "casa", icon: "🏠", name: "Casa", pts: 3,
    items: [
      "Lavar a louça",
      "Passar o pano na cozinha",
      "Tirar o lixo",
      "Arrumar a sala",
    ],
  },
  {
    id: "servico", icon: "❤️", name: "Ato de serviço", pts: 5,
    items: [
      "Ajudar alguém da família sem ser pedido",
      "Preparar o almoço ou jantar",
      "Fazer as compras do mercado",
      "Cuidar de uma criança por 1h",
    ],
  },
  {
    id: "intelectual", icon: "📚", name: "Intelectual", pts: 4,
    items: [
      "Ler por 20 minutos",
      "Assistir a uma aula ou palestra",
      "Escrever no diário",
      "Resolver um problema criativo",
    ],
  },
  {
    id: "saude", icon: "💧", name: "Saúde", pts: 3,
    items: [
      "Beber 2 litros de água",
      "Fazer 20 minutos de exercício",
      "Dormir antes de meia-noite",
      "Meditar por 10 minutos",
    ],
  },
];

// ── Palpites travados (admin) ────────────────────────────────────
export const LOCKED_BETS: LockedBet[] = [
  { id: "lb1", user: "Marcos",  initials: "MC", matchId: "m1", match: "Brasil × Argentina",  a: 1, b: 0 },
  { id: "lb2", user: "Carla",   initials: "CA", matchId: "m1", match: "Brasil × Argentina",  a: 2, b: 2 },
  { id: "lb3", user: "Pedro",   initials: "PE", matchId: "m2", match: "Espanha × Costa Rica", a: 3, b: 1 },
  { id: "lb4", user: "Ana",     initials: "AN", matchId: "m2", match: "Espanha × Costa Rica", a: 2, b: 0 },
  { id: "lb5", user: "João",    initials: "JO", matchId: "m3", match: "França × Inglaterra", a: 0, b: 1 },
  { id: "lb6", user: "Marina",  initials: "MR", matchId: "m3", match: "França × Inglaterra", a: 1, b: 1 },
];

// ── ME (alias para o jogador logado) ─────────────────────────────
export const ME = RANKING.find((p) => p.you)!;

// ── Tipo Participante (gerenciado pelo admin) ─────────────────────
export interface Participante {
  id: string;         // uuid simples
  grupoId: string;    // id do grupo (AdminConfig.id)
  nome: string;
  apelido: string;
  email: string;
  telefone: string;
  token: string;      // token de acesso único (gerado pelo admin)
  ativo: boolean;
}
