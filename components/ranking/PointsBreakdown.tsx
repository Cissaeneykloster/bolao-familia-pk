"use client";

import { useBolao } from "@/lib/store";
import { useLang } from "@/lib/useLang";

/** Origem dos pontos de um participante (por apelido). */
export function usePointsBreakdown(name: string) {
  const { matchPts, challengePts, groupPredPts, adminDelta } = useBolao();
  const palpites = matchPts[name] ?? 0;
  const desafios = challengePts[name] ?? 0;
  const previsao = groupPredPts[name] ?? 0;
  const admin = adminDelta[name] ?? 0;
  return { palpites, desafios, previsao, admin, total: palpites + desafios + previsao + admin };
}

function Linha({ icon, label, v }: { icon: string; label: string; v: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "3px 0" }}>
      <span style={{ color: "var(--muted)" }}>{icon} {label}</span>
      <span style={{ fontWeight: 700, color: v > 0 ? "var(--neon)" : v < 0 ? "var(--danger)" : "var(--muted)" }}>
        {v > 0 ? "+" : ""}{v}
      </span>
    </div>
  );
}

/** Detalha de onde vêm os pontos: Palpites (jogos) + Desafios + Ajuste do admin. */
export function PointsBreakdown({ name }: { name: string }) {
  const { palpites, desafios, previsao, admin, total } = usePointsBreakdown(name);
  const lang = useLang();
  const L = lang === "en"
    ? { palpites: "Bets", desafios: "Challenges", previsao: "Group picks", admin: "Admin adjust", total: "Total" }
    : { palpites: "Palpites", desafios: "Desafios", previsao: "Previsão de grupos", admin: "Ajuste do admin", total: "Total" };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Linha icon="🎯" label={L.palpites} v={palpites} />
      <Linha icon="🎮" label={L.desafios} v={desafios} />
      <Linha icon="🔮" label={L.previsao} v={previsao} />
      <Linha icon="🛠️" label={L.admin} v={admin} />
      <div style={{
        borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 5,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{L.total}</span>
        <span className="font-bebas" style={{ fontSize: 15, color: "var(--neon)" }}>{total}</span>
      </div>
    </div>
  );
}
