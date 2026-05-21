# Espeezy Games

Skirmish / quiz games app (Pro tier). Supabase-authenticated Next.js app.

## Stack

- Next.js 16 (App Router, `src/proxy.ts` for session + Pro tier gate)
- Supabase Auth + Postgres

## Local development

```bash
npm install
# Configure .env.local with Supabase URL + anon key
npm run dev                        # http://localhost:3002
```

## Quality gates

```bash
npm run typecheck
npm run predeploy:check            # typecheck + next build
```

## Vercel

Use a **dedicated** Vercel project for games (not panel/prereg). Root `apps/games` picks up `apps/games/vercel.json`.

| Setting | Value |
| --- | --- |
| Root Directory | `apps/games` |
| Framework | Next.js |
| Build Command | *(from `vercel.json`)* `cd ../.. && npm run vercel-build:games` |
| Install Command | *(from `vercel.json`)* `cd ../.. && npm install` |
| Output Directory | `.next` |
| Node | 22.x |

**Do not** use `vercel-build:panel` or root `vercel.json` on this project — that is for `panel.espeezy.com` only (`apps/admin`).

Environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Free-tier users are redirected to login with `?upgrade=1`; Pro/Premium profiles pass through. Access uses the **higher** of `profiles.tier` and `profiles.subscription_plan` (Stripe/Kanban billing).
