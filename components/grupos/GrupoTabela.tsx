"use client";

import { useState } from "react";
import type { Group, GroupTeam } from "@/lib/types";
import { useBolao } from "@/lib/store";
import { MATCHES } from "@/lib/mock-data";
import { calcGroupStandings } from "@/lib/standings";
import { useLang, T, countryName } from "@/lib/useLang";

// ── Sub-componente: sua previsão de classificação ──────────────────
function SuaPrevisao({ groupName, standings }: { groupName: string; standings: GroupTeam[] }) {
  const { groupPredictions, groupPredictionsSaved } = useBolao();
  const lang = useLang();
  const t = T[lang];
  const pred = groupPredictions[groupName];
  if (!pred?.first && !pred?.second) return null;

  const classified = standings.slice(0, 2).map((t) => t.name);
  const jogosEncerrados = standings.some((t) => t.j > 0);

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
      <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {t.suaPrevisao}
      </p>
      {[
        { label: "🥇 1º", name: pred.first },
        { label: "🥈 2º", name: pred.second },
      ].map(({ label, name }) => {
        const acertou = jogosEncerrados && classified.includes(name);
        const errou = jogosEncerrados && !classified.includes(name) && classified.length === 2;
        return (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--text)" }}>{label} — {countryName(name, lang) || "—"}</span>
            {acertou
              ? <span style={{ color: "var(--ok)", fontWeight: 700 }}>✅ +10 pts</span>
              : errou
              ? <span style={{ color: "var(--danger)" }}>❌ +0</span>
              : <span style={{ color: "var(--muted)" }}>{t.emAberto}</span>
            }
          </div>
        );
      })}
      {!groupPredictionsSaved && (
        <p style={{ fontSize: 11, color: "var(--warn)", marginTop: 4, fontStyle: "italic" }}>
          {t.previsaoNaoTravada}
        </p>
      )}
    </div>
  );
}

interface GrupoTabelaProps {
  group: Group;
}

export function GrupoTabela({ group }: GrupoTabelaProps) {
  const [open, setOpen] = useState(false);
  const { resultFix } = useBolao();
  const lang = useLang();
  const t = T[lang];

  // Classificação calculada dinamicamente a partir dos resultados reais
  const standings = calcGroupStandings(group, MATCHES, resultFix);
  const jogosEncerrados = MATCHES.filter(
    (m) => m.group === group.name && m.phase === "grupos" && m.status === "finished"
  ).length;
  const totalJogos = MATCHES.filter(
    (m) => m.group === group.name && m.phase === "grupos"
  ).length;

  return (
    <div style={{
      background: "var(--card)",
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      {/* Cabeçalho clicável */}
      <button
        aria-label={group.name}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          borderBottom: open ? "1px solid var(--border)" : "none",
        }}
      >
        <div>
          <span className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", letterSpacing: 1 }}>
            {group.name}
          </span>
          <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>
            {jogosEncerrados > 0 ? t.jogosRealizados(jogosEncerrados, totalJogos) : t.aguardandoInicio}
          </p>
        </div>
        <span style={{ color: "var(--muted)", fontSize: 16, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▾
        </span>
      </button>

      {/* Tabela de classificação */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-2)" }}>
              <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>#</th>
              <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>{t.team}</th>
              <th style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>J</th>
              <th style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>V</th>
              {/* E e D ocultos no mobile via classe */}
              <th className="col-ed" style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>E</th>
              <th className="col-ed" style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>D</th>
              <th style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>SG</th>
              <th style={{ padding: "6px 16px", textAlign: "center", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, i) => {
              const advances = i < 2;
              const eliminated = i >= 2 && standings.slice(0, 2).every(t => t.pts > team.pts);
              return (
                <tr
                  key={team.name}
                  role="row"
                  style={{
                    borderTop: "1px solid var(--border)",
                    background: eliminated ? "color-mix(in srgb, var(--bg) 60%, var(--card))" : "transparent",
                    opacity: eliminated ? 0.6 : 1,
                  }}
                >
                  <td style={{ padding: "8px 16px", borderLeft: advances ? "3px solid var(--neon)" : "3px solid transparent" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: advances ? "var(--neon)" : "var(--muted)" }}>{i + 1}</span>
                  </td>
                  <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>
                    <span style={{ marginRight: 6 }}>{team.flag}</span>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{countryName(team.name, lang)}</span>
                  </td>
                  <td style={{ padding: "8px 8px", textAlign: "center", color: "var(--muted)" }}>{team.j}</td>
                  <td style={{ padding: "8px 8px", textAlign: "center", color: "var(--ok)" }}>{team.v}</td>
                  <td className="col-ed" style={{ padding: "8px 8px", textAlign: "center", color: "var(--muted)" }}>{team.e}</td>
                  <td className="col-ed" style={{ padding: "8px 8px", textAlign: "center", color: "var(--danger)" }}>{team.d}</td>
                  <td style={{ padding: "8px 8px", textAlign: "center", color: team.sg >= 0 ? "var(--ok)" : "var(--danger)" }}>
                    {team.sg > 0 ? `+${team.sg}` : team.sg}
                  </td>
                  <td style={{ padding: "8px 16px", textAlign: "center" }}>
                    <span className="font-bebas" style={{ fontSize: 16, color: "var(--text)" }}>{team.pts}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSS para ocultar E/D no mobile */}
      <style>{`
        @media (max-width: 559px) {
          .col-ed { display: none; }
        }
      `}</style>

      {/* Seção expandida */}
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Jogos do grupo */}
          {group.games.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "en" ? "Matches" : "Jogos"}
              </p>
              {group.games.map((g, i) => (
                <p key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>⚽ {g.t}</p>
              ))}
            </div>
          )}

          {/* Sua previsão (lida do store) */}
          <SuaPrevisao groupName={group.name} standings={standings} />
        </div>
      </div>
    </div>
  );
}
