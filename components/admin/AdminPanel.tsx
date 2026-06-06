"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { rankWithEff, effPts, mScore, breakdown, bonusPts } from "@/lib/scoring";
import { MATCHES, LOCKED_BETS, ADMINS } from "@/lib/mock-data";
import { participantesToPlayers } from "@/lib/players";
import { useDesafioCats } from "@/lib/useDesafios";

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
  const { adminDelta, setAdminDelta, resetAdminDelta, desafios, comboBank, penalty, participantes, adminGrupoId } = useBolao();
  const DESAFIO_CATS = useDesafioCats();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const meusPart = participantes.filter((p) => p.grupoId === adminGrupoId && p.ativo);
  const players = participantesToPlayers(meusPart, adminDelta);
  const ranked = rankWithEff(players, adminDelta, bonus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
  const { betFix, setBetFix } = useBolao();
  const [drafts, setDrafts] = useState<Record<string, { a: number; b: number }>>({});

  const setDraft = (id: string, side: "a" | "b", dir: 1 | -1) => {
    const prev = drafts[id] ?? { a: LOCKED_BETS.find(b => b.id === id)?.a ?? 0, b: LOCKED_BETS.find(b => b.id === id)?.b ?? 0 };
    const next = Math.min(20, Math.max(0, prev[side] + dir));
    setDrafts((d) => ({ ...d, [id]: { ...prev, [side]: next } }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {LOCKED_BETS.map((bet) => {
        const fixed = betFix[bet.id];
        const draft = drafts[bet.id] ?? { a: bet.a, b: bet.b };
        return (
          <div key={bet.id} style={{
            padding: "12px 14px", background: "var(--bg-2)",
            borderRadius: 10, border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{bet.match}</span>
              {fixed && (
                <span style={{ fontSize: 10, background: "rgba(255,216,77,0.1)", color: "var(--warn)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  corrigido
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{bet.initials}</span>
              <div style={{ flex: 1 }} />
              {/* Stepper simples */}
              {(["a", "b"] as const).map((side, si) => (
                <span key={side} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {si > 0 && <span style={{ color: "var(--muted)" }}>×</span>}
                  <button onClick={() => setDraft(bet.id, side, -1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>−</button>
                  <span className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", minWidth: 20, textAlign: "center" }}>{draft[side]}</span>
                  <button onClick={() => setDraft(bet.id, side, 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>+</button>
                </span>
              ))}
              <button
                aria-label={`Salvar palpite ${bet.id}`}
                onClick={() => setBetFix(bet.id, draft)}
                style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: "none", background: "var(--field)", color: "var(--neon)", cursor: "pointer",
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Aba Resultados ───────────────────────────────────────────────
function TabResultados() {
  const { resultFix, setResultFix, addFeedEvent } = useBolao();
  const [drafts, setDrafts] = useState<Record<string, { sa: number; sb: number }>>({});
  const nonUpcoming = MATCHES.filter((m) => m.status !== "upcoming");

  const setDraft = (id: string, side: "sa" | "sb", dir: 1 | -1) => {
    const m = MATCHES.find((x) => x.id === id)!;
    const prev = drafts[id] ?? { sa: m.sa ?? 0, sb: m.sb ?? 0 };
    const next = Math.min(20, Math.max(0, prev[side] + dir));
    setDrafts((d) => ({ ...d, [id]: { ...prev, [side]: next } }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {nonUpcoming.map((m) => {
        const fixed = resultFix[m.id];
        const draft = drafts[m.id] ?? { sa: m.sa ?? 0, sb: m.sb ?? 0 };
        return (
          <div key={m.id} style={{
            padding: "12px 14px", background: "var(--bg-2)",
            borderRadius: 10, border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {m.a.flag} {m.a.name} × {m.b.name} {m.b.flag}
              </span>
              {fixed && (
                <span style={{ fontSize: 10, background: "rgba(255,216,77,0.1)", color: "var(--warn)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  corrigido
                </span>
              )}
            </div>
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
                aria-label={`Salvar resultado ${m.id}`}
                onClick={() => {
                  setResultFix(m.id, draft);
                  addFeedEvent({
                    type: "result",
                    body: "Resultado confirmado",
                    score: { a: m.a.name, sa: draft.sa, sb: draft.sb, b: m.b.name },
                  });
                }}
                style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: "none", background: "var(--field)", color: "var(--neon)", cursor: "pointer",
                }}
              >
                Salvar
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
  const { participantes, addParticipante, removeParticipante, toggleParticipanteAtivo, adminGrupoId } = useBolao();
  const [form, setForm] = useState({ nome: "", apelido: "", email: "", telefone: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [novoLink, setNovoLink] = useState<{ nome: string; link: string } | null>(null);

  // Mostra só participantes do grupo do admin logado
  const meusPart = participantes.filter((p) => p.grupoId === adminGrupoId);
  const adminCfg = ADMINS.find((a) => a.id === adminGrupoId);

  const handleAdd = () => {
    if (!form.nome || !form.apelido || !adminGrupoId) return;
    const p = addParticipante({ ...form, grupoId: adminGrupoId });
    // Link inclui o apelido para personalizar a tela de entrada
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
      {/* Badge do grupo */}
      {adminCfg && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(0,255,135,0.07)", borderRadius: 8, border: "1px solid rgba(0,255,135,0.2)" }}>
          <span style={{ fontSize: 18 }}>{adminCfg.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--neon)" }}>{adminCfg.nomeGrupo}</span>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{meusPart.length} cadastrado{meusPart.length !== 1 ? "s" : ""}</span>
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
            <div key={p.id} style={{
              background: p.ativo ? "var(--bg-2)" : "var(--bg)",
              borderRadius: 10, border: "1px solid var(--border)",
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
              {/* Copiar link */}
              <button
                aria-label={`Copiar link de ${p.nome}`}
                onClick={() => copyLink(p.token, p.id)}
                title="Copiar link de acesso"
                style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: "1px solid var(--border)", background: "transparent",
                  color: copiedId === p.id ? "var(--ok)" : "var(--muted)", cursor: "pointer",
                }}
              >
                {copiedId === p.id ? "✅ Copiado!" : "🔗 Link"}
              </button>
              {/* Ativar/desativar */}
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
              {/* Remover */}
              <button
                aria-label={`Remover ${p.nome}`}
                onClick={() => removeParticipante(p.id)}
                style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 11,
                  border: "1px solid rgba(255,90,90,0.27)", background: "transparent",
                  color: "var(--danger)", cursor: "pointer",
                }}
              >
                ✕
              </button>
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
