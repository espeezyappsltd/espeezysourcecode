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
| `apps/admin` | Admin console | admin host | `npm run dev:admin` | — |
| `apps/core` | Local-first core runtime | — | `npm run dev:core` | 3000 |
| `apps/shared` | Cross-app UI fragments | — | — | — |

> **Note:** Kanban is the full product surface on `kanban.espeezy.com`, not a separate “MVP” app. The former `apps/dashboard/.../mvp` prototype has been removed.

## Architecture

- **Auth:** Supabase (SSR cookies). Kanban and Games use `src/proxy.ts` (Next.js 16 proxy convention) for session refresh and route protection.
- **Data:** Supabase Postgres + RLS. Server routes use service role only on the server.
- **Prereg:** Marketing site; prereg API may proxy to shared backend routes on the root app.
- **Deploy:** Kanban and Games target **Vercel** (`next build`, server mode). VPS/Caddy paths remain in `Caddyfile` / `docker-compose.local.yml` for self-hosted stacks.

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

## Vercel deployment

Each app is deployed as its own Vercel project with **Root Directory** set to the app folder.

| App | Root Directory | Build |
| --- | --- | --- |
| Kanban | `apps/kanban` | `npm run build` |
| Games | `apps/games` | `npm run build` |
| Prereg | `apps/prereg` | `npm run build` |

Use Node **22.x**. Set Supabase env vars in the Vercel project settings. Run `npm run predeploy:kanban` locally before merging auth or schema changes.

## Package READMEs

- [`apps/kanban/README.md`](../apps/kanban/README.md)
- [`apps/games/README.md`](../apps/games/README.md)

## Sanity checklist for changes

1. Read this file and the package README for the app you edit.
2. Run that app’s `npm run typecheck` (and `predeploy:check` if you touched build/auth).
3. Only run full monorepo checks when you change shared contracts or root routes.
