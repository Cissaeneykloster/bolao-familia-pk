# Plano — Persistência no back-end + Autenticação por usuário (Nível 3)

**Escopo:** núcleo (palpites, previsões de grupos, autenticação + RLS).
Desafios/feed no banco e cálculo de pontos server-side ficam para uma fase futura.

**Estratégia de auth:** convite do Supabase Auth por link (uso único, expira) →
participante define senha no primeiro acesso → RLS real por usuário.
O admin continua copiando o link e mandando no WhatsApp, como faz hoje —
`auth.admin.generateLink({ type: "invite" })` devolve o link pronto, **sem
precisar configurar SMTP**.

---

## Fase 1 — Persistência imediata de palpites e previsões (quick win)

Independe de auth. Estanca a perda de dados hoje mesmo, com o modelo atual.

1. **Ligar a escrita de palpites**
   - `saveGuess` no store (`lib/store.ts:217`) é um no-op. Passar a chamar
     `upsertGuess` (`lib/supabase-sync.ts:160`) com o `currentUserApelido`.
   - Tratar usuário não identificado (sem apelido → salvar só local + avisar).
2. **Sync de `group_predictions`**
   - Criar `loadGroupPredictions(apelido)` e `upsertGroupPredictions(...)` em
     `lib/supabase-sync.ts` (a tabela já existe no schema).
   - Chamar no `saveGroupPredictions` do store e no `useSupabaseSync` (carga
     inicial), incluindo o flag `saved` (trava).
3. **Merge na carga**: ao carregar palpites do servidor, servidor vence para
   jogos já travados; local vence para rascunhos não salvos.
4. **Testes**: cobrir gravação/carga com o mock de `@supabase/supabase-js`
   já existente em `__mocks__/`.

**Entrega:** palpites e previsões sobrevivem a troca de aparelho/limpeza de
navegador. Risco baixo; nenhuma mudança de schema.

---

## Fase 2 — Schema e fundações de identidade

Preparar o banco para auth sem ainda mudar o fluxo do usuário.

1. **Migração de schema** (novo arquivo `supabase/migrations/...sql`):
   - `participantes`: adicionar `user_id UUID UNIQUE REFERENCES auth.users(id)`.
   - `guesses` e `group_predictions`: adicionar `participante_id TEXT
     REFERENCES participantes(id)` e `grupo_id TEXT` (hoje a chave é só
     `apelido`, que colide entre grupos).
   - `match_pts`: adicionar `grupo_id` (mesmo motivo).
   - Backfill: preencher as novas colunas a partir do apelido atual.
2. **Tabela `admins`** (ou claim no JWT): substituir o array `ADMINS` com
   senhas hardcoded em `lib/mock-data.ts:41-43`. Config de grupo (nome, emoji,
   idioma) vira tabela `grupos`.
3. **Código de sync**: passar a gravar/ler pelas novas chaves
   (`participante_id`), mantendo `apelido` apenas para exibição.

**Entrega:** banco íntegro e pronto para RLS; nenhuma mudança visível.

---

## Fase 3 — Supabase Auth: convite, senha e login

1. **Edge Function `invite-participante`** (usa a service role key, que nunca
   vai ao navegador):
   - Recebe `{ participanteId }`, valida que o chamador é admin.
   - Cria o usuário no Auth (`auth.admin.createUser` com o e-mail do
     participante) se não existir, liga `participantes.user_id`.
   - Gera e devolve o link de convite (`generateLink type: "invite"`).
2. **Admin (`AdminPanel`)**: o botão de link (`copyLink`,
   `AdminPanel.tsx:527`) passa a chamar a Edge Function e copiar o link de
   convite em vez de `?p=Apelido`. Botão extra "reenviar convite/resetar
   senha" (gera link `recovery`).
   - Participante sem e-mail: usar e-mail sintético
     `apelido.grupoId@bolao.local` (login por apelido+senha na prática).
3. **Rota `/entrar` reescrita**:
   - Recebe o callback do convite (`verifyOtp`), cria a sessão e mostra a
     tela **"defina sua senha"** (`auth.updateUser({ password })`).
   - Após definir, segue para o app com grupo/apelido resolvidos a partir de
     `participantes.user_id` — some o `?p=` da URL.
4. **Tela de login** (novo): e-mail (ou apelido → e-mail sintético) + senha,
   com "esqueci a senha" (admin gera link recovery). Sessão persiste no
   dispositivo; login só é repetido em aparelho novo ou logout.
5. **Login do admin**: vira usuário do Auth com flag em `admins`; remover
   `findAdmin`/senhas do bundle. `AdminGate` passa a checar a sessão.
6. **Store**: `currentUserApelido` derivado da sessão (não mais editável via
   URL/localStorage).

**Entrega:** cada usuário tem senha própria; link de convite é de uso único e
expira; impersonação por URL deixa de existir.

---

## Fase 4 — RLS real (fechar o banco)

