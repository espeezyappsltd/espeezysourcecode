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

| Setting | Value |
| --- | --- |
| Root Directory | `apps/games` |
| Framework | Next.js |
| Build Command | `npm run build` |
| Node | 22.x |

Environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Free-tier users are redirected to login with `?upgrade=1`; Pro/Premium profiles pass through.
