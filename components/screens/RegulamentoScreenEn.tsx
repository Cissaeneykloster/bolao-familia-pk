"use client";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", letterSpacing: 0.5 }}>{title}</h3>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {rows.map(([a, b], i) => (
          <tr key={i} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
            <td style={{ padding: "6px 8px", color: "var(--muted)" }}>{a}</td>
            <td style={{ padding: "6px 8px", color: "var(--neon)", fontWeight: 700, textAlign: "right" }}>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RegulamentoScreenEn() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>📋 Rules</h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Family Cup Pool · FIFA World Cup 2026</p>
      </div>

      <Section title="1. Objective">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Each participant makes predictions for World Cup matches. Points accumulate throughout the tournament. The player with the highest score at the end wins.
        </p>
      </Section>

      <Section title="2. Group Stage Scoring">
        <Table rows={[
          ["Exact score (both goals correct)", "10 pts"],
          ["Correct winner (or draw)", "5 pts"],
          ["Correct total goals", "3 pts"],
          ["Correct goal difference", "3 pts"],
          ["Correct goals Team A", "2 pts"],
          ["Correct goals Team B", "2 pts"],
          ["Maximum per match", "25 pts 🏆"],
        ]} />
      </Section>

      <Section title="3. Knockout Stage">
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Picking the correct winner earns more points in knockout rounds. Extras remain the same as group stage.
        </p>
        <Table rows={[
          ["Round of 16 — correct winner", "27 pts"],
          ["Quarterfinals", "37 pts"],
          ["Semifinals", "47 pts"],
          ["Final", "57 pts"],
        ]} />
      </Section>

      <Section title="4. Penalty Shootouts">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["✅ Goals scored in regular time count", "✅ Goals scored in extra time count", "❌ Penalty shootout goals do NOT count"].map((item, i) => (
            <p key={i} style={{ fontSize: 13, color: i === 2 ? "var(--danger)" : "var(--text)", margin: 0, fontWeight: i === 2 ? 700 : 400 }}>{item}</p>
          ))}
        </div>
      </Section>

      <Section title="5. Group Qualifiers Prediction (Pre-Cup)">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Before betting on any match, each participant must predict the <strong>top 2 qualifiers for each of the 12 groups</strong>. Position doesn't matter — just getting the right teams.
        </p>
        <Table rows={[
          ["Per correct qualifier", "10 pts"],
          ["Maximum (24 qualifiers × 10)", "240 pts"],
        ]} />
      </Section>

      <Section title="6. Daily Challenge">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Every day, 1 challenge is randomly drawn from the pool (20 options). Complete it and mark ✅ in the app before midnight Vancouver time.
        </p>
        <Table rows={[
          ["🛏️ Bedroom", "+3 pts"],
          ["🏠 Home", "+3 pts"],
          ["❤️ Act of Service", "+5 pts"],
          ["📚 Intellectual", "+4 pts"],
          ["💧 Health", "+3 pts"],
          ["🔥 Combo (all 4 done)", "+10 pts bonus"],
        ]} />
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          * Window: 1am–midnight Vancouver (PDT). No photo needed in the app — post on WhatsApp as proof.
        </p>
      </Section>

      <Section title="7. Match Bet Deadline">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Bets are open until <strong style={{ color: "var(--warn)" }}>5 minutes after kickoff</strong>. After that, no changes allowed.
        </p>
      </Section>

      <Section title="8. Tiebreaker">
        {["1. Most exact scores", "2. Most correct winners", "3. Higher score in the final", "4. Draw or split prize"].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text)" }}>
            <span style={{ color: "var(--neon)", flexShrink: 0 }}>•</span><span>{item}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
