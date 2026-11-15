# Critique

Paste a URL, get a blunt, actionable audit: SEO, performance, accessibility,
security, content, and AI-readability. Free, no tiers, no gating. Every finding
ships with a concrete fix. See [`REPORT.md`](./REPORT.md) for what is built, and
[`/rubric`](http://localhost:3000/rubric) for how scoring works.

## Stack

Next.js 15 (App Router, JavaScript only — no TypeScript) · Tailwind v4 with a
CSS-first token system · Radix primitives owned and restyled · Prisma + Postgres ·
Better Auth (magic link) · keyless PageSpeed Insights.

## Local development

```bash
pnpm install
cp .env.example .env            # then edit values
docker run -d --name critique-postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=critique \
  -p 5432:5432 postgres:16-alpine
pnpm exec prisma migrate deploy
pnpm dev
```

- Magic links print to the server console (there is no email service by design).
- PSI runs keyless; when the shared quota is exhausted the report says so and
  never scores a zero.
- The "Ask the AIs" panel needs `GROQ_API_KEY` and/or `OPENROUTER_API_KEY`
  (both have free tiers); without keys it degrades to an honest "no api key".

## Deploy (Vercel + Neon)

1. Create a Neon project; copy the **pooled** connection string
   (`...-pooler...neon.tech/critique?sslmode=require`).
2. Push to GitHub, import the repo in Vercel.
3. Set environment variables in Vercel (Project → Settings → Environment Variables):
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `AUTH_SECRET` | `openssl rand -hex 32` |
   | `BETTER_AUTH_URL` | `https://your-domain` |
   | `GROQ_API_KEY` / `OPENROUTER_API_KEY` | optional, free tiers |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `NEXT_PUBLIC_GOOGLE_ENABLED` | optional |
4. Run `pnpm exec prisma migrate deploy` against the Neon URL once
   (`DATABASE_URL=... pnpm exec prisma migrate deploy` from CI or locally).
5. Deploy. `/robots.txt` and `/rubric` ship with the app.

Scan route handlers declare `maxDuration = 60`; on Vercel's free Hobby plan
functions default to enough wall time for the 45s crawl budget.

## Scripts

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm exec prisma migrate dev` — apply schema changes locally
