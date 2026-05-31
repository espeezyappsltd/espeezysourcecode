# Espeezy Monorepo

This repository contains the Espeezy platform: standalone Next.js apps, shared UI, Supabase-backed auth, and deployment tooling.

## Workspace map

| Path | Purpose | Production URL | Local dev | Port |
| --- | --- | --- | --- | --- |
| `.` | Monorepo root / legacy routes | varies | `npm run dev` | 3000 |
| `apps/prereg` | Early access & marketing | prereg / espeezy.com | `npm run dev:prereg` | 3001 |
| `apps/kanban` | **Main scholar workspace** (kanban, analytics, chillout) | **https://kanban.espeezy.com** | `npm --prefix apps/kanban run dev` | 3001 |
| `apps/games` | Skirmish / quiz (Pro tier) | games subdomain | `npm run dev:games` | 3002 |
| `apps/dashboard` | Internal dashboard | dashboard host | `npm run dev:dashboard` | — |
| `apps/admin` | **Panel** (staff console) | **https://panel.espeezy.com** | `npm run dev:admin` | 3004 |
| `apps/core` | Local-first core runtime | — | `npm run dev:core` | 3000 |
| `apps/shared` | Cross-app UI fragments | — | — | — |

> **Note:** Kanban is the full product surface on `kanban.espeezy.com`, not a separate “MVP” app. The former `apps/dashboard/.../mvp` prototype has been removed.

## Architecture

- **Auth:** Supabase (SSR cookies). Kanban and Games use `src/proxy.ts` (Next.js 16 proxy convention) for session refresh and route protection.
- **Data:** Supabase Postgres + RLS. Server routes use service role only on the server.
- **Prereg:** Marketing site; prereg API may proxy to shared backend routes on the root app.
- **Deploy:** Production apps target **Cloudflare Workers** via OpenNext (`cf-build`, `wrangler deploy`). Docker/Caddy in `Caddyfile` remains for local/self-hosted stacks only.

## Quick start

```bash
npm install
npm --prefix apps/kanban install
npm --prefix apps/games install
```

Copy environment variables from repo-root `.env.local` (or per-app `.env.local`). Required for kanban/games:

- `NEXT_PUBLIC_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_PROJECT_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (kanban server/admin routes)

```bash
npm run dev:games          # http://localhost:3002
npm --prefix apps/kanban run dev   # http://localhost:3001
```

## Commands

### Typecheck

```bash
npm run typecheck:kanban
npm run typecheck:games
npm run typecheck:prereg
```

### Predeploy (typecheck + production build)

```bash
npm run predeploy:kanban
npm run predeploy:games
npm run predeploy:apps
```

### Kanban E2E

```bash
npm --prefix apps/kanban run test:e2e:completion
```

## Cloudflare deployment

Each app is a **Cloudflare Worker** (OpenNext) with custom-domain routing on `espeezy.com`. See [`internaldocs/cloudflare-deployment.md`](cloudflare-deployment.md).

| App | Worker | Hostname(s) | Build |
| --- | --- | --- | --- |
| Kanban | `espeezy-kanban` | kanban.espeezy.com | `npm run cf-build:kanban` |
| Games | `espeezy-games` | games.espeezy.com | `npm run cf-build:games` |
| Prereg | `espeezy-prereg` | espeezy.com, www | `npm run cf-build:prereg` |
| **Panel (Admin)** | `espeezy-panel` | panel.espeezy.com | `npm run cf-build:panel` |
| Studios | `espeezy-studios` | studios.espeezy.com | `npm run cf-build:espeezystudios` |
| Dashboard | `espeezy-dashboard` | dashboard.espeezy.com | `npm run cf-build:dashboard` |

```bash
npm run validate:cloudflare   # wrangler + routing parity
npm run deploy:cf:kanban      # build + wrangler deploy one app
npm run deploy:cf             # all apps (requires CLOUDFLARE_API_TOKEN)
```

Use Node **22.x**. Set Supabase and app secrets as **Worker variables** in the Cloudflare dashboard (or `wrangler secret put`). Run `npm run predeploy:kanban` locally before merging auth or schema changes.

## Package READMEs

- [`apps/kanban/README.md`](../apps/kanban/README.md)
- [`apps/games/README.md`](../apps/games/README.md)

## Sanity checklist for changes

1. Read this file and the package README for the app you edit.
2. Run that app’s `npm run typecheck` (and `predeploy:check` if you touched build/auth).
3. Only run full monorepo checks when you change shared contracts or root routes.
