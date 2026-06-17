⚽ **Bolão Família PK** — bolão da Copa do Mundo 2026 para grupos de família e amigos: palpites nos jogos, previsão dos classificados, desafios diários e ranking ao vivo. Construído com Next.js + Supabase.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Sync automático de resultados da Copa (ESPN)

Os placares oficiais são preenchidos automaticamente a partir do scoreboard
público da ESPN (JSON, **sem chave de API**). O admin continua no controle:
revisa no painel e ajusta o que quiser — o sync **nunca sobrescreve** um placar
já existente, então as correções do admin prevalecem.

- **Endpoint:** `GET /api/sync-results` busca os jogos encerrados na ESPN, casa
  com os jogos do app (de-para por código FIFA em `lib/results-api.ts`, com
  reorientação mandante/visitante), grava em `official_results` **apenas os que
  faltam** e recalcula `match_pts` com a mesma regra do admin (`computeMatchPts`).
  Jogos não-casados voltam em `unmatched` (úteis para refinar o de-para).
- **Disparo:** Vercel Cron (`vercel.json`) **1x/dia** (13:00 UTC) — o plano
  **Hobby só permite cron diário**. O admin também pode disparar sob demanda pelo
  botão **🔄 Sincronizar agora** na aba Resultados. Para sync mais frequente sem o
  Pro, aponte um cron externo grátis (ex.: cron-job.org) para `/api/sync-results`.
- **Variáveis de ambiente (Vercel → Project Settings → Environment Variables):**
  - `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ou
    `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — acesso ao banco
  - `ESPN_SCOREBOARD_URL` — opcional; sobrescreve a URL da fonte ESPN

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
