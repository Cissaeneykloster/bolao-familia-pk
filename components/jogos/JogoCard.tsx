"use client";

import { useBolao } from "@/lib/store";
import { mScore, breakdown } from "@/lib/scoring";
import { useCountdown } from "@/hooks/useCountdown";
import { EXTRA_MS_AFTER_KICKOFF } from "@/lib/mock-data";
import { useLang, T, countryName } from "@/lib/useLang";
// Amistosos de treino nunca fecham — usamos um deadline muito distante
import type { Match } from "@/lib/types";

// ── Breakdown compacto no card ────────────────────────────────────
function MiniBreakdown({ match, guess }: { match: Match; guess: { a: number; b: number } }) {
  const { resultFix } = useBolao();
  const lang = useLang();
  const t = T[lang];
  const actual = mScore(match, resultFix);
  const bd = breakdown(actual, guess, match.phase);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
      {bd.rows.map((r) => (
        <span key={r.key} style={{
          fontSize: 10, padding: "2px 6px", borderRadius: 4,
          background: r.hit ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)",
          color: r.hit ? "var(--ok)" : "var(--muted)",
          border: `1px solid ${r.hit ? "var(--ok)33" : "var(--border)"}`,
        }}>
          {r.hit ? "✅" : "❌"} {t.breakdownLabels[r.key as keyof typeof t.breakdownLabels] ?? r.label}
        </span>
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--neon)", marginLeft: 4 }}>
        ⚡ +{bd.total} pts
      </span>
    </div>
  );
}

// ── Card principal ────────────────────────────────────────────────
export function JogoCard({ match, showPalpiteBtn }: { match: Match; showPalpiteBtn?: boolean }) {
  const { guesses, resultFix, setScreen, setFocusMatch, card, officialResults } = useBolao();
  const lang = useLang();
  const t = T[lang];
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
            {t.aoVivo} {match.minute}&apos;
          </span>
        )}
        {match.training && !hasOfficial && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", background: "rgba(255,216,77,0.15)", padding: "2px 8px", borderRadius: 10 }}>
            {t.treino}
          </span>
        )}
        {effectiveStatus === "finished" && (
          <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--border)", padding: "2px 8px", borderRadius: 10 }}>
            {match.training ? t.treinoEncerrado : t.encerrado}
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
            {countryName(match.a.name, lang)}
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
            {countryName(match.b.name, lang)}
          </span>
          <span style={{ fontSize: isCompact ? 20 : 24 }}>{match.b.flag}</span>
        </div>
      </div>

      {/* Info extra — só mostra "Apostar"/"Palpite" se não há resultado oficial */}
      {effectiveStatus === "upcoming" && !hasOfficial && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {match.training ? (
              <span style={{ fontSize: 12, color: "var(--warn)" }}>
                {t.apostas}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "var(--warn)" }}>
                {lang === "en" ? "⏰ Closes in" : "⏰ Fecha em"} {countdown}
              </span>
            )}
            <button
              aria-label={`${guess ? (lang === "en" ? "Edit bet" : "Editar palpite") : showPalpiteBtn ? "Palpite" : t.apostar} ${countryName(match.a.name, lang)} × ${countryName(match.b.name, lang)}`}
              onClick={() => {
                setFocusMatch(match.id);
                setScreen("palpites");
              }}
              style={{
                background: guess ? "var(--field)" : showPalpiteBtn ? "var(--neon)" : "var(--field)",
                color: guess ? "var(--neon)" : showPalpiteBtn ? "#000" : "var(--neon)",
                border: guess || !showPalpiteBtn ? "1px solid rgba(0,255,135,0.2)" : "none",
                borderRadius: 8,
                padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              {guess ? (lang === "en" ? "✏️ Edit" : "✏️ Editar") : showPalpiteBtn ? (lang === "en" ? "Bet" : "Palpite") : t.apostar}
            </button>
          </div>

          {/* Indica se o usuário já registrou palpite para este jogo */}
          {guess ? (
            <span style={{ fontSize: 11, color: "var(--ok)", fontWeight: 600 }}>
              ✅ {t.seuPalpite} <strong style={{ color: "var(--text)" }}>{guess.a} × {guess.b}</strong>
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
              {lang === "en" ? "⚪ No bet yet" : "⚪ Você ainda não palpitou"}
            </span>
          )}
        </div>
      )}

      {effectiveStatus === "live" && (
        <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          {lang === "en" ? "Rooting for you 🤞" : "Torcendo por você 🤞"}
        </p>
      )}

      {effectiveStatus === "finished" && guess && (
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            {t.voceApostou} <strong style={{ color: "var(--text)" }}>{guess.a} × {guess.b}</strong>
          </p>
          <MiniBreakdown match={{ ...match, sa: actual.sa, sb: actual.sb, status: "finished" }} guess={guess} />
        </div>
      )}

      {effectiveStatus === "finished" && !guess && (
        <p style={{ fontSize: 12, color: "var(--danger)", fontStyle: "italic" }}>
          {match.training
            ? (lang === "en" ? "No bet — 0 pts (training doesn't count)" : "Sem palpite — 0 pts (treino não conta)")
            : (lang === "en" ? "No bet — −3 pts in ranking" : "Sem palpite — −3 pts no ranking")}
        </p>
      )}
    </div>
  );
}
