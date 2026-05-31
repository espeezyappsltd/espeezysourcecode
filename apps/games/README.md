# Espeezy Games

Skirmish / quiz games app (Pro tier). Supabase-authenticated Next.js app.

## Stack

- Next.js 16 (App Router, `src/middleware.ts` for session + Pro tier gate)
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

## Cloudflare

Worker **`espeezy-games`** serves **games.espeezy.com**. Config: `apps/games/wrangler.toml`.

| Step | Command |
| --- | --- |
| Build | `npm run cf-build` or `npm run cf-build:games` (repo root) |
| Deploy | `npm run deploy:cf` |

See [`internaldocs/cloudflare-deployment.md`](../../internaldocs/cloudflare-deployment.md).

Environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Free-tier users are redirected to login with `?upgrade=1`; Pro/Premium profiles pass through. Access uses the **higher** of `profiles.tier` and `profiles.subscription_plan` (Stripe/Kanban billing).
