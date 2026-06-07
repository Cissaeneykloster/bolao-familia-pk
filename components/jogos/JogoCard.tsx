"use client";

import { useBolao } from "@/lib/store";
import { mScore, breakdown } from "@/lib/scoring";
import { useCountdown } from "@/hooks/useCountdown";
import { EXTRA_MS_AFTER_KICKOFF } from "@/lib/mock-data";
// Amistosos de treino nunca fecham — usamos um deadline muito distante
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
  const { guesses, resultFix, setScreen, card, officialResults } = useBolao();
  // Amistosos de treino: deadline = ano 2099 (nunca fecha) EXCETO se resultado oficial lançado
  const hasOfficial = !!officialResults[match.id];
  const trainingDeadline = (match.training && !hasOfficial) ? new Date("2099-01-01").getTime() : undefined;
  const countdown = useCountdown(match.training ? trainingDeadline : match.kickoff);
  const guess = guesses[match.id];

  // Usa resultado oficial se existir, senão mScore normal
  const official = officialResults[match.id];
  const actual = official ?? mScore(match, resultFix);

  // Status efetivo: se tem resultado oficial, trata como "finished"
  const effectiveStatus = hasOfficial ? "finished" : match.status;

  const isCompact = card === "b";
  const isEstadio = card === "c";

  const baseStyle: React.CSSProperties = {
    background: effectiveStatus === "live"
      ? "color-mix(in srgb, var(--live) 6%, var(--card))"
      : effectiveStatus === "finished"
      ? "var(--bg-2)"
      : "var(--card)",
    borderRadius: "var(--radius)",
    border: effectiveStatus === "live"
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
        {effectiveStatus === "live" && (
          <span className="animate-pisca" style={{
            fontSize: 11, fontWeight: 700, color: "var(--live)",
            background: "color-mix(in srgb, var(--live) 15%, transparent)",
            padding: "2px 8px", borderRadius: 10,
          }}>
            🔴 AO VIVO {match.minute}&apos;
          </span>
        )}
        {match.training && !hasOfficial && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", background: "rgba(255,216,77,0.15)", padding: "2px 8px", borderRadius: 10 }}>
            🎯 TREINO
          </span>
        )}
        {effectiveStatus === "finished" && (
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--border)", padding: "2px 8px", borderRadius: 10 }}>
            {match.training ? "🎯 TREINO · ENCERRADO" : "ENCERRADO"}
          </span>
        )}
        {effectiveStatus === "upcoming" && match.label && (
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
          {effectiveStatus !== "upcoming" ? (
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
      {(effectiveStatus === "upcoming") && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {match.training ? (
            <span style={{ fontSize: 12, color: "var(--warn)" }}>
              🎯 Treino — apostas sempre abertas
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--warn)" }}>
              ⏰ Fecha em {countdown}
            </span>
          )}
          <button
            aria-label={`Apostar agora em ${match.a.name} × ${match.b.name}`}
            onClick={() => setScreen("palpites")}
            style={{
              background: "var(--field)", color: "var(--neon)",
              border: "1px solid rgba(0,255,135,0.2)", borderRadius: 8,
              padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            🎯 Apostar
          </button>
        </div>
      )}

      {effectiveStatus === "live" && (
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          Torcendo por você 🤞
        </p>
      )}

      {effectiveStatus === "finished" && guess && (
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Você apostou: <strong style={{ color: "var(--text)" }}>{guess.a} × {guess.b}</strong>
          </p>
          <MiniBreakdown match={{ ...match, sa: actual.sa, sb: actual.sb, status: "finished" }} guess={guess} />
        </div>
      )}

      {effectiveStatus === "finished" && !guess && (
        <p style={{ fontSize: 12, color: "var(--danger)", fontStyle: "italic" }}>
          Sem palpite — {match.training ? "0 pts (treino não conta)" : "−3 pts no ranking"}
        </p>
      )}
    </div>
  );
}
