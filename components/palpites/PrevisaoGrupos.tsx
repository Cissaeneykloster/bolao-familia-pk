"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { GROUPS, MATCHES } from "@/lib/mock-data";
import { arePredictionsLocked, calcGroupPredictionPts } from "@/lib/standings";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";

// ── Seletor de time ───────────────────────────────────────────────
function TeamSelect({
  label,
  value,
  options,
  onChange,
  locked,
}: {
  label: string;
  value: string;
  options: { name: string; flag: string }[];
  onChange: (v: string) => void;
  locked: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase" }}>
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
          border: `1px solid ${value ? "var(--neon)55" : "var(--border)"}`,
          background: locked ? "var(--bg)" : "var(--bg-2)",
          color: value ? "var(--text)" : "var(--muted)",
          cursor: locked ? "default" : "pointer", appearance: "none",
          opacity: locked ? 0.7 : 1,
        }}
      >
        <option value="">Escolher...</option>
        {options.map((t) => (
          <option key={t.name} value={t.name}>
            {t.flag} {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Tela principal ────────────────────────────────────────────────
export function PrevisaoGrupos() {
  const {
    groupPredictions, setGroupPrediction,
    groupPredictionsSaved, saveGroupPredictions,
    resultFix,
  } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();

  const locked = arePredictionsLocked(groupPredictionsSaved);
  const totalGrupos = GROUPS.length; // 12
  const preenchidos = GROUPS.filter((g) => {
    const p = groupPredictions[g.name];
    return p?.first && p?.second && p.first !== p.second;
  }).length;
  const tudo = preenchidos === totalGrupos;

  // Calcula pontos acumulados com os resultados já disponíveis
  const { total: ptsTotais, details } = calcGroupPredictionPts(
    groupPredictions, GROUPS, MATCHES, resultFix
  );

  const handleSave = () => {
    if (!tudo) { show("⚠️ Preencha todos os 12 grupos antes de salvar."); return; }
    saveGroupPredictions();
    fire();
    show("🔒 Previsões salvas e travadas!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Cabeçalho */}
      <div style={{
        padding: "14px 16px", borderRadius: "var(--radius)",
        background: locked
          ? "rgba(0,255,135,0.06)"
          : "rgba(255,216,77,0.06)",
        border: `1px solid ${locked ? "rgba(0,255,135,0.25)" : "rgba(255,216,77,0.3)"}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="font-bebas" style={{
              fontSize: 20, margin: 0,
              color: locked ? "var(--neon)" : "var(--warn)",
            }}>
              {locked ? "🔒 Previsões Travadas" : "📋 Previsão dos Grupos"}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
              {locked
                ? `${preenchidos} de ${totalGrupos} grupos previstos`
                : `${preenchidos} de ${totalGrupos} grupos preenchidos — 10 pts por acerto`}
            </p>
          </div>
          {ptsTotais > 0 && (
            <span className="font-bebas" style={{ fontSize: 24, color: "var(--neon)" }}>
              +{ptsTotais} pts
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        {!locked && (
          <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginTop: 10 }}>
            <div style={{
              height: "100%",
              width: `${(preenchidos / totalGrupos) * 100}%`,
              background: "var(--warn)",
              borderRadius: 2,
              transition: "width 0.4s",
            }} />
          </div>
        )}
      </div>

      {/* Aviso se não travado */}
      {!locked && (
        <div style={{
          fontSize: 12, color: "var(--muted)", padding: "8px 12px", borderRadius: 8,
          background: "var(--bg-2)", border: "1px solid var(--border)", lineHeight: 1.5,
        }}>
          ⚠️ <strong style={{ color: "var(--text)" }}>Preencha todos os 12 grupos</strong> e clique em
          "Salvar Previsões". Após salvar (ou quando o 1º jogo começar), não pode mais alterar.
        </div>
      )}

      {/* Lista de grupos */}
      {GROUPS.map((group) => {
        const pred = groupPredictions[group.name] ?? { first: "", second: "" };
        const teams = group.teams;
        const optsFirst = teams.filter((t) => t.name !== pred.second);
        const optsSecond = teams.filter((t) => t.name !== pred.first);
        const detail = details.find((d) => d.group === group.name);
        const pts = detail?.pts ?? 0;
        const acertos = detail?.acertos ?? [];

        const completo = pred.first && pred.second && pred.first !== pred.second;

        return (
          <div key={group.name} style={{
            background: "var(--card)", borderRadius: "var(--radius)",
            border: `1px solid ${completo ? "rgba(0,255,135,0.2)" : "var(--border)"}`,
            overflow: "hidden",
          }}>
            {/* Header do grupo */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: "var(--bg-2)",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="font-bebas" style={{ fontSize: 18, color: "var(--neon)" }}>
                  {group.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {teams.map((t) => t.flag).join(" ")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {pts > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--neon)" }}>
                    +{pts} pts
                  </span>
                )}
                {completo && !locked && (
                  <span style={{ fontSize: 12, color: "var(--ok)" }}>✅</span>
                )}
              </div>
            </div>

            {/* Seletores */}
            <div style={{ padding: "12px 14px", display: "flex", gap: 10 }}>
              <TeamSelect
                label="🥇 1º Classificado"
                value={pred.first}
                options={optsFirst}
                onChange={(v) => setGroupPrediction(group.name, v, pred.second)}
                locked={locked}
              />
              <TeamSelect
                label="🥈 2º Classificado"
                value={pred.second}
                options={optsSecond}
                onChange={(v) => setGroupPrediction(group.name, pred.first, v)}
                locked={locked}
              />
            </div>

            {/* Acertos (quando há resultado) */}
            {locked && acertos.length > 0 && (
              <div style={{
                padding: "6px 14px 10px",
                display: "flex", gap: 6, flexWrap: "wrap",
              }}>
                {acertos.map((name) => (
                  <span key={name} style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10,
                    background: "rgba(0,255,135,0.12)", color: "var(--neon)",
                    border: "1px solid rgba(0,255,135,0.3)",
                  }}>
                    ✅ {name} (+10 pts)
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Botão salvar */}
      {!locked && (
        <button
          onClick={handleSave}
          disabled={!tudo}
          style={{
            width: "100%", padding: "14px 0", borderRadius: "var(--radius)",
            border: "none",
            background: tudo ? "var(--field)" : "var(--border)",
            color: tudo ? "var(--neon)" : "var(--muted)",
            cursor: tudo ? "pointer" : "default",
            fontWeight: 700, fontSize: 15, minHeight: 50,
            transition: "background 0.2s",
          }}
        >
          {tudo
            ? "🔒 Salvar e Travar Previsões"
            : `Preencha mais ${totalGrupos - preenchidos} grupo(s)`}
        </button>
      )}
    </div>
  );
}
