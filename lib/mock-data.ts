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
  lang?: "pt" | "en"; // idioma do grupo (padrão: pt)
}

export const ADMINS: AdminConfig[] = [
  { id: "pk",    usuario: "Ney",   senha: "3015", nomeGrupo: "Família PK",    emoji: "⭐", lang: "pt" },
  { id: "cissa", usuario: "Cissa", senha: "3015", nomeGrupo: "Grupo da Cissa", emoji: "🌟", lang: "pt" },
  { id: "pedro", usuario: "Pedro", senha: "3015", nomeGrupo: "Pedro's Group",  emoji: "🔵", lang: "en" },
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

// ── Helper: timestamp a partir de data/hora de Brasília (BRT = UTC-3) ─
function brt(date: string, h: number, m = 0): number {
  return new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00-03:00`).getTime();
}

// ── Flags extras ─────────────────────────────────────────────────
const F: Record<string, string> = {
  ...ENG,
  RSA: "🇿🇦", KOR2: "🇰🇷", CZE: "🇨🇿", BIH: "🇧🇦",
  QAT: "🇶🇦", SUI: "🇨🇭", HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  AUS: "🇦🇺", TUR: "🇹🇷", PAR: "🇵🇾", CUW: "🇨🇼",
  CIV: "🇨🇮", ECU: "🇪🇨", SWE: "🇸🇪", TUN: "🇹🇳",
  NED: "🇳🇱", BEL: "🇧🇪", EGY: "🇪🇬", IRN2: "🇮🇷",
  NZL: "🇳🇿", ESP: "🇪🇸", CPV: "🇨🇻", KSA: "🇸🇦",
  URU: "🇺🇾", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  POR: "🇵🇹", COD: "🇨🇩", UZB: "🇺🇿", COL: "🇨🇴",
  ENG2: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
  CAN: "🇨🇦", MEX: "🇲🇽", USA: "🇺🇸", CRO2: "🇭🇷",
  NOR2: "🇳🇴", ISL: "🇮🇸", SLO: "🇸🇮", NIR: "🇬🇧",
  PER: "🇵🇪", CHI: "🇨🇱",
};

// ── PARTIDAS — Amistosos de Treino (6–10/Jun) + Copa 2026 ─────────
export const MATCHES: Match[] = [

  // ══════════════════════════════════════════
  // AMISTOSOS DE TREINO (não fecham, não contam no ranking)
  // ══════════════════════════════════════════

  // 07/Jun — Sábado
  { id:"a1", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Croácia",  flag:F.CRO}, b:{name:"Eslovênia", flag:F.SLO},
    kickoff:brt("2026-06-07",11,45), label:"07/Jun 11h45" },

  { id:"a2", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Marrocos", flag:ENG.BRA.replace("🇧🇷","🇲🇦")}, b:{name:"Noruega", flag:F.NOR2},
    kickoff:brt("2026-06-07",13,0), label:"07/Jun 13h00" },

  { id:"a3", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Colômbia", flag:F.COL}, b:{name:"Jordânia", flag:F.JOR},
    kickoff:brt("2026-06-07",17,0), label:"07/Jun 17h00" },

  { id:"a4", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Equador",  flag:F.ECU}, b:{name:"Guatemala", flag:"🇬🇹"},
    kickoff:brt("2026-06-07",21,0), label:"07/Jun 21h00" },

  // 08/Jun — Domingo
  { id:"a5", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Holanda",  flag:F.NED}, b:{name:"Uzbequistão", flag:F.UZB},
    kickoff:brt("2026-06-08",12,45), label:"08/Jun 12h45" },

  { id:"a6", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"França",   flag:ENG.FRA}, b:{name:"Irlanda do Norte", flag:F.NIR},
    kickoff:brt("2026-06-08",16,10), label:"08/Jun 16h10" },

  { id:"a7", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Peru",     flag:F.PER}, b:{name:"Espanha",  flag:F.ESP},
    kickoff:brt("2026-06-08",21,0), label:"08/Jun 21h00" },

  // 09/Jun — Segunda
  { id:"a8", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Rep. Congo", flag:F.COD}, b:{name:"Chile", flag:F.CHI},
    kickoff:brt("2026-06-09",13,0), label:"09/Jun 13h00" },

  { id:"a9", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Arábia Saudita", flag:F.KSA}, b:{name:"Senegal", flag:F.SEN},
    kickoff:brt("2026-06-09",17,0), label:"09/Jun 17h00" },

  { id:"a10", phase:"amistoso", group:"Amistoso", training:true, status:"upcoming",
    a:{name:"Argentina", flag:ENG.ARG}, b:{name:"Islândia", flag:F.ISL},
    kickoff:brt("2026-06-09",21,30), label:"09/Jun 21h30" },

  // ══════════════════════════════════════════
  // COPA DO MUNDO 2026 — FASE DE GRUPOS
  // Horários de Brasília (BRT = UTC-3)
  // ══════════════════════════════════════════

  // ── GRUPO A: México, África do Sul, Coreia do Sul, Rep. Tcheca ──
  // Rodada 1
  { id:"ga1r1", phase:"grupos", group:"Grupo A", rodada:1, status:"upcoming",
    a:{name:"México",      flag:ENG.MEX}, b:{name:"África do Sul", flag:F.RSA},
    kickoff:brt("2026-06-11",16,0), label:"11/Jun 16h00" },

  { id:"ga2r1", phase:"grupos", group:"Grupo A", rodada:1, status:"upcoming",
    a:{name:"Coreia do Sul", flag:ENG.KOR}, b:{name:"Rep. Tcheca", flag:F.CZE},
    kickoff:brt("2026-06-11",23,0), label:"11/Jun 23h00" },

  // Rodada 2
  { id:"ga1r2", phase:"grupos", group:"Grupo A", rodada:2, status:"upcoming",
    a:{name:"Rep. Tcheca", flag:F.CZE}, b:{name:"África do Sul", flag:F.RSA},
    kickoff:brt("2026-06-18",13,0), label:"18/Jun 13h00" },

  { id:"ga2r2", phase:"grupos", group:"Grupo A", rodada:2, status:"upcoming",
    a:{name:"México",      flag:ENG.MEX}, b:{name:"Coreia do Sul", flag:ENG.KOR},
    kickoff:brt("2026-06-18",23,0), label:"18/Jun 23h00" },

  // Rodada 3 (simultâneos)
  { id:"ga1r3", phase:"grupos", group:"Grupo A", rodada:3, status:"upcoming",
    a:{name:"México",      flag:ENG.MEX}, b:{name:"Rep. Tcheca", flag:F.CZE},
    kickoff:brt("2026-06-22",22,0), label:"22/Jun 22h00" },

  { id:"ga2r3", phase:"grupos", group:"Grupo A", rodada:3, status:"upcoming",
    a:{name:"África do Sul", flag:F.RSA}, b:{name:"Coreia do Sul", flag:ENG.KOR},
    kickoff:brt("2026-06-22",22,0), label:"22/Jun 22h00" },

  // ── GRUPO B: Canadá, Bósnia-Herz., Qatar, Suíça ──
  // Rodada 1
  { id:"gb1r1", phase:"grupos", group:"Grupo B", rodada:1, status:"upcoming",
    a:{name:"Canadá",   flag:ENG.CAN}, b:{name:"Bósnia-Herz.", flag:F.BIH},
    kickoff:brt("2026-06-12",16,0), label:"12/Jun 16h00" },

  { id:"gb2r1", phase:"grupos", group:"Grupo B", rodada:1, status:"upcoming",
    a:{name:"Qatar",    flag:F.QAT},   b:{name:"Suíça",       flag:F.SUI},
    kickoff:brt("2026-06-13",16,0), label:"13/Jun 16h00" },

  // Rodada 2
  { id:"gb1r2", phase:"grupos", group:"Grupo B", rodada:2, status:"upcoming",
    a:{name:"Suíça",   flag:F.SUI},   b:{name:"Bósnia-Herz.", flag:F.BIH},
    kickoff:brt("2026-06-18",16,0), label:"18/Jun 16h00" },

  { id:"gb2r2", phase:"grupos", group:"Grupo B", rodada:2, status:"upcoming",
    a:{name:"Canadá",  flag:ENG.CAN}, b:{name:"Qatar",        flag:F.QAT},
    kickoff:brt("2026-06-18",19,0), label:"18/Jun 19h00" },

  // Rodada 3
  { id:"gb1r3", phase:"grupos", group:"Grupo B", rodada:3, status:"upcoming",
    a:{name:"Canadá",  flag:ENG.CAN}, b:{name:"Suíça",        flag:F.SUI},
    kickoff:brt("2026-06-22",19,0), label:"22/Jun 19h00" },

  { id:"gb2r3", phase:"grupos", group:"Grupo B", rodada:3, status:"upcoming",
    a:{name:"Bósnia-Herz.", flag:F.BIH}, b:{name:"Qatar",     flag:F.QAT},
    kickoff:brt("2026-06-22",19,0), label:"22/Jun 19h00" },

  // ── GRUPO C: Brasil 🇧🇷, Marrocos, Haiti, Escócia ──
  // Rodada 1
  { id:"gc1r1", phase:"grupos", group:"Grupo C", rodada:1, status:"upcoming",
    a:{name:"Brasil",   flag:ENG.BRA}, b:{name:"Marrocos", flag:"🇲🇦"},
    kickoff:brt("2026-06-13",19,0), label:"13/Jun 19h00 — MetLife/NJ" },

  { id:"gc2r1", phase:"grupos", group:"Grupo C", rodada:1, status:"upcoming",
    a:{name:"Haiti",    flag:F.HAI},   b:{name:"Escócia",  flag:F.SCO},
    kickoff:brt("2026-06-12",19,0), label:"12/Jun 19h00" },

  // Rodada 2
  { id:"gc1r2", phase:"grupos", group:"Grupo C", rodada:2, status:"upcoming",
    a:{name:"Brasil",   flag:ENG.BRA}, b:{name:"Haiti",    flag:F.HAI},
    kickoff:brt("2026-06-19",22,30), label:"19/Jun 22h30 — Filadélfia" },

  { id:"gc2r2", phase:"grupos", group:"Grupo C", rodada:2, status:"upcoming",
    a:{name:"Escócia",  flag:F.SCO},   b:{name:"Marrocos", flag:"🇲🇦"},
    kickoff:brt("2026-06-19",19,0), label:"19/Jun 19h00" },

  // Rodada 3
  { id:"gc1r3", phase:"grupos", group:"Grupo C", rodada:3, status:"upcoming",
    a:{name:"Brasil",   flag:ENG.BRA}, b:{name:"Escócia",  flag:F.SCO},
    kickoff:brt("2026-06-24",19,0), label:"24/Jun 19h00 — Hard Rock/Miami" },

  { id:"gc2r3", phase:"grupos", group:"Grupo C", rodada:3, status:"upcoming",
    a:{name:"Marrocos", flag:"🇲🇦"},   b:{name:"Haiti",    flag:F.HAI},
    kickoff:brt("2026-06-24",19,0), label:"24/Jun 19h00" },

  // ── GRUPO D: EUA, Paraguai, Austrália, Turquia ──
  // Rodada 1
  { id:"gd1r1", phase:"grupos", group:"Grupo D", rodada:1, status:"upcoming",
    a:{name:"EUA",       flag:ENG.USA}, b:{name:"Paraguai",  flag:F.PAR},
    kickoff:brt("2026-06-12",22,0), label:"12/Jun 22h00" },

  { id:"gd2r1", phase:"grupos", group:"Grupo D", rodada:1, status:"upcoming",
    a:{name:"Austrália", flag:F.AUS},  b:{name:"Turquia",   flag:F.TUR},
    kickoff:brt("2026-06-13",13,0), label:"13/Jun 13h00" },

  // Rodada 2
  { id:"gd1r2", phase:"grupos", group:"Grupo D", rodada:2, status:"upcoming",
    a:{name:"EUA",       flag:ENG.USA}, b:{name:"Austrália", flag:F.AUS},
    kickoff:brt("2026-06-19",16,0), label:"19/Jun 16h00" },

  { id:"gd2r2", phase:"grupos", group:"Grupo D", rodada:2, status:"upcoming",
    a:{name:"Turquia",  flag:F.TUR},  b:{name:"Paraguai",  flag:F.PAR},
    kickoff:brt("2026-06-19",22,0), label:"19/Jun 22h00" },

  // Rodada 3
  { id:"gd1r3", phase:"grupos", group:"Grupo D", rodada:3, status:"upcoming",
    a:{name:"EUA",       flag:ENG.USA}, b:{name:"Turquia",   flag:F.TUR},
    kickoff:brt("2026-06-23",22,0), label:"23/Jun 22h00" },

  { id:"gd2r3", phase:"grupos", group:"Grupo D", rodada:3, status:"upcoming",
    a:{name:"Paraguai", flag:F.PAR},  b:{name:"Austrália", flag:F.AUS},
    kickoff:brt("2026-06-23",22,0), label:"23/Jun 22h00" },

  // ── GRUPO E: Alemanha, Curaçao, Costa do Marfim, Equador ──
  // Rodada 1
  { id:"ge1r1", phase:"grupos", group:"Grupo E", rodada:1, status:"upcoming",
    a:{name:"Alemanha",  flag:ENG.GER}, b:{name:"Curaçao",   flag:F.CUW},
    kickoff:brt("2026-06-14",14,0), label:"14/Jun 14h00" },

  { id:"ge2r1", phase:"grupos", group:"Grupo E", rodada:1, status:"upcoming",
    a:{name:"C. do Marfim", flag:F.CIV}, b:{name:"Equador", flag:F.ECU},
    kickoff:brt("2026-06-14",20,0), label:"14/Jun 20h00" },

  // Rodada 2
  { id:"ge1r2", phase:"grupos", group:"Grupo E", rodada:2, status:"upcoming",
    a:{name:"Alemanha",    flag:ENG.GER}, b:{name:"C. do Marfim", flag:F.CIV},
    kickoff:brt("2026-06-20",16,0), label:"20/Jun 16h00" },

  { id:"ge2r2", phase:"grupos", group:"Grupo E", rodada:2, status:"upcoming",
    a:{name:"Equador",  flag:F.ECU},   b:{name:"Curaçao",     flag:F.CUW},
    kickoff:brt("2026-06-20",19,0), label:"20/Jun 19h00" },

  // Rodada 3
  { id:"ge1r3", phase:"grupos", group:"Grupo E", rodada:3, status:"upcoming",
    a:{name:"Alemanha",    flag:ENG.GER}, b:{name:"Equador",       flag:F.ECU},
    kickoff:brt("2026-06-25",16,0), label:"25/Jun 16h00" },

  { id:"ge2r3", phase:"grupos", group:"Grupo E", rodada:3, status:"upcoming",
    a:{name:"Curaçao",  flag:F.CUW},  b:{name:"C. do Marfim",  flag:F.CIV},
    kickoff:brt("2026-06-25",16,0), label:"25/Jun 16h00" },

  // ── GRUPO F: Holanda, Japão, Suécia, Tunísia ──
  // Rodada 1
  { id:"gf1r1", phase:"grupos", group:"Grupo F", rodada:1, status:"upcoming",
    a:{name:"Holanda",  flag:F.NED},  b:{name:"Japão",   flag:ENG.JPN},
    kickoff:brt("2026-06-14",17,0), label:"14/Jun 17h00" },

  { id:"gf2r1", phase:"grupos", group:"Grupo F", rodada:1, status:"upcoming",
    a:{name:"Suécia",   flag:F.SWE},  b:{name:"Tunísia", flag:F.TUN},
    kickoff:brt("2026-06-14",23,0), label:"14/Jun 23h00" },

  // Rodada 2
  { id:"gf1r2", phase:"grupos", group:"Grupo F", rodada:2, status:"upcoming",
    a:{name:"Holanda",  flag:F.NED},  b:{name:"Suécia",  flag:F.SWE},
    kickoff:brt("2026-06-20",22,0), label:"20/Jun 22h00" },

  { id:"gf2r2", phase:"grupos", group:"Grupo F", rodada:2, status:"upcoming",
    a:{name:"Japão",    flag:ENG.JPN}, b:{name:"Tunísia", flag:F.TUN},
    kickoff:brt("2026-06-21",13,0), label:"21/Jun 13h00" },

  // Rodada 3
  { id:"gf1r3", phase:"grupos", group:"Grupo F", rodada:3, status:"upcoming",
    a:{name:"Holanda",  flag:F.NED},  b:{name:"Tunísia", flag:F.TUN},
    kickoff:brt("2026-06-25",22,0), label:"25/Jun 22h00" },

  { id:"gf2r3", phase:"grupos", group:"Grupo F", rodada:3, status:"upcoming",
    a:{name:"Japão",    flag:ENG.JPN}, b:{name:"Suécia",  flag:F.SWE},
    kickoff:brt("2026-06-25",22,0), label:"25/Jun 22h00" },

  // ── GRUPO G: Bélgica, Egito, Irã, Nova Zelândia ──
  // Rodada 1
  { id:"gg1r1", phase:"grupos", group:"Grupo G", rodada:1, status:"upcoming",
    a:{name:"Bélgica",      flag:F.BEL},  b:{name:"Egito",        flag:F.EGY},
    kickoff:brt("2026-06-15",19,0), label:"15/Jun 19h00" },

  { id:"gg2r1", phase:"grupos", group:"Grupo G", rodada:1, status:"upcoming",
    a:{name:"Irã",          flag:ENG.IRN}, b:{name:"Nova Zelândia", flag:F.NZL},
    kickoff:brt("2026-06-16",1,0), label:"16/Jun 01h00" },

  // Rodada 2
  { id:"gg1r2", phase:"grupos", group:"Grupo G", rodada:2, status:"upcoming",
    a:{name:"Bélgica",      flag:F.BEL},  b:{name:"Irã",           flag:ENG.IRN},
    kickoff:brt("2026-06-21",16,0), label:"21/Jun 16h00" },

  { id:"gg2r2", phase:"grupos", group:"Grupo G", rodada:2, status:"upcoming",
    a:{name:"Nova Zelândia", flag:F.NZL}, b:{name:"Egito",          flag:F.EGY},
    kickoff:brt("2026-06-21",19,0), label:"21/Jun 19h00" },

  // Rodada 3
  { id:"gg1r3", phase:"grupos", group:"Grupo G", rodada:3, status:"upcoming",
    a:{name:"Bélgica",      flag:F.BEL},  b:{name:"Nova Zelândia", flag:F.NZL},
    kickoff:brt("2026-06-26",16,0), label:"26/Jun 16h00" },

  { id:"gg2r3", phase:"grupos", group:"Grupo G", rodada:3, status:"upcoming",
    a:{name:"Egito",        flag:F.EGY},  b:{name:"Irã",           flag:ENG.IRN},
    kickoff:brt("2026-06-26",16,0), label:"26/Jun 16h00" },

  // ── GRUPO H: Espanha, Cabo Verde, Arábia Saudita, Uruguai ──
  // Rodada 1
  { id:"gh1r1", phase:"grupos", group:"Grupo H", rodada:1, status:"upcoming",
    a:{name:"Espanha",       flag:F.ESP},  b:{name:"Cabo Verde",     flag:F.CPV},
    kickoff:brt("2026-06-15",14,0), label:"15/Jun 14h00" },

  { id:"gh2r1", phase:"grupos", group:"Grupo H", rodada:1, status:"upcoming",
    a:{name:"Arábia Saudita", flag:F.KSA}, b:{name:"Uruguai",        flag:F.URU},
    kickoff:brt("2026-06-15",19,0), label:"15/Jun 19h00" },

  // Rodada 2
  { id:"gh1r2", phase:"grupos", group:"Grupo H", rodada:2, status:"upcoming",
    a:{name:"Espanha",       flag:F.ESP},  b:{name:"Arábia Saudita", flag:F.KSA},
    kickoff:brt("2026-06-22",13,0), label:"22/Jun 13h00" },

  { id:"gh2r2", phase:"grupos", group:"Grupo H", rodada:2, status:"upcoming",
    a:{name:"Uruguai",       flag:F.URU},  b:{name:"Cabo Verde",      flag:F.CPV},
    kickoff:brt("2026-06-22",16,0), label:"22/Jun 16h00" },

  // Rodada 3
  { id:"gh1r3", phase:"grupos", group:"Grupo H", rodada:3, status:"upcoming",
    a:{name:"Espanha",       flag:F.ESP},  b:{name:"Uruguai",         flag:F.URU},
    kickoff:brt("2026-06-26",22,0), label:"26/Jun 22h00" },

  { id:"gh2r3", phase:"grupos", group:"Grupo H", rodada:3, status:"upcoming",
    a:{name:"Cabo Verde",    flag:F.CPV},  b:{name:"Arábia Saudita",  flag:F.KSA},
    kickoff:brt("2026-06-26",22,0), label:"26/Jun 22h00" },

  // ── GRUPO I: França, Senegal, Iraque, Noruega ──
  // Rodada 1
  { id:"gi1r1", phase:"grupos", group:"Grupo I", rodada:1, status:"upcoming",
    a:{name:"França",   flag:ENG.FRA}, b:{name:"Senegal", flag:F.SEN},
    kickoff:brt("2026-06-16",16,0), label:"16/Jun 16h00" },

  { id:"gi2r1", phase:"grupos", group:"Grupo I", rodada:1, status:"upcoming",
    a:{name:"Iraque",   flag:F.IRQ},   b:{name:"Noruega", flag:F.NOR},
    kickoff:brt("2026-06-16",19,0), label:"16/Jun 19h00" },

  // Rodada 2
  { id:"gi1r2", phase:"grupos", group:"Grupo I", rodada:2, status:"upcoming",
    a:{name:"França",   flag:ENG.FRA}, b:{name:"Iraque",  flag:F.IRQ},
    kickoff:brt("2026-06-21",22,0), label:"21/Jun 22h00" },

  { id:"gi2r2", phase:"grupos", group:"Grupo I", rodada:2, status:"upcoming",
    a:{name:"Noruega",  flag:F.NOR},   b:{name:"Senegal", flag:F.SEN},
    kickoff:brt("2026-06-22",1,0), label:"22/Jun 01h00" },

  // Rodada 3
  { id:"gi1r3", phase:"grupos", group:"Grupo I", rodada:3, status:"upcoming",
    a:{name:"França",   flag:ENG.FRA}, b:{name:"Noruega", flag:F.NOR},
    kickoff:brt("2026-06-27",16,0), label:"27/Jun 16h00" },

  { id:"gi2r3", phase:"grupos", group:"Grupo I", rodada:3, status:"upcoming",
    a:{name:"Senegal",  flag:F.SEN},   b:{name:"Iraque",  flag:F.IRQ},
    kickoff:brt("2026-06-27",16,0), label:"27/Jun 16h00" },

  // ── GRUPO J: Argentina, Argélia, Áustria, Jordânia ──
  // Rodada 1
  { id:"gj1r1", phase:"grupos", group:"Grupo J", rodada:1, status:"upcoming",
    a:{name:"Argentina", flag:ENG.ARG}, b:{name:"Argélia",  flag:F.ALG},
    kickoff:brt("2026-06-16",22,0), label:"16/Jun 22h00" },

  { id:"gj2r1", phase:"grupos", group:"Grupo J", rodada:1, status:"upcoming",
    a:{name:"Áustria",   flag:F.AUT},   b:{name:"Jordânia", flag:F.JOR},
    kickoff:brt("2026-06-17",13,0), label:"17/Jun 13h00" },

  // Rodada 2
  { id:"gj1r2", phase:"grupos", group:"Grupo J", rodada:2, status:"upcoming",
    a:{name:"Argentina", flag:ENG.ARG}, b:{name:"Áustria",  flag:F.AUT},
    kickoff:brt("2026-06-23",13,0), label:"23/Jun 13h00" },

  { id:"gj2r2", phase:"grupos", group:"Grupo J", rodada:2, status:"upcoming",
    a:{name:"Jordânia",  flag:F.JOR},   b:{name:"Argélia",  flag:F.ALG},
    kickoff:brt("2026-06-23",16,0), label:"23/Jun 16h00" },

  // Rodada 3
  { id:"gj1r3", phase:"grupos", group:"Grupo J", rodada:3, status:"upcoming",
    a:{name:"Argentina", flag:ENG.ARG}, b:{name:"Jordânia", flag:F.JOR},
    kickoff:brt("2026-06-27",22,0), label:"27/Jun 22h00" },

  { id:"gj2r3", phase:"grupos", group:"Grupo J", rodada:3, status:"upcoming",
    a:{name:"Argélia",   flag:F.ALG},   b:{name:"Áustria",  flag:F.AUT},
    kickoff:brt("2026-06-27",22,0), label:"27/Jun 22h00" },

  // ── GRUPO K: Portugal, Rep. Congo, Uzbequistão, Colômbia ──
  // Rodada 1
  { id:"gk1r1", phase:"grupos", group:"Grupo K", rodada:1, status:"upcoming",
    a:{name:"Portugal",     flag:ENG.POR}, b:{name:"Rep. Congo", flag:F.COD},
    kickoff:brt("2026-06-17",14,0), label:"17/Jun 14h00" },

  { id:"gk2r1", phase:"grupos", group:"Grupo K", rodada:1, status:"upcoming",
    a:{name:"Uzbequistão",  flag:F.UZB},   b:{name:"Colômbia",  flag:F.COL},
    kickoff:brt("2026-06-17",23,0), label:"17/Jun 23h00" },

  // Rodada 2
  { id:"gk1r2", phase:"grupos", group:"Grupo K", rodada:2, status:"upcoming",
    a:{name:"Portugal",     flag:ENG.POR}, b:{name:"Uzbequistão", flag:F.UZB},
    kickoff:brt("2026-06-23",19,0), label:"23/Jun 19h00" },

  { id:"gk2r2", phase:"grupos", group:"Grupo K", rodada:2, status:"upcoming",
    a:{name:"Colômbia",    flag:F.COL},   b:{name:"Rep. Congo",  flag:F.COD},
    kickoff:brt("2026-06-24",13,0), label:"24/Jun 13h00" },

  // Rodada 3
  { id:"gk1r3", phase:"grupos", group:"Grupo K", rodada:3, status:"upcoming",
    a:{name:"Portugal",     flag:ENG.POR}, b:{name:"Colômbia",   flag:F.COL},
    kickoff:brt("2026-06-28",19,0), label:"28/Jun 19h00" },

  { id:"gk2r3", phase:"grupos", group:"Grupo K", rodada:3, status:"upcoming",
    a:{name:"Rep. Congo",  flag:F.COD},   b:{name:"Uzbequistão", flag:F.UZB},
    kickoff:brt("2026-06-28",19,0), label:"28/Jun 19h00" },

  // ── GRUPO L: Inglaterra, Croácia, Gana, Panamá ──
  // Rodada 1
  { id:"gl1r1", phase:"grupos", group:"Grupo L", rodada:1, status:"upcoming",
    a:{name:"Inglaterra",  flag:ENG.ING}, b:{name:"Croácia",  flag:F.CRO},
    kickoff:brt("2026-06-17",17,0), label:"17/Jun 17h00" },

  { id:"gl2r1", phase:"grupos", group:"Grupo L", rodada:1, status:"upcoming",
    a:{name:"Gana",        flag:F.GHA},   b:{name:"Panamá",   flag:F.PAN},
    kickoff:brt("2026-06-17",20,0), label:"17/Jun 20h00" },

  // Rodada 2
  { id:"gl1r2", phase:"grupos", group:"Grupo L", rodada:2, status:"upcoming",
    a:{name:"Inglaterra",  flag:ENG.ING}, b:{name:"Gana",     flag:F.GHA},
    kickoff:brt("2026-06-24",16,0), label:"24/Jun 16h00" },

  { id:"gl2r2", phase:"grupos", group:"Grupo L", rodada:2, status:"upcoming",
    a:{name:"Croácia",    flag:F.CRO},   b:{name:"Panamá",   flag:F.PAN},
    kickoff:brt("2026-06-24",22,0), label:"24/Jun 22h00" },

  // Rodada 3
  { id:"gl1r3", phase:"grupos", group:"Grupo L", rodada:3, status:"upcoming",
    a:{name:"Inglaterra",  flag:ENG.ING}, b:{name:"Panamá",   flag:F.PAN},
    kickoff:brt("2026-06-28",22,0), label:"28/Jun 22h00" },

  { id:"gl2r3", phase:"grupos", group:"Grupo L", rodada:3, status:"upcoming",
    a:{name:"Croácia",    flag:F.CRO},   b:{name:"Gana",     flag:F.GHA},
    kickoff:brt("2026-06-28",22,0), label:"28/Jun 22h00" },
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

// ── Desafios padrão em inglês (para grupos com lang="en") ─────────
export const DESAFIO_CATS_EN: DesafioCat[] = [
  {
    id: "quarto", icon: "🛏️", name: "Bedroom", pts: 3,
    items: [
      "Make the bed before 9am",
      "Organize yesterday's clothes",
      "Clean the bedside table",
      "Sweep/vacuum the bedroom",
    ],
  },
  {
    id: "casa", icon: "🏠", name: "Home", pts: 3,
    items: [
      "Wash the dishes",
      "Clean the kitchen",
      "Take out the trash",
      "Tidy up the living room",
    ],
  },
  {
    id: "servico", icon: "❤️", name: "Act of Service", pts: 5,
    items: [
      "Help a family member without being asked",
      "Prepare lunch or dinner",
      "Do the grocery shopping",
      "Take care of a child for 1 hour",
    ],
  },
  {
    id: "intelectual", icon: "📚", name: "Intellectual", pts: 4,
    items: [
      "Read for 20 minutes",
      "Watch a class or lecture",
      "Write in your journal",
      "Solve a creative problem",
    ],
  },
  {
    id: "saude", icon: "💧", name: "Health", pts: 3,
    items: [
      "Drink 2 liters of water",
      "Exercise for 20 minutes",
      "Sleep before midnight",
      "Meditate for 10 minutes",
    ],
  },
];

// ── Times base de cada grupo (zerado — calculado dinamicamente) ────
function z(name: string, flag: string): import("./types").GroupTeam {
  return { name, flag, j: 0, v: 0, e: 0, d: 0, sg: 0, pts: 0 };
}

// ── Grupos da Copa 2026 (todos os 12) — começam zerados ───────────
export const GROUPS: Group[] = [
  {
    name: "Grupo A",
    teams: [
      z("México",        ENG.MEX),
      z("África do Sul", F.RSA),
      z("Coreia do Sul", ENG.KOR),
      z("Rep. Tcheca",   F.CZE),
    ],
    pred: { first: "México", second: "Coreia do Sul" },
    predResult: "wait", predPts: 0,
    games: [{ t: "México × África do Sul" }, { t: "Coreia do Sul × Rep. Tcheca" }],
  },
  {
    name: "Grupo B",
    teams: [
      z("Canadá",       ENG.CAN),
      z("Bósnia-Herz.", F.BIH),
      z("Qatar",        F.QAT),
      z("Suíça",        F.SUI),
    ],
    pred: { first: "Canadá", second: "Suíça" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Canadá × Bósnia-Herz." }, { t: "Qatar × Suíça" }],
  },
  {
    name: "Grupo C",
    teams: [
      z("Brasil",   ENG.BRA),
      z("Marrocos", "🇲🇦"),
      z("Haiti",    F.HAI),
      z("Escócia",  F.SCO),
    ],
    pred: { first: "Brasil", second: "Marrocos" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Brasil × Marrocos" }, { t: "Haiti × Escócia" }],
  },
  {
    name: "Grupo D",
    teams: [
      z("EUA",       ENG.USA),
      z("Paraguai",  F.PAR),
      z("Austrália", F.AUS),
      z("Turquia",   F.TUR),
    ],
    pred: { first: "EUA", second: "Turquia" },
    predResult: "wait", predPts: 0,
    games: [{ t: "EUA × Paraguai" }, { t: "Austrália × Turquia" }],
  },
  {
    name: "Grupo E",
    teams: [
      z("Alemanha",      ENG.GER),
      z("Curaçao",       F.CUW),
      z("C. do Marfim",  F.CIV),
      z("Equador",       F.ECU),
    ],
    pred: { first: "Alemanha", second: "Equador" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Alemanha × Curaçao" }, { t: "C. do Marfim × Equador" }],
  },
  {
    name: "Grupo F",
    teams: [
      z("Holanda",  F.NED),
      z("Japão",    ENG.JPN),
      z("Suécia",   F.SWE),
      z("Tunísia",  F.TUN),
    ],
    pred: { first: "Holanda", second: "Japão" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Holanda × Japão" }, { t: "Suécia × Tunísia" }],
  },
  {
    name: "Grupo G",
    teams: [
      z("Bélgica",      F.BEL),
      z("Egito",        F.EGY),
      z("Irã",          ENG.IRN),
      z("Nova Zelândia", F.NZL),
    ],
    pred: { first: "Bélgica", second: "Irã" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Bélgica × Egito" }, { t: "Irã × Nova Zelândia" }],
  },
  {
    name: "Grupo H",
    teams: [
      z("Espanha",        F.ESP),
      z("Cabo Verde",     F.CPV),
      z("Arábia Saudita", F.KSA),
      z("Uruguai",        F.URU),
    ],
    pred: { first: "Espanha", second: "Uruguai" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Espanha × Cabo Verde" }, { t: "Arábia Saudita × Uruguai" }],
  },
  {
    name: "Grupo I",
    teams: [
      z("França",   ENG.FRA),
      z("Senegal",  F.SEN),
      z("Iraque",   F.IRQ),
      z("Noruega",  F.NOR),
    ],
    pred: { first: "França", second: "Noruega" },
    predResult: "wait", predPts: 0,
    games: [{ t: "França × Senegal" }, { t: "Iraque × Noruega" }],
  },
  {
    name: "Grupo J",
    teams: [
      z("Argentina", ENG.ARG),
      z("Argélia",   F.ALG),
      z("Áustria",   F.AUT),
      z("Jordânia",  F.JOR),
    ],
    pred: { first: "Argentina", second: "Áustria" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Argentina × Argélia" }, { t: "Áustria × Jordânia" }],
  },
  {
    name: "Grupo K",
    teams: [
      z("Portugal",     ENG.POR),
      z("Rep. Congo",   F.COD),
      z("Uzbequistão",  F.UZB),
      z("Colômbia",     F.COL),
    ],
    pred: { first: "Portugal", second: "Colômbia" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Portugal × Rep. Congo" }, { t: "Uzbequistão × Colômbia" }],
  },
  {
    name: "Grupo L",
    teams: [
      z("Inglaterra", ENG.ING),
      z("Croácia",    F.CRO),
      z("Gana",       F.GHA),
      z("Panamá",     F.PAN),
    ],
    pred: { first: "Inglaterra", second: "Croácia" },
    predResult: "wait", predPts: 0,
    games: [{ t: "Inglaterra × Croácia" }, { t: "Gana × Panamá" }],
  },
];

// ── Feed ─────────────────────────────────────────────────────────
// Feed começa vazio — eventos são gerados automaticamente pelas ações
export const FEED: FeedEvent[] = [];

export const LIVE_FEED_POOL: Omit<FeedEvent, "id" | "timestamp">[] = [
  { type: "sent", body: "João fez seu palpite em França × Inglaterra" },
  { type: "sent", body: "Bruno fez seu palpite em Japão × Coreia do Sul" },
  { type: "winner", body: "Marina acertou o vencedor — França × Inglaterra", pts: "+5 pts" },
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
