"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { rankWithEff, effPts, mScore, breakdown, bonusPts } from "@/lib/scoring";
import { MATCHES, ADMINS } from "@/lib/mock-data";
import { participantesToPlayers } from "@/lib/players";
import { useDesafioCats } from "@/lib/useDesafios";
import {
  upsertParticipante, deleteParticipante, updateParticipanteDb,
  upsertOfficialResult, upsertMatchPtsBatch, syncAllOfficialResults, resetMatchPtsDb,
  loadAllGuesses,
} from "@/lib/supabase-sync";

type AdminTab = "pontos" | "palpites" | "resultados" | "participantes" | "desafios";

// ── Aba Desafios ─────────────────────────────────────────────────
function TabDesafios() {
  const { setDesafioItem, addDesafioItem, removeDesafioItem, setDesafioPts, resetDesafios, adminGrupoId } = useBolao();
  const cats = useDesafioCats(); // já retorna os do grupo do admin logado
  const [editingId, setEditingId] = useState<string | null>(null);
  const gid = adminGrupoId ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Desafios exclusivos do <strong style={{ color: "var(--neon)" }}>{ADMINS.find(a => a.id === gid)?.nomeGrupo ?? "seu grupo"}</strong>.
          Cada grupo tem os seus.
        </p>
        <button
          onClick={() => { if (window.confirm("Restaurar os desafios originais do seu grupo?")) resetDesafios(gid); }}
          style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Restaurar padrão
        </button>
      </div>

      {cats.map((cat) => (
        <div key={cat.id} style={{ background: "var(--bg-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {/* Cabeçalho da categoria */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 20 }}>{cat.icon}</span>
            <span style={{ fontWeight: 700, color: "var(--text)", flex: 1, fontSize: 14 }}>{cat.name}</span>
            {/* Editar pontos */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>±</span>
              <button onClick={() => setDesafioPts(gid, cat.id, Math.max(1, cat.pts - 1))}
                style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>−</button>
              <span className="font-bebas" style={{ fontSize: 18, color: "var(--neon)", minWidth: 20, textAlign: "center" }}>{cat.pts}</span>
              <button onClick={() => setDesafioPts(gid, cat.id, cat.pts + 1)}
                style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>+</button>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>pts</span>
            </div>
          </div>

          {/* Itens */}
          <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {cat.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 28, fontWeight: 700 }}>
                  {i + 1}.
                </span>
                {editingId === `${cat.id}-${i}` ? (
                  <input
                    autoFocus
                    defaultValue={item}
                    onBlur={(e) => { setDesafioItem(gid, cat.id, i, e.target.value || item); setEditingId(null); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { setDesafioItem(gid, cat.id, i, e.currentTarget.value || item); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid var(--neon)", background: "var(--bg-2)", color: "var(--text)", fontSize: 12 }}
                  />
                ) : (
                  <span
                    onClick={() => setEditingId(`${cat.id}-${i}`)}
                    style={{ flex: 1, fontSize: 12, color: "var(--text)", cursor: "pointer", padding: "4px 0" }}
                    title="Clique para editar"
                  >
                    {item}
                  </span>
                )}
                <button
                  onClick={() => setEditingId(`${cat.id}-${i}`)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 13 }}
                  aria-label={`Editar ${item}`}
                >
                  ✏️
                </button>
                {cat.items.length > 1 && (
                  <button
                    onClick={() => { if (window.confirm("Remover este desafio?")) removeDesafioItem(gid, cat.id, i); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 13 }}
                    aria-label={`Remover ${item}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* Adicionar novo item */}
            <button
              onClick={() => addDesafioItem(gid, cat.id)}
              style={{
                marginTop: 4, padding: "6px 10px", borderRadius: 6, fontSize: 12,
                border: "1px dashed var(--border)", background: "transparent",
                color: "var(--muted)", cursor: "pointer", textAlign: "left",
              }}
            >
              + Adicionar desafio
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Aba Pontos ───────────────────────────────────────────────────
function TabPontos() {
  const { adminDelta, setAdminDelta, resetAdminDelta, desafios, comboBank, penalty, participantes, adminGrupoId, resetMatchPts, matchPts, recalcAllMatchPts } = useBolao();
  const [recalcing, setRecalcing] = useState(false);
  const [recalcMsg, setRecalcMsg] = useState("");
  const DESAFIO_CATS = useDesafioCats();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const meusPart = participantes.filter((p) => p.grupoId === adminGrupoId && p.ativo);
  const players = participantesToPlayers(meusPart, adminDelta);
  const ranked = rankWithEff(players, adminDelta, bonus);

  const totalMatchPts = Object.values(matchPts).reduce((s, v) => s + Math.abs(v), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Recalcular ranking a partir do Supabase */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--neon)", margin: 0 }}>♻️ Recalcular ranking</p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            Refaz os pontos de todos os jogos com os palpites reais do Supabase
          </p>
          {recalcMsg && <p style={{ fontSize: 11, color: "var(--neon)", margin: "2px 0 0" }}>{recalcMsg}</p>}
        </div>
        <button
          onClick={async () => {
            setRecalcing(true);
            setRecalcMsg("Recalculando...");
            const allGuesses = await loadAllGuesses();
            recalcAllMatchPts(participantes, allGuesses);
            const newPts = useBolao.getState().matchPts;
            await upsertMatchPtsBatch(newPts, participantes);
            setRecalcMsg("✅ Ranking recalculado e enviado a todos!");
            setRecalcing(false);
            setTimeout(() => setRecalcMsg(""), 5000);
          }}
          disabled={recalcing}
          style={{
            padding: "7px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
            border: "1px solid rgba(0,255,135,0.4)", background: "rgba(0,255,135,0.1)",
            color: "var(--neon)", cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          ♻️ Recalcular
        </button>
      </div>

      {/* Botão zerar ranking */}
      {totalMatchPts > 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,90,90,0.06)", border: "1px solid rgba(255,90,90,0.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", margin: 0 }}>⚠️ Ranking com pontos de treino</p>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Zere antes dos jogos oficiais começarem</p>
          </div>
          <button
            onClick={async () => {
              if (!window.confirm("Zerar TODOS os pontos de partidas do ranking? (Pontos de desafios são mantidos)")) return;
              resetMatchPts();
              await resetMatchPtsDb();
              // Também zera o matchPts de todos os participantes no Supabase
              const zeroMap: Record<string, number> = {};
              participantes.filter((p) => p.ativo).forEach((p) => { zeroMap[p.apelido] = 0; });
              await upsertMatchPtsBatch(zeroMap, participantes);
            }}
            style={{
              padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
              border: "none", background: "var(--danger)", color: "#fff", cursor: "pointer",
            }}
          >
            🗑️ Zerar ranking
          </button>
        </div>
      )}

      {ranked.map((p) => {
        const pts = effPts(p, adminDelta, bonus);
        const delta = adminDelta[p.name] ?? 0;
        return (
          <div
            key={p.name}
            role="listitem"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", background: "var(--bg-2)",
              borderRadius: 10, border: "1px solid var(--border)",
            }}
          >
            {/* Avatar + nome */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--field)", color: "var(--neon)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {p.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
              {delta !== 0 && (
                <span style={{ fontSize: 11, color: delta > 0 ? "var(--ok)" : "var(--danger)", marginLeft: 6 }}>
                  ({delta > 0 ? "+" : ""}{delta})
                </span>
              )}
            </div>
            <span className="font-bebas" style={{ fontSize: 20, color: "var(--text)" }}>{pts}</span>

            {/* Botões de ajuste */}
            {([-5, -1, 1, 5] as const).map((d) => (
              <button
                key={d}
                aria-label={`${p.name} ${d > 0 ? "+" : ""}${d}`}
                onClick={() => setAdminDelta(p.name, d)}
                style={{
                  width: 32, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: `1px solid ${d > 0 ? "rgba(0,255,135,0.3)" : "rgba(255,90,90,0.3)"}`,
                  background: d > 0 ? "var(--neon-soft)" : "rgba(255,90,90,0.1)",
                  color: d > 0 ? "var(--ok)" : "var(--danger)",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {d > 0 ? "+" : ""}{d}
              </button>
            ))}

            {/* Reset */}
            {delta !== 0 && (
              <button
                aria-label={`Resetar ${p.name}`}
                onClick={() => resetAdminDelta(p.name)}
                style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 14,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--muted)", cursor: "pointer", flexShrink: 0,
                }}
              >
                ↺
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Aba Palpites ─────────────────────────────────────────────────
function TabPalpites() {
  const { participantes, adminGrupoId, guesses, officialResults } = useBolao();
  const meusPart = participantes.filter(
    (p) => (p.grupoId === adminGrupoId || !p.grupoId) && p.ativo
  );

  // Jogos com resultado oficial já lançado
  const jogosComResultado = MATCHES.filter(
    (m) => !m.training && officialResults[m.id]
  ).sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));

  if (jogosComResultado.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
        <p>Nenhum jogo com resultado oficial ainda.</p>
        <p>Vá em ⚽ Resultados para lançar os placares.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
        Palpites dos participantes nos jogos com resultado oficial.
      </p>
      {jogosComResultado.map((m) => {
        const oficial = officialResults[m.id]!;
        return (
          <div key={m.id} style={{ background: "var(--bg-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Cabeçalho do jogo */}
            <div style={{ padding: "8px 12px", background: "var(--card)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {m.a.flag} {m.a.name} × {m.b.name} {m.b.flag}
              </span>
              <span className="font-bebas" style={{ fontSize: 18, color: "var(--neon)" }}>
                {oficial.sa} × {oficial.sb}
              </span>
            </div>
            {/* Palpites */}
            {meusPart.map((p) => {
              const g = guesses[m.id];
              const temPalpite = !!g;
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 12px", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--field)", color: "var(--neon)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {p.apelido.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{p.apelido}</span>
                  {temPalpite ? (
                    <span className="font-bebas" style={{ fontSize: 16, color: "var(--neon)" }}>
                      {g.a} × {g.b}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--danger)", fontStyle: "italic" }}>
                      sem palpite (−3)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Aba Resultados ───────────────────────────────────────────────
function TabResultados() {
  const { resultFix, setResultFix, saveResultAndCalcPts, addFeedEvent, participantes, adminGrupoId, officialResults } = useBolao();
  const [drafts, setDrafts] = useState<Record<string, { sa: number; sb: number }>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [syncingResults, setSyncingResults] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState("");
  // TODOS os jogos ordenados por data (incluindo treinos)
  const allMatches = [...MATCHES]
    .sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));

  const setDraft = (id: string, side: "sa" | "sb", dir: 1 | -1) => {
    const m = MATCHES.find((x) => x.id === id)!;
    const prev = drafts[id] ?? { sa: m.sa ?? 0, sb: m.sb ?? 0 };
    const next = Math.min(20, Math.max(0, prev[side] + dir));
    setDrafts((d) => ({ ...d, [id]: { ...prev, [side]: next } }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Banner de sincronização */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--neon)", margin: 0 }}>☁️ Resultados no Supabase</p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            {Object.keys(officialResults).length} resultado(s) local(is) · Clique para enviar a todos
          </p>
          {syncResultMsg && <p style={{ fontSize: 11, color: "var(--neon)", margin: "2px 0 0" }}>{syncResultMsg}</p>}
        </div>
        <button
          onClick={async () => {
            setSyncingResults(true);
            setSyncResultMsg("Enviando...");
            const n = await syncAllOfficialResults(officialResults);
            // Também sincroniza os pontos
            const newPts = useBolao.getState().matchPts;
            await upsertMatchPtsBatch(newPts, useBolao.getState().participantes);
            setSyncResultMsg(`✅ ${n} resultado(s) enviados para todos!`);
            setSyncingResults(false);
            setTimeout(() => setSyncResultMsg(""), 5000);
          }}
          disabled={syncingResults || Object.keys(officialResults).length === 0}
          style={{
            padding: "7px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
            border: "1px solid rgba(0,255,135,0.4)", background: "rgba(0,255,135,0.1)",
            color: "var(--neon)", cursor: "pointer", whiteSpace: "nowrap",
            opacity: Object.keys(officialResults).length === 0 ? 0.4 : 1,
          }}
        >
          {syncingResults ? "⏳..." : "⬆️ Enviar resultados"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
        Informe o resultado de cada jogo. O sistema calculará os pontos automaticamente.
        Participantes sem palpite recebem <strong style={{ color: "var(--danger)" }}>−3 pts</strong>.
      </p>
      {allMatches.map((m) => {
        const official = officialResults[m.id];
        const fixed = official ?? resultFix[m.id];
        const draft = drafts[m.id] ?? { sa: fixed?.sa ?? 0, sb: fixed?.sb ?? 0 };
        const isSaved = saved === m.id;
        const isOfficial = !!official;
        return (
          <div key={m.id} style={{
            padding: "10px 12px",
            background: isOfficial ? "rgba(0,255,135,0.04)" : m.training ? "rgba(255,216,77,0.04)" : "var(--bg-2)",
            borderRadius: 10,
            border: `1px solid ${isSaved ? "var(--neon)55" : isOfficial ? "rgba(0,255,135,0.3)" : "var(--border)"}`,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {/* Linha de info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {m.training && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--warn)", background: "rgba(255,216,77,0.15)", padding: "1px 5px", borderRadius: 4 }}>TREINO</span>}
                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                  {m.a.flag} {m.a.name} × {m.b.name} {m.b.flag}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {m.label && <span style={{ fontSize: 10, color: "var(--muted)" }}>{m.label}</span>}
                {isOfficial && !isSaved && (
                  <span style={{ fontSize: 10, background: "rgba(0,255,135,0.1)", color: "var(--neon)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                    ✅ {official!.sa} × {official!.sb}
                  </span>
                )}
                {isSaved && <span style={{ fontSize: 10, color: "var(--neon)", fontWeight: 700 }}>✅ Salvo!</span>}
              </div>
            </div>
            {/* Placar + botão */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(["sa", "sb"] as const).map((side, si) => (
                <span key={side} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {si > 0 && <span style={{ color: "var(--muted)" }}>×</span>}
                  <button onClick={() => setDraft(m.id, side, -1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>−</button>
                  <span className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", minWidth: 20, textAlign: "center" }}>{draft[side]}</span>
                  <button onClick={() => setDraft(m.id, side, 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>+</button>
                </span>
              ))}
              <div style={{ flex: 1 }} />
              <button
                aria-label={isOfficial ? `Alterar resultado ${m.id}` : `Salvar resultado ${m.id}`}
                onClick={async () => {
                  // Palpites reais deste jogo, de todos os participantes (Supabase)
                  const allGuesses = await loadAllGuesses();
                  saveResultAndCalcPts(m.id, draft, participantes, adminGrupoId ?? "", allGuesses[m.id] ?? {}, m.phase, !!m.training);
                  // Grava no Supabase (em background)
                  upsertOfficialResult(m.id, draft.sa, draft.sb);
                  // Depois que o store recalculou, sincroniza os pontos
                  setTimeout(() => {
                    const newPts = useBolao.getState().matchPts;
                    upsertMatchPtsBatch(newPts, useBolao.getState().participantes);
                  }, 200);
                  addFeedEvent({
                    type: "result",
                    body: isOfficial ? "Resultado atualizado" : "Resultado confirmado",
                    score: { a: m.a.name, sa: draft.sa, sb: draft.sb, b: m.b.name },
                  });
                  setSaved(m.id);
                  setTimeout(() => setSaved(null), 2000);
                }}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${isOfficial ? "rgba(255,216,77,0.5)" : "transparent"}`,
                  background: isOfficial ? "rgba(255,216,77,0.1)" : "var(--field)",
                  color: isOfficial ? "var(--warn)" : "var(--neon)",
                  cursor: "pointer",
                }}
              >
                {isSaved ? "✅ Salvo!" : isOfficial ? "✏️ Alterar resultado" : "💾 Salvar resultado"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Aba Participantes ────────────────────────────────────────────
function TabParticipantes() {
  const { participantes, addParticipante, updateParticipante, removeParticipante, toggleParticipanteAtivo, adminGrupoId, migrateParticipantes } = useBolao();
  const [form, setForm] = useState({ nome: "", apelido: "", email: "", telefone: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [novoLink, setNovoLink] = useState<{ nome: string; link: string } | null>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importados, setImportados] = useState(0);
  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", apelido: "", email: "", telefone: "" });

  // Considera "sem grupo" tanto null, undefined, quanto string vazia
  const semGrupoId = (p: { grupoId?: string | null }) => !p.grupoId || p.grupoId === "";
  // Mostra participantes do grupo do admin + participantes antigos sem grupoId
  const meusPart = participantes.filter(
    (p) => p.grupoId === adminGrupoId || semGrupoId(p)
  );
  // Participantes antigos que precisam ser migrados (sem grupoId)
  const semGrupo = participantes.filter((p) => semGrupoId(p));
  const adminCfg = ADMINS.find((a) => a.id === adminGrupoId);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  /** Envia todos os participantes locais para o Supabase */
  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncMsg("Sincronizando...");
    let ok = 0;
    for (const p of meusPart) {
      await upsertParticipante({ ...p, grupoId: p.grupoId || adminGrupoId || "" });
      ok++;
    }
    setSyncMsg(`✅ ${ok} participante(s) enviados para o Supabase!`);
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 4000);
  };

  // Importa participantes a partir de links ou apelidos (um por linha)
  const handleImport = () => {
    if (!adminGrupoId) return;
    const linhas = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    let count = 0;
    for (const linha of linhas) {
      // Extrai apelido de um link ?p=Apelido ou usa a linha inteira como apelido
      let apelido = linha;
      try {
        const url = new URL(linha);
        const p = url.searchParams.get("p");
        if (p) apelido = decodeURIComponent(p);
      } catch { /* não é URL, usa texto direto */ }
      apelido = apelido.trim();
      if (!apelido) continue;
      // Verifica se já existe
      const existe = participantes.some(
        (p) => p.apelido.toLowerCase() === apelido.toLowerCase() &&
               (p.grupoId === adminGrupoId || !p.grupoId)
      );
      if (!existe) {
        addParticipante({ nome: apelido, apelido, email: "", telefone: "", grupoId: adminGrupoId });
        count++;
      }
    }
    setImportados(count);
    setImportText("");
    setTimeout(() => { setImportados(0); setShowImport(false); }, 3000);
  };

  const handleAdd = () => {
    if (!form.nome || !form.apelido || !adminGrupoId) return;
    const p = addParticipante({ ...form, grupoId: adminGrupoId });
    // Grava no Supabase (sem bloquear a UI)
    upsertParticipante(p);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://bolao-familia-pk.vercel.app";
    const link = `${origin}/entrar/${adminGrupoId}?p=${encodeURIComponent(p.apelido)}`;
    setNovoLink({ nome: p.nome, link });
    setForm({ nome: "", apelido: "", email: "", telefone: "" });
  };

  const copyLink = (_token: string, id: string) => {
    const origin = window.location.origin;
    const p = meusPart.find((x) => x.id === id);
    const link = p
      ? `${origin}/entrar/${adminGrupoId}?p=${encodeURIComponent(p.apelido)}`
      : `${origin}/entrar/${adminGrupoId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
    border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)",
    marginTop: 4,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Sincronizar com Supabase ── */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--neon)", margin: 0 }}>
            ☁️ Supabase conectado
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            {meusPart.length} participante(s) locais
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {syncMsg && <span style={{ fontSize: 11, color: "var(--neon)" }}>{syncMsg}</span>}
          <button
            onClick={handleSyncToSupabase}
            disabled={syncing || meusPart.length === 0}
            style={{
              padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
              border: "1px solid rgba(0,255,135,0.4)", background: "rgba(0,255,135,0.1)",
              color: "var(--neon)", cursor: syncing ? "wait" : "pointer",
              opacity: meusPart.length === 0 ? 0.5 : 1,
            }}
          >
            {syncing ? "⏳ Enviando..." : "⬆️ Enviar para Supabase"}
          </button>
        </div>
      </div>

      {/* ── Banner de migração (participantes sem grupo) ── */}
      {semGrupo.length > 0 && adminGrupoId && (
        <div style={{
          padding: "12px 14px", borderRadius: 10,
          background: "rgba(255,216,77,0.1)",
          border: "1px solid rgba(255,216,77,0.4)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--warn)", margin: 0 }}>
            ⚠️ {semGrupo.length} participante{semGrupo.length > 1 ? "s" : ""} sem grupo definido
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
            Foram cadastrados antes do sistema de grupos. Clique para atribuí-los ao <strong style={{ color: "var(--neon)" }}>{adminCfg?.nomeGrupo}</strong>:
          </p>
          <button
            onClick={() => {
              if (window.confirm(`Mover ${semGrupo.length} participante(s) para o ${adminCfg?.nomeGrupo}?`)) {
                migrateParticipantes(adminGrupoId);
              }
            }}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: "var(--warn)", color: "#000",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            ✅ Mover para {adminCfg?.nomeGrupo}
          </button>
        </div>
      )}

      {/* Badge do grupo */}
      {adminCfg && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(0,255,135,0.07)", borderRadius: 8, border: "1px solid rgba(0,255,135,0.2)" }}>
          <span style={{ fontSize: 18 }}>{adminCfg.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--neon)" }}>{adminCfg.nomeGrupo}</span>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{meusPart.length} cadastrado{meusPart.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Importação rápida por links */}
      {!showImport ? (
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer", width: "100%",
          }}
        >
          📋 Importar pelo link (recuperar cadastros perdidos)
        </button>
      ) : (
        <div style={{ background: "var(--bg-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            📋 Importar participantes
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            Cole os links de acesso abaixo (um por linha). O sistema extrai o nome automaticamente.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`https://bolao-familia-pk.vercel.app/entrar/pk?p=Jecy\nhttps://bolao-familia-pk.vercel.app/entrar/pk?p=Tia+Ve\n...\n\nOu só os apelidos:\nJecy\nTia Ve\nNey`}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12,
              border: "1px solid var(--border)", background: "var(--bg-2)",
              color: "var(--text)", resize: "vertical", minHeight: 140,
              fontFamily: "monospace",
            }}
          />
          {importados > 0 && (
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--neon)", margin: 0 }}>
              ✅ {importados} participante{importados > 1 ? "s" : ""} importado{importados > 1 ? "s" : ""}!
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setShowImport(false); setImportText(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              style={{
                flex: 2, padding: "9px 0", borderRadius: 8, border: "none",
                background: importText.trim() ? "var(--field)" : "var(--border)",
                color: importText.trim() ? "var(--neon)" : "var(--muted)",
                cursor: importText.trim() ? "pointer" : "default",
                fontWeight: 700, fontSize: 13,
              }}
            >
              ✅ Importar
            </button>
          </div>
        </div>
      )}

      {/* Formulário de cadastro */}
      <div style={{ background: "var(--bg-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
          ➕ Cadastrar participante no {adminCfg?.nomeGrupo}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Nome completo *
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Maria Silva" />
          </label>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Apelido (ranking) *
            <input style={inputStyle} value={form.apelido} onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))} placeholder="Mari" />
          </label>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            E-mail
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mari@email.com" />
          </label>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Telefone (WhatsApp)
            <input style={inputStyle} type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
          </label>
        </div>
        <button
          onClick={handleAdd}
          style={{
            marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 8,
            border: "none", background: "var(--field)", color: "var(--neon)",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Cadastrar e gerar link de acesso
        </button>
      </div>

      {/* Link gerado */}
      {novoLink && (
        <div style={{
          background: "rgba(0,255,135,0.1)",
          border: "1px solid rgba(0,255,135,0.27)",
          borderRadius: "var(--radius)", padding: 14,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--neon)", marginBottom: 6 }}>
            ✅ {novoLink.nome} cadastrado!
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            Envie este link para a pessoa acessar o bolão:
          </p>
          <div style={{
            background: "var(--bg-2)", borderRadius: 6, padding: "8px 10px",
            fontSize: 11, color: "var(--text)", wordBreak: "break-all",
            border: "1px solid var(--border)",
          }}>
            {novoLink.link}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(novoLink.link); }}
            style={{
              marginTop: 8, padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              border: "none", background: "var(--neon)", color: "#000", cursor: "pointer",
            }}
          >
            📋 Copiar link
          </button>
        </div>
      )}

      {/* Lista de participantes do grupo */}
      {meusPart.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
          Nenhum participante cadastrado ainda neste grupo.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {meusPart.map((p) => (
            <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Linha principal */}
              <div style={{
                background: p.ativo ? "var(--bg-2)" : "var(--bg)",
                borderRadius: editingId === p.id ? "10px 10px 0 0" : 10,
                border: "1px solid var(--border)",
                borderBottom: editingId === p.id ? "none" : "1px solid var(--border)",
                padding: "10px 12px",
                display: "flex", alignItems: "center", gap: 10,
                opacity: p.ativo ? 1 : 0.5,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "var(--field)", color: "var(--neon)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>
                  {p.apelido.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{p.nome}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                    @{p.apelido} · {p.email || "—"} · {p.telefone || "—"}
                  </p>
                </div>
                {/* 🔗 Link */}
                <button
                  aria-label={`Copiar link de ${p.nome}`}
                  onClick={() => copyLink(p.token, p.id)}
                  style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: "1px solid var(--border)", background: "transparent",
                    color: copiedId === p.id ? "var(--ok)" : "var(--muted)", cursor: "pointer",
                  }}
                >
                  {copiedId === p.id ? "✅" : "🔗"}
                </button>
                {/* ✏️ Editar */}
                <button
                  aria-label={`Editar ${p.nome}`}
                  onClick={() => {
                    if (editingId === p.id) {
                      setEditingId(null);
                    } else {
                      setEditingId(p.id);
                      setEditForm({ nome: p.nome, apelido: p.apelido, email: p.email || "", telefone: p.telefone || "" });
                    }
                  }}
                  style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: `1px solid ${editingId === p.id ? "var(--neon)" : "var(--border)"}`,
                    background: editingId === p.id ? "var(--neon-soft)" : "transparent",
                    color: editingId === p.id ? "var(--neon)" : "var(--muted)", cursor: "pointer",
                  }}
                >
                  ✏️
                </button>
                {/* ⏸ Ativar/desativar */}
                <button
                  aria-label={p.ativo ? `Desativar ${p.nome}` : `Ativar ${p.nome}`}
                  onClick={() => toggleParticipanteAtivo(p.id)}
                  style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 11,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--muted)", cursor: "pointer",
                  }}
                >
                  {p.ativo ? "⏸" : "▶"}
                </button>
                {/* ✕ Remover */}
                <button
                  aria-label={`Remover ${p.nome}`}
                  onClick={() => { removeParticipante(p.id); deleteParticipante(p.id); }}
                  style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 11,
                    border: "1px solid rgba(255,90,90,0.27)", background: "transparent",
                    color: "var(--danger)", cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Formulário de edição inline */}
              {editingId === p.id && (
                <div style={{
                  background: "var(--card)",
                  border: "1px solid var(--neon)44",
                  borderTop: "1px solid var(--border)",
                  borderRadius: "0 0 10px 10px",
                  padding: "12px 14px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      Nome completo
                      <input
                        value={editForm.nome}
                        onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13 }}
                      />
                    </label>
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      Apelido (ranking)
                      <input
                        value={editForm.apelido}
                        onChange={(e) => setEditForm((f) => ({ ...f, apelido: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13 }}
                      />
                    </label>
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      E-mail
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13 }}
                      />
                    </label>
                    <label style={{ fontSize: 12, color: "var(--muted)" }}>
                      Telefone
                      <input
                        type="tel"
                        value={editForm.telefone}
                        onChange={(e) => setEditForm((f) => ({ ...f, telefone: e.target.value }))}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13 }}
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!editForm.apelido) return;
                        updateParticipante(p.id, editForm);
                        updateParticipanteDb(p.id, editForm);
                        setEditingId(null);
                      }}
                      style={{ flex: 2, padding: "8px 0", borderRadius: 7, border: "none", background: "var(--field)", color: "var(--neon)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                    >
                      ✅ Salvar alterações
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Painel principal ─────────────────────────────────────────────
export function AdminPanel() {
  const { adminUnlocked, setAdminUnlocked, adminGrupoId, clearGrupoData } = useBolao();
  const [tab, setTab] = useState<AdminTab>("participantes");
  const adminCfg = ADMINS.find((a) => a.id === adminGrupoId);

  if (!adminUnlocked) return null;

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "participantes", label: "👥 Pessoas" },
    { id: "pontos",        label: "⚖️ Pontos" },
    { id: "palpites",      label: "✏️ Palpites" },
    { id: "resultados",    label: "⚽ Resultados" },
    { id: "desafios",      label: "🎲 Desafios" },
  ];

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="font-bebas" style={{ fontSize: 26, color: "var(--text)", lineHeight: 1 }}>
            🔓 Gerência
          </h2>
          {adminCfg && (
            <p style={{ fontSize: 12, color: "var(--neon)", margin: 0 }}>
              {adminCfg.emoji} {adminCfg.nomeGrupo}
            </p>
          )}
        </div>
        <button
          aria-label="Sair da gerência"
          onClick={() => setAdminUnlocked(false)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer",
          }}
        >
          🔒 Sair
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            aria-label={t.label}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${tab === t.id ? "var(--neon)" : "var(--border)"}`,
              background: tab === t.id ? "var(--neon-soft)" : "transparent",
              color: tab === t.id ? "var(--neon)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === "participantes" && <TabParticipantes />}
      {tab === "pontos"        && <TabPontos />}
      {tab === "palpites"      && <TabPalpites />}
      {tab === "resultados"    && <TabResultados />}
      {tab === "desafios"      && <TabDesafios />}

      {/* Limpar dados do grupo */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {adminCfg && (
          <button
            onClick={() => {
              if (window.confirm(`Apagar TODOS os participantes do ${adminCfg.nomeGrupo}? Não tem volta.`)) {
                clearGrupoData(adminCfg.id);
              }
            }}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 8,
              border: "1px solid rgba(255,90,90,0.33)", background: "transparent",
              color: "var(--danger)", cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}
          >
            🗑️ Limpar participantes do {adminCfg.nomeGrupo}
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm("Isso apaga TUDO (todos os grupos, palpites, desafios). Tem certeza?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer", fontSize: 11,
          }}
        >
          ⚠️ Reiniciar tudo (todos os grupos)
        </button>
      </div>
    </div>
  );
}
