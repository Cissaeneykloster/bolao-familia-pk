"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBolao } from "@/lib/store";
import { SCORING, WINNER_PTS_BY_PHASE } from "@/lib/mock-data";
import type { MatchPhase } from "@/lib/types";
import { isMatchLocked } from "@/lib/standings";
import type { Match } from "@/lib/types";

interface PlacarInputProps {
  match: Match;
  onSaved?: () => void;
}

function Stepper({
  value,
  onInc,
  onDec,
  disabled,
  side,
  size,
}: {
  value: number;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
  side: "a" | "b";
  size: "large" | "vertical" | "minimal";
}) {
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  const handleInc = () => {
    if (disabled) return;
    setDir("up");
    onInc();
    setTimeout(() => setDir(null), 200);
  };
  const handleDec = () => {
    if (disabled) return;
    setDir("down");
    onDec();
    setTimeout(() => setDir(null), 200);
  };

  const numSize = size === "large" ? 48 : size === "vertical" ? 38 : 28;
  const btnSize = size === "large" ? 36 : size === "vertical" ? 30 : 24;

  const btnStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--neon)",
    cursor: disabled ? "default" : "pointer",
    fontSize: size === "minimal" ? 14 : 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
    transition: "background 0.15s",
    minWidth: 44,
    minHeight: 44,
  };

  const isVertical = size === "vertical";

  return (
    <div style={{
      display: "flex",
      flexDirection: isVertical ? "column" : "row",
      alignItems: "center",
      gap: size === "large" ? 10 : 6,
    }}>
      {isVertical && (
        <button aria-label="+" onClick={handleInc} style={btnStyle} disabled={disabled}>+</button>
      )}

      {/* Número animado */}
      <div style={{ width: numSize + 16, height: numSize + 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`${side}-${value}`}
            initial={{ y: dir === "up" ? 20 : dir === "down" ? -20 : 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: dir === "up" ? -20 : dir === "down" ? 20 : 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-bebas"
            style={{ fontSize: numSize, color: "var(--neon)", lineHeight: 1 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      {!isVertical && (
        <>
          <button aria-label="−" onClick={handleDec} style={btnStyle} disabled={disabled || value <= 0}>−</button>
          <button aria-label="+" onClick={handleInc} style={btnStyle} disabled={disabled || value >= 20}>+</button>
        </>
      )}

      {isVertical && (
        <button aria-label="−" onClick={handleDec} style={btnStyle} disabled={disabled || value <= 0}>−</button>
      )}
    </div>
  );
}

function Preview({ gA, gB, phase = "grupos" }: { gA: number; gB: number; phase?: MatchPhase }) {
  const isElim = phase !== "grupos" && phase !== "amistoso";
  const winnerBase = SCORING.find((r) => r.key === "winner")!.pts;
  const winnerPts = isElim ? (WINNER_PTS_BY_PHASE[phase] ?? winnerBase) : winnerBase;
  const maxPts = SCORING.reduce((s, r) => s + (r.key === "winner" ? winnerPts : r.pts), 0);

  return (
    <div style={{
      background: "var(--neon-soft)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      color: "var(--muted)",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      <span>
        💡 <strong style={{ color: "var(--text)" }}>
          {gA > gB ? "Vitória " + "time A" : gA < gB ? "Vitória time B" : "Empate"}
        </strong>
      </span>
      <span>Se acertar o placar exato: <strong style={{ color: "var(--neon)" }}>+{maxPts} pts</strong></span>
      <span>Se acertar o vencedor: <strong style={{ color: "var(--neon)" }}>+{winnerPts} pts</strong></span>
    </div>
  );
}

export function PlacarInput({ match, onSaved }: PlacarInputProps) {
  const { guesses, setGuess, saveGuess, palpite, officialResults } = useBolao();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "local" | "error">("idle");
  const guess = guesses[match.id] ?? { a: 0, b: 0 };

  // Resultado oficial lançado pelo admin → jogo congelado para todos
  const officialResult = match.training ? undefined : officialResults[match.id];
  // Partida já iniciada → palpite travado (regra do bolão)
  const started = isMatchLocked(match);
  const frozen = !!officialResult || started;

  // Mexeu no placar → volta ao estado "não salvo" (evita "✅ Salvo!" desatualizado)
  const bump = (side: "a" | "b", dir: 1 | -1) => {
    setGuess(match.id, side, dir);
    setStatus("idle");
  };

  const handleSave = async () => {
    if (frozen || status === "saving") return;
    setStatus("saving");
    const res = await saveGuess(match.id);
    if (res === "saved" || res === "local") {
      setStatus(res);
      onSaved?.();
      setTimeout(() => setStatus("idle"), 2500);
    } else if (res === "error") {
      // Mantém o estado de erro até o usuário tentar de novo (sem falso "salvo")
      setStatus("error");
    } else {
      setStatus("idle");
    }
  };

  const size = palpite === "b" ? "vertical" : palpite === "c" ? "minimal" : "large";

  return (
    <div style={{
      background: frozen ? "var(--bg-2)" : "var(--card)",
      borderRadius: "var(--radius)",
      border: `1px solid ${frozen ? "rgba(255,90,90,0.3)" : "var(--border)"}`,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      opacity: frozen ? 0.85 : 1,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{match.group}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {officialResult ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--danger)", background: "rgba(255,90,90,0.1)", padding: "2px 8px", borderRadius: 10 }}>
              🔒 RESULTADO OFICIAL: {officialResult.sa} × {officialResult.sb}
            </span>
          ) : started ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", background: "rgba(255,216,77,0.1)", padding: "2px 8px", borderRadius: 10 }}>
              🔒 JOGO INICIADO — palpites encerrados
            </span>
          ) : null}
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{match.label}</span>
        </div>
      </div>

      {/* Times + steppers */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        {/* Time A */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ fontSize: size === "large" ? 28 : 22 }}>{match.a.flag}</span>
          <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, textAlign: "center", maxWidth: 70 }}>
            {match.a.name}
          </span>
          <Stepper
            value={guess.a}
            onInc={() => bump("a", 1)}
            onDec={() => bump("a", -1)}
            disabled={frozen}
            side="a"
            size={size}
          />
        </div>

        {/* Separador */}
        <span style={{ fontSize: 20, color: "var(--muted)", flexShrink: 0 }}>×</span>

        {/* Time B */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ fontSize: size === "large" ? 28 : 22 }}>{match.b.flag}</span>
          <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, textAlign: "center", maxWidth: 70 }}>
            {match.b.name}
          </span>
          <Stepper
            value={guess.b}
            onInc={() => bump("b", 1)}
            onDec={() => bump("b", -1)}
            disabled={frozen}
            side="b"
            size={size}
          />
        </div>
      </div>

      {/* Preview de pontos */}
      {size !== "minimal" && <Preview gA={guess.a} gB={guess.b} phase={match.phase} />}

      {/* Botão salvar */}
      <button
        aria-label={
          frozen ? "Palpite congelado"
          : status === "saving" ? "Salvando palpite"
          : status === "saved" || status === "local" ? "Palpite salvo"
          : status === "error" ? "Tentar salvar palpite novamente"
          : "Salvar palpite"
        }
        onClick={handleSave}
        disabled={frozen || status === "saving"}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          border: "none",
          background: frozen
            ? "var(--border)"
            : status === "error"
            ? "rgba(255,90,90,0.15)"
            : status === "saved" || status === "local"
            ? "var(--field-light)"
            : "var(--field)",
          color: status === "error" ? "var(--danger)" : "var(--neon)",
          fontWeight: 700,
          fontSize: 14,
          cursor: frozen || status === "saving" ? "default" : "pointer",
          transition: "background 0.2s",
          minHeight: 44,
        }}
      >
        {frozen
          ? "🔒 Resultado oficial lançado"
          : status === "saving"
          ? "⏳ Salvando…"
          : status === "saved"
          ? "✅ Salvo!"
          : status === "local"
          ? "📵 Salvo só neste aparelho"
          : status === "error"
          ? "⚠️ Falhou ao salvar — toque para tentar de novo"
          : guess && (guess.a > 0 || guess.b > 0)
          ? "✏️ Alterar palpite"
          : "💾 Salvar palpite"}
      </button>
    </div>
  );
}
