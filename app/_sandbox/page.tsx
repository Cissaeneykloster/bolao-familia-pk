export default function Sandbox() {
  return (
    <div id="app" className="min-h-screen p-8 flex flex-col gap-6">
      <h1 className="font-bebas text-5xl" style={{ color: "var(--neon)" }}>
        BOLÃO FAMÍLIA PK
      </h1>

      <div
        className="rounded-[var(--radius)] p-6 border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>Card de exemplo</p>
        <p className="font-bebas text-3xl mt-1" style={{ color: "var(--gold)" }}>
          241 pts
        </p>
      </div>

      <button
        className="rounded-[var(--radius)] px-6 py-3 font-semibold transition-all"
        style={{
          background: "var(--neon)",
          color: "var(--bg)",
          border: "none",
        }}
      >
        Botão Neon
      </button>

      <div className="flex gap-3">
        <span
          className="animate-pisca px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "var(--live)", color: "#fff" }}
        >
          🔴 AO VIVO
        </span>
        <span
          className="animate-pulso-ouro px-3 py-1 rounded-full text-xs font-bold border"
          style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
        >
          👑 1º lugar
        </span>
      </div>
    </div>
  );
}
