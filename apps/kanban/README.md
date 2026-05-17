# Espeezy Kanban

Production kanban workspace at **https://kanban.espeezy.com**. Group projects, contribution records, analytics, and the full authenticated scholar dashboard.

## Stack

- Next.js 16 (App Router, `src/proxy.ts` for Supabase session + route guard)
- Supabase Auth + Postgres
- Deployed on **Vercel** (server mode — not static export)

## Local development

```bash
npm install
# Use repo-root .env.local or apps/kanban/.env.local
npm run dev                        # http://localhost:3001
```

## Quality gates (run before deploy)

```bash
npm run typecheck
npm run predeploy:check            # typecheck + next build
```

## Vercel

| Setting | Value |
| --- | --- |
| Root Directory | `apps/kanban` |
| Framework | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm install` (from monorepo root if using workspaces) |
| Node | 22.x |

Required environment variables (see `src/lib/supabase/env.ts`):

- `NEXT_PUBLIC_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_PROJECT_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server routes / admin only)

## Auth

Unauthenticated users are redirected to `/login`. Public routes (login, auth callbacks, docs, legal pages) are allowlisted in `src/proxy.ts`.

## Espeezy Credits (assets & marketplace)

- **50 credits** ≈ 1 month Pro (£4.99 reference)
- **Max asset / listing value: 100 credits** (2 months Pro) — enforced in `/api/assets` and `/api/marketplace`
- Personal arsenal stores `credit_value` in `personal_assets.metadata`
- Marketplace digital listings use `price` as **credit** amount (not USD)

## E2E tests

```bash
npm run test:e2e:completion
```

Requires live Supabase credentials in `.env.local` (see `src/tests/lib/load-test-env.ts`).