Só ativar depois que a Fase 3 estiver em produção e todos migrados.

1. Remover as políticas `acesso_total` (`supabase-schema.sql:67-71`).
2. Novas políticas:
   - `participantes`: SELECT para autenticados do mesmo grupo; INSERT/UPDATE/
     DELETE só admin.
   - `guesses` / `group_predictions`: SELECT autenticados; INSERT/UPDATE
     apenas onde `participante.user_id = auth.uid()`.
   - `official_results`, `match_pts`, `grupos`: SELECT autenticados; escrita
     só admin.
3. **Trava de palpite server-side**: trigger em `guesses` rejeitando
   INSERT/UPDATE após o kickoff (tabela `matches` mínima só com `id` +
   `kickoff`, populada a partir de `mock-data`).
4. Smoke test com a chave anônima pura (sem sessão) confirmando que escrita
   é negada.

**Entrega:** mesmo com a chave anônima pública, ninguém lê/escreve fora das
próprias permissões.

---

## Fase 5 — Migração dos usuários e rollout

1. **Backfill de contas**: script/Edge Function que cria usuários Auth para os
   37 participantes existentes e liga `user_id`.
2. **Janela de transição**: links antigos `/entrar/{grupo}?p=` continuam
   funcionando por ~1 semana mostrando "seu acesso mudou — peça o novo link",
   enquanto o admin distribui os convites pelo WhatsApp.
3. **Migração do dado local**: no primeiro login autenticado, palpites locais
   ainda não presentes no servidor são enviados uma única vez (merge).
4. Desativar a rota legada e ativar a Fase 4 (RLS).

---

## Fase 6 — Desafio diário automático com banner

Hoje o sorteio é manual e local: cada participante clica em "sortear"
(`SorteioDoDia.tsx`) e o resultado sai do `Math.random` do próprio aparelho —
cada um tira um desafio diferente e nada é compartilhado. Objetivo: **todo dia
um desafio é selecionado automaticamente, igual para todo o grupo, exibido em
banner na tela inicial, e o próprio participante valida se realizou**.

1. **Banco de desafios no Supabase** (tabela `desafios`): migrar a lista que
   o gestor edita (hoje só em `localStorage`, `desafioCatsByGroup`) para o
   banco, por grupo. Pré-requisito do sorteio único: todos precisam ver a
   mesma lista.
2. **Sorteio determinístico por dia**: trocar `rollDailyChallenge(Math.random)`
   por um sorteio com semente `hash(grupoId + dataVancouver)`. Todo
   dispositivo calcula o mesmo resultado, sem cron e sem servidor — o desafio
   "aparece sozinho" na virada do dia (a infra de janela/timezone em
   `lib/daily.ts` já existe e é reaproveitada). Remover o botão "sortear".
3. **Banner na tela inicial**: novo componente `DesafioDoDiaBanner` exibido
   no topo da tela Ranking (tela inicial do app) com o desafio do dia,
   countdown da janela e botão "✅ Fiz!" — tocar leva à tela de Desafios para
   detalhes. A autovalidação existente (`markChallengeDone`) é mantida.
4. **Persistir a validação** (tabela `desafios_concluidos`:
   `participante_id, date, done`): a marcação deixa de ser só local —
   sobrevive a troca de aparelho e permite ao feed/ranking mostrar quem
   cumpriu o desafio do dia.
5. **Testes**: sorteio determinístico (mesma data+grupo ⇒ mesmo desafio;
   dias diferentes ⇒ distribuição variada), banner, gravação da conclusão.

**Entrega:** desafio único por dia para o grupo todo, visível na tela
inicial, com validação do próprio usuário salva no back-end.

---

## Ordem de execução e dependências

```
Fase 1 (independente, deploy imediato)
Fase 2 → Fase 3 → Fase 5 → Fase 4
Fase 6 (itens 1–3 independentes; item 4 idealmente após a Fase 3,
        para gravar a conclusão com o usuário autenticado)
```

A Fase 4 é deliberadamente a última: ligar RLS antes de todos terem conta
derrubaria os usuários atuais.

## Riscos e pontos de atenção

- **E-mails ausentes/errados no cadastro**: e-mail sintético cobre quem não
  tem; admin pode corrigir e reenviar convite.
- **Link de convite expira** (24h por padrão): admin reenvia com um clique —
  já previsto na UI da Fase 3.
- **Testes**: o mock de Supabase em `__mocks__/` precisa ganhar `auth.*`;
  os testes de admin que digitam a senha `3015` serão reescritos.
- **Sorteio determinístico**: se o gestor editar a lista de desafios no meio
  do dia, o desafio sorteado pode mudar (a semente é a mesma, mas o pool
  muda). Mitigação: congelar edições para o dia corrente ou registrar o
  sorteio do dia na tabela na primeira abertura.
- **Fora de escopo (registrado para depois)**: feed no banco, pontos de
  partidas calculados no servidor, jogos vindos de tabela em vez de
  `mock-data.ts`.
