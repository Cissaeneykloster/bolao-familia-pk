"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";

interface GrupoTabelaProps {
  group: Group;
}

export function GrupoTabela({ group }: GrupoTabelaProps) {
  const [open, setOpen] = useState(false);

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
        <span className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", letterSpacing: 1 }}>
          {group.name}
        </span>
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
              <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 11 }}>Time</th>
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
            {group.teams.map((team, i) => {
              const advances = i < 2;
              const eliminated = i >= 2 && group.teams.filter((_, j) => j < 2).every(t => t.pts > team.pts);
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
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{team.name}</span>
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
                Jogos
              </p>
              {group.games.map((g, i) => (
                <p key={i} style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>⚽ {g.t}</p>
              ))}
            </div>
          )}

          {/* Palpite de classificação */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Seu palpite de classificação
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "var(--text)" }}>
                  🥇 1º — {group.pred.first}
                </span>
                {group.predResult === "ok"
                  ? <span style={{ color: "var(--ok)", fontWeight: 700 }}>✅ +15 pts</span>
                  : <span style={{ color: "var(--muted)" }}>⏳ em aberto</span>
                }
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "var(--text)" }}>
                  🥈 2º — {group.pred.second}
                </span>
                {group.predResult === "ok"
                  ? <span style={{ color: "var(--ok)", fontWeight: 700 }}>✅ +10 pts</span>
                  : <span style={{ color: "var(--muted)" }}>⏳ em aberto</span>
                }
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontStyle: "italic" }}>
              {group.pred.first} e {group.pred.second} classificam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
