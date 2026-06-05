"use client";

import { useBolao } from "@/lib/store";
import { mScore, breakdown } from "@/lib/scoring";
import { useCountdown } from "@/hooks/useCountdown";
import { EXTRA_MS_AFTER_KICKOFF } from "@/lib/mock-data";
import type { Match } from "@/lib/types";

// ── Breakdown compacto no card ────────────────────────────────────
function MiniBreakdown({ match, guess }: { match: Match; guess: { a: number; b: number } }) {
  const { resultFix } = useBolao();
  const actual = mScore(match, resultFix);
  const bd = breakdown(actual, guess);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
      {bd.rows.map((r) => (
        <span key={r.key} style={{
          fontSize: 10, padding: "2px 6px", borderRadius: 4,
          background: r.hit ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)",
          color: r.hit ? "var(--ok)" : "var(--muted)",
          border: `1px solid ${r.hit ? "var(--ok)33" : "var(--border)"}`,
        }}>
          {r.hit ? "✅" : "❌"} {r.label}
        </span>
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--neon)", marginLeft: 4 }}>
        ⚡ +{bd.total} pts
      </span>
    </div>
  );
}

// ── Card principal ────────────────────────────────────────────────
export function JogoCard({ match }: { match: Match }) {
  const { guesses, resultFix, setScreen, card } = useBolao();
  const countdown = useCountdown(match.kickoff);
  const guess = guesses[match.id];
  const actual = mScore(match, resultFix);

  const isCompact = card === "b";
  const isEstadio = card === "c";

  const baseStyle: React.CSSProperties = {
    background: match.status === "live"
      ? "color-mix(in srgb, var(--live) 6%, var(--card))"
      : match.status === "finished"
      ? "var(--bg-2)"
      : "var(--card)",
    borderRadius: "var(--radius)",
    border: match.status === "live"
      ? "1px solid var(--live)"
      : "1px solid var(--border)",
    padding: isCompact ? "10px 12px" : "14px 16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    animation: match.status === "live" ? "live-border 1.4s ease-in-out infinite" : undefined,
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  if (isEstadio) {
    baseStyle.backgroundImage = "linear-gradient(135deg, var(--field)22 0%, transparent 60%)";
  }

  return (
    <div style={baseStyle}>
      {/* Cabeçalho: grupo + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{match.group}</span>
        {match.status === "live" && (
          <span className="animate-pisca" style={{
            fontSize: 11, fontWeight: 700, color: "var(--live)",
            background: "color-mix(in srgb, var(--live) 15%, transparent)",
            padding: "2px 8px", borderRadius: 10,
          }}>
            🔴 AO VIVO {match.minute}&apos;
          </span>
        )}
        {match.status === "finished" && (
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--border)", padding: "2px 8px", borderRadius: 10 }}>
            ENCERRADO
          </span>
        )}
        {match.status === "upcoming" && match.label && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{match.label}</span>
        )}
      </div>

      {/* Times + placar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {/* Time A */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <span style={{ fontSize: isCompact ? 20 : 24 }}>{match.a.flag}</span>
          <span style={{ fontSize: isCompact ? 12 : 14, fontWeight: 600, color: "var(--text)" }}>
            {match.a.name}
          </span>
        </div>

        {/* Placar central */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {match.status !== "upcoming" ? (
            <>
              <span className="font-bebas" style={{ fontSize: isCompact ? 28 : 36, color: "var(--neon)", minWidth: 20, textAlign: "center" }}>
                {actual.sa}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 16 }}>×</span>
              <span className="font-bebas" style={{ fontSize: isCompact ? 28 : 36, color: "var(--neon)", minWidth: 20, textAlign: "center" }}>
                {actual.sb}
              </span>
            </>
          ) : (
            <span style={{ color: "var(--muted)", fontSize: 20, padding: "0 8px" }}>×</span>
          )}
        </div>

        {/* Time B */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
          <span style={{ fontSize: isCompact ? 12 : 14, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>
            {match.b.name}
          </span>
          <span style={{ fontSize: isCompact ? 20 : 24 }}>{match.b.flag}</span>
        </div>
      </div>

      {/* Info extra por status */}
      {match.status === "upcoming" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--warn)" }}>
            ⏰ Fecha em {countdown}
            {match.kickoff && Date.now() >= match.kickoff && (
              <span style={{ color: "var(--live)", marginLeft: 4 }}>(5 min após o início)</span>
            )}
          </span>
          <button
            aria-label={`Apostar agora em ${match.a.name} × ${match.b.name}`}
            onClick={() => setScreen("palpites")}
            style={{
              background: "var(--field)", color: "var(--neon)",
              border: "1px solid var(--neon)33", borderRadius: 8,
              padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            🎯 Apostar agora
          </button>
        </div>
      )}

      {match.status === "live" && (
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          Torcendo por você 🤞
        </p>
      )}

      {match.status === "finished" && guess && (
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Você apostou: <strong style={{ color: "var(--text)" }}>{guess.a} × {guess.b}</strong>
          </p>
          <MiniBreakdown match={match} guess={guess} />
        </div>
      )}

      {match.status === "finished" && !guess && (
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          Você não apostou nesse jogo.
        </p>
      )}
    </div>
  );
}
