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
      <Secao titulo="6. Desafio Diário">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          Todo dia é sorteado <strong>1 desafio</strong> de um banco com 20 opções (5 categorias × 4 itens).
          O sorteio pode repetir — sem problema. Cada desafio tem um <strong>código numérico</strong> para fácil identificação.
        </p>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>📋 Categorias e códigos:</p>
          <Tabela rows={[
            ["1.1 a 1.4", "🛏️ Quarto (±3 pts)"],
            ["2.1 a 2.4", "🏠 Casa (±3 pts)"],
            ["3.1 a 3.4", "❤️ Serviço (±5 pts)"],
            ["4.1 a 4.4", "📚 Intelectual (±4 pts)"],
            ["5.1 a 5.4", "💧 Saúde (±3 pts)"],
          ]} />
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>⏰ Horários (referência Vancouver, Canadá):</p>
          <Tabela rows={[
            ["Sorteio / Abertura", "01h Vancouver · 05h Brasília · 09h Lisboa"],
            ["Encerramento",       "00h Vancouver · 04h Brasília · 08h Lisboa"],
            ["Janela aberta",      "~23 horas por dia"],
          ]} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "✅ Marque 'Fiz!' no app dentro da janela → ganha os pontos",
            "❌ Não marcou até encerrar → perde os pontos automaticamente",
            "🔒 Após o encerramento o desafio é bloqueado — não pode mais alterar",
            "📸 Tire foto e poste no grupo do WhatsApp como comprovação",
            "🔄 O sorteio pode repetir desafios — tudo bem!",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text)" }}>
              <span style={{ color: "var(--neon)", fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Exemplo
          titulo="Desafio 3.2 — Preparar o almoço ou jantar (Serviço ±5)"
          linhas={[
            { icon: "🎲", texto: "Sorteado: código 3.2 — Preparar o almoço ou jantar" },
            { icon: "✅", texto: "Você fez e marcou no app", pts: "+5 pts" },
            { icon: "❌", texto: "Não fez (ou não marcou a tempo)", pts: "−5 pts" },
          ]}
        />
      </Secao>

      {/* Previsão dos grupos */}
      <Secao titulo="7. Previsão dos Grupos (Pré-Copa)">
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
          <strong>Antes de apostar em qualquer jogo</strong>, cada participante deve prever quais 2 seleções se classificam em cada um dos 12 grupos (A a L). Não importa a ordem — só importa acertar quem passa.
        </p>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            📋 Regras:
          </p>
          {[
            "Preencha 1º e 2º classificado dos 12 grupos",
            "Clique 'Salvar e Travar Previsões' — após salvar, não pode mais alterar",
            "Se não salvar, trava automaticamente no início do 1º jogo (11/Jun 16h BRT)",
            "Só depois de salvar, os palpites dos jogos são liberados",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
              <span style={{ color: "var(--neon)", flexShrink: 0 }}>{i + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Tabela rows={[
          ["Por classificado acertado", "10 pts"],
          ["Máximo (24 classificados × 10)", "240 pts"],
          ["Posição não importa", "1º ou 2º = tanto faz"],
        ]} />

        <Exemplo
          titulo="Grupo C (Brasil, Marrocos, Haiti, Escócia)"
          linhas={[
            { icon: "📋", texto: "Você previu: Brasil e Marrocos" },
            { icon: "✅", texto: "Brasil classificou", pts: "+10 pts" },
            { icon: "✅", texto: "Marrocos classificou", pts: "+10 pts" },
            { icon: "⚽", texto: "Total do Grupo C", pts: "+20 pts" },
          ]}
        />
      </Secao>

      {/* Prazo */}
      <Secao titulo="8. Prazo para Palpites dos Jogos">
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
