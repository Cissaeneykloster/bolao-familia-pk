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

## Sync automático de resultados da Copa

Os placares oficiais podem ser preenchidos automaticamente a partir da
[football-data.org](https://www.football-data.org/) (plano grátis cobre a
competição FIFA World Cup, código `WC`).

- **Cron (Vercel):** `vercel.json` agenda `GET /api/sync-results` **1x/dia** (13:00 UTC) —
  o plano **Hobby só permite cron diário**. Para sync mais frequente (jogos saem
  ao longo do dia): no **Pro**, troque o `schedule` para `*/30 * * * *`; sem Pro,
  aponte um cron externo grátis (ex.: cron-job.org) para a URL `/api/sync-results`
  enviando o header `Authorization: Bearer <CRON_SECRET>`.
- **O que o endpoint faz:** busca os jogos `FINISHED`, casa com os jogos do app
  (de-para em `lib/results-api.ts`, por código FIFA + reorientação do placar),
  grava os novos/alterados em `official_results` e recalcula `match_pts` com a
  mesma regra do admin (`computeMatchPts`). Jogos não-casados voltam em
  `unmatched` na resposta (úteis para refinar o de-para).
- **Variáveis de ambiente (Vercel → Project Settings → Environment Variables):**
  - `FOOTBALL_DATA_API_KEY` — chave grátis da football-data.org (obrigatória)
  - `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ou
    `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — acesso ao banco
  - `CRON_SECRET` — recomendada; a Vercel envia `Authorization: Bearer <CRON_SECRET>`
    e o endpoint recusa chamadas sem esse header quando a variável existe

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
