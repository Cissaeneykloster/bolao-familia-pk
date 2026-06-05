"use client";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--card)", borderRadius: "var(--radius)",
      border: "1px solid var(--border)", overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", background: "var(--bg-2)",
        borderBottom: "1px solid var(--border)",
      }}>
        <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", letterSpacing: 0.5 }}>
          {titulo}
        </h3>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Tabela({ rows }: { rows: [string, string][] }) {
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

function Exemplo({ titulo, linhas }: { titulo: string; linhas: { icon: string; texto: string; pts?: string }[] }) {
  return (
    <div style={{
      background: "var(--bg-2)", borderRadius: 10,
      border: "1px solid var(--border)", padding: 12,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warn)", marginBottom: 8 }}>
        📌 Exemplo: {titulo}
      </p>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
          <span style={{ color: "var(--text)" }}>{l.icon} {l.texto}</span>
          {l.pts && <span style={{ color: "var(--neon)", fontWeight: 700 }}>{l.pts}</span>}
        </div>
      ))}
    </div>
  );
}

export function RegulamentoScreen() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
          📋 Regulamento
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Bolão da Copa da Família · Copa do Mundo 2026
        </p>
      </div>

      {/* Objetivo */}
      <Secao titulo="1. Objetivo">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Cada participante faz seus palpites para os jogos da Copa do Mundo.
          Os pontos são somados ao longo do torneio.
          Ao final, vence quem tiver a maior pontuação.
        </p>
      </Secao>

      {/* Fase de grupos */}
      <Secao titulo="2. Fase de Grupos">
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Em cada partida você pode somar pontos pelo placar exato e por acertos adicionais.
        </p>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            🎯 Pontuação por critério:
          </p>
          <Tabela rows={[
            ["Placar exato (acertou os dois gols)",  "10 pts"],
            ["Acertou o vencedor (ou empate)",        "5 pts"],
            ["Total de gols correto",                 "3 pts"],
            ["Diferença de gols correta",             "3 pts"],
            ["Gols do Time A correto",                "2 pts"],
            ["Gols do Time B correto",                "2 pts"],
            ["Máximo por jogo",                       "25 pts 🏆"],
          ]} />
        </div>

        <Exemplo
          titulo="Brasil 2×1 Japão (palpite: 2×1)"
          linhas={[
            { icon: "✅", texto: "Placar exato", pts: "+10" },
            { icon: "✅", texto: "Vencedor", pts: "+5" },
            { icon: "✅", texto: "Total de gols (3)", pts: "+3" },
            { icon: "✅", texto: "Diferença (1 gol)", pts: "+3" },
            { icon: "✅", texto: "Gols Brasil (2)", pts: "+2" },
            { icon: "✅", texto: "Gols Japão (1)", pts: "+2" },
            { icon: "🏆", texto: "Total", pts: "25 pts" },
          ]}
        />

        <Exemplo
          titulo="Brasil 2×1 (palpite: 3×0)"
          linhas={[
            { icon: "❌", texto: "Placar exato", pts: "+0" },
            { icon: "✅", texto: "Vencedor (Brasil)", pts: "+5" },
            { icon: "❌", texto: "Total de gols", pts: "+0" },
            { icon: "✅", texto: "Diferença (1 gol)", pts: "+3" },
            { icon: "❌", texto: "Gols Brasil", pts: "+0" },
            { icon: "❌", texto: "Gols adversário", pts: "+0" },
            { icon: "⚡", texto: "Total", pts: "8 pts" },
          ]}
        />
      </Secao>

      {/* Fase mata-mata */}
      <Secao titulo="3. Fase Mata-Mata">
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Nas fases eliminatórias, acertar o vencedor vale muito mais pontos.
          Os extras mantêm os mesmos valores da fase de grupos.
        </p>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            🏆 Pontos por acertar o vencedor:
          </p>
          <Tabela rows={[
            ["Oitavas de final",  "27 pts"],
            ["Quartas de final",  "37 pts"],
            ["Semifinais",        "47 pts"],
            ["Final",             "57 pts"],
          ]} />
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            ⚡ Pontos extras (iguais à fase de grupos):
          </p>
          <Tabela rows={[
            ["Placar exato",          "10 pts"],
            ["Total de gols correto",  "3 pts"],
            ["Diferença de gols",      "3 pts"],
            ["Gols Time A",            "2 pts"],
            ["Gols Time B",            "2 pts"],
          ]} />
        </div>

        <Exemplo
          titulo="Oitavas: Brasil 1×1 França — pênaltis Brasil 4×3"
          linhas={[
            { icon: "✅", texto: "Vencedor (Brasil)", pts: "+27" },
            { icon: "✅", texto: "Total de gols (2)", pts: "+3" },
            { icon: "✅", texto: "Diferença (0)", pts: "+3" },
            { icon: "✅", texto: "Gols Brasil (1)", pts: "+2" },
            { icon: "✅", texto: "Gols França (1)", pts: "+2" },
            { icon: "🏆", texto: "Total (palpite 1×1 Brasil)", pts: "37 pts" },
          ]}
        />
      </Secao>

      {/* Regra pênaltis */}
      <Secao titulo="4. Pênaltis — Regra Importante">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>Contam os gols do <strong>tempo normal</strong></p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>Contam os gols da <strong>prorrogação</strong></p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>❌</span>
            <p style={{ fontSize: 13, color: "var(--danger)", margin: 0, fontWeight: 600 }}>NÃO contam os gols de pênaltis</p>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            Os pênaltis servem apenas para definir quem avança.
            O placar do bolão considera somente <strong style={{ color: "var(--text)" }}>tempo normal + prorrogação</strong>.
          </p>
        </div>

        <Exemplo
          titulo="Final: Argentina 2×2 Espanha (prorroga→ Arg 3×2)"
          linhas={[
            { icon: "📋", texto: "Placar do bolão: Argentina 3×2", pts: "" },
            { icon: "✅", texto: "Vencedor (Argentina)", pts: "+57" },
            { icon: "✅", texto: "Total (5 gols)", pts: "+3" },
            { icon: "✅", texto: "Diferença (1 gol)", pts: "+3" },
            { icon: "✅", texto: "Gols Argentina (3)", pts: "+2" },
            { icon: "✅", texto: "Gols Espanha (2)", pts: "+2" },
            { icon: "🏆", texto: "Total máximo possível", pts: "77 pts" },
          ]}
        />
      </Secao>

      {/* Desempate */}
      <Secao titulo="5. Critério de Desempate">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "1º — Mais placares exatos acertados",
            "2º — Mais vencedores acertados",
            "3º — Maior pontuação na final",
            "4º — Sorteio ou divisão do prêmio",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text)" }}>
              <span style={{ color: "var(--neon)", fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Secao>

      {/* Desafios */}
      <Secao titulo="6. Pontos dos Desafios (Bônus)">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Além dos palpites dos jogos, cada participante pode ganhar pontos extras
          completando os <strong>desafios diários</strong> sorteados — e perder pontos
          se não cumprir. Os pontos dos desafios somam diretamente ao total do ranking.
        </p>
        <Tabela rows={[
          ["🛏️ Quarto",        "±3 pts"],
          ["🏠 Casa",           "±3 pts"],
          ["❤️ Serviço",        "±5 pts"],
          ["📚 Intelectual",    "±4 pts"],
          ["💧 Saúde",          "±3 pts"],
          ["🔥 Combo (4/4)",    "+10 pts bônus"],
        ]} />
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          * Comprove com foto para garantir os pontos. Sem comprovação ao encerrar o dia → perde os pontos.
        </p>
      </Secao>

      {/* Prazo */}
      <Secao titulo="7. Prazo para Palpites">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Os palpites ficam abertos até <strong style={{ color: "var(--warn)" }}>5 minutos após o início</strong> de cada jogo.
          Após esse prazo, não é possível fazer ou alterar palpites para aquela partida.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          O contador de tempo aparece em cada jogo na tela ⚽ Jogos.
        </p>
      </Secao>
    </div>
  );
}
