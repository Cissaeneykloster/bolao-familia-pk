# Auditoria de fraude — Bolão Família PK

Conjunto de consultas SQL **somente leitura** para procurar indícios de
manipulação no bolão: palpites alterados depois do jogo começar, resultados
oficiais lançados/mudados em horário suspeito etc. Tudo em **horário de
Brasília** (`America/Sao_Paulo`, UTC−3).

> As queries estão em [`scripts/fraud-audit.sql`](../scripts/fraud-audit.sql).
> Cole cada bloco no **SQL Editor do Supabase** (projeto que hospeda o bolão) e
> rode um por vez.

## ⚠️ Antes de rodar — onde estão os dados

A análise precisa rodar **no projeto Supabase que hospeda o bolão** — aquele
com as tabelas `participantes`, `official_results`, `guesses`, `match_pts` e
`matches`. A conta atualmente conectada via MCP (org *Igor Ferreira LTDA*) tem
dois projetos (*Beta Projects* e *toca-dos-ursos*), e **nenhum deles contém
esse schema** — provavelmente o banco do bolão está em outra conta Supabase.
Por isso as queries vão prontas para você executar no projeto certo.

## O que cada bloco procura

| Bloco | Sinal | Gravidade |
|------|-------|-----------|
| **0** | Sanidade: fuso do banco + contagem de linhas | — |
| **1** | Palpites alterados **após o início do jogo** (`guesses.updated_at > matches.kickoff`) | 🔴 alta |
| **2** | Palpite mexido após o início **e cravando o placar oficial na mosca** | 🔴🔴 prova forte |
| **3** | Palpite alterado **depois** do resultado oficial existir (copiou o gabarito) | 🔴🔴 prova forte |
| **4** | Resultado oficial gravado **antes do apito inicial** (impossível legítimo) | 🟠 média |
| **5** | Resultado oficial gravado **durante o jogo** (lançamento manual do admin) | 🟠 média |
| **6** | **Cruzamento**: palpite mexido ±15 min do momento em que o placar foi gravado | 🔴 alta |
| **7** | Resultado oficial **corrigido mais de 24 h depois** do kickoff | 🟡 baixa |
| **8** | **Placar de suspeitos**: ranking de quem mais mexeu palpite após o início | 📊 resumo |

## Como ler os resultados

- **Bloco 1 e 2** são os mais incriminadores: num bolão honesto, ninguém deveria
  ter `palpite_em_brt` depois do `kickoff_brt`. Qualquer linha aqui é mudança de
  aposta com o jogo rolando. Se em cima disso o palpite **bate exatamente** com o
  resultado oficial (bloco 2), é praticamente certeza de trapaça.
- **Bloco 3** pega cópia do gabarito independentemente do horário do jogo: o
  palpite foi escrito *depois* de o placar oficial já existir.
- **Blocos 4 e 5** olham para o lado do **admin/resultado**. O sync automático da
  ESPN roda 1×/dia (cron) e só preenche jogos **encerrados** — então um placar
  com carimbo *antes do início* ou *durante o jogo* veio de lançamento **manual**.
  Cruze com o bloco 6 para ver se algum palpite foi "ajustado" na mesma janela.
- **Bloco 8** consolida: ordena participantes por nº de palpites pós-início e
  quantos cravaram o oficial — ótimo ponto de partida para a conversa.

## ⚠️ Limitação: não há histórico (ainda)

As tabelas guardam **apenas o último `updated_at`** de cada linha. Dá para ver
**quando** foi a última alteração, mas **não** as alterações intermediárias.
Consequências:

- "Resultado mudou enquanto o jogo acontecia" só é detectável se o **último**
  carimbo cair na janela do jogo (bloco 5). Se o admin mudou o placar durante a
  partida e depois corrigiu, o carimbo intermediário se perdeu.
- "Participante mexeu o palpite 5 vezes" aparece como **uma** linha (a última).

**Solução (bloco [A] do .sql):** instalar uma `audit_log` com triggers em
`official_results` e `guesses`. A partir da instalação, **toda** escrita fica
registrada com o **horário do servidor** (não dá para o cliente forjar), e a
detecção de mudanças durante o jogo passa a ser 100% rastreável. É a recomendação
principal para blindar as próximas rodadas.

## Notas sobre fuso e carimbos de tempo

- O schema define `ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo'`,
  então o painel já exibe em BRT; ainda assim as queries usam
  `AT TIME ZONE 'America/Sao_Paulo'` explicitamente para não depender da sessão.
- O app grava `official_results`/`match_pts` via `nowBrasilia()` e o cron grava
  via `now()` UTC — **ambos representam o mesmo instante absoluto**, então as
  comparações (`>`, `<`) com `matches.kickoff` são corretas independentemente da
  origem da escrita.
- `matches.kickoff` pode ser nulo (jogos de treino/seed). Todas as queries
  filtram `training = false` e `kickoff IS NOT NULL`.
