# Espeezy Monorepo

This repository contains the main Espeezy platform, three standalone marketing/product apps, shared UI fragments, Firebase support packages, and a mobile client. The codebase mixes Next.js, Firebase, Supabase-compatible abstractions, Cloud Functions, and supporting scripts, so this README is intended to be the single entry point that explains what lives where.

## Workspace Map

| Path | Purpose | Local command | Default port |
| --- | --- | --- | --- |
| `.` | Main Espeezy web platform and shared backend routes | `npm run dev` | `3000` |
| `apps/prereg` | Early-access / preregistration site | `npm --prefix apps/prereg run dev` | `3001` |
| `apps/games` | Games landing app with Supabase auth | `npm --prefix apps/games run dev` | `3002` |
| `apps/kanban` | Kanban landing app with Supabase auth | `npm --prefix apps/kanban run dev` | `3003` |
| `apps/core` | Local-first core runtime (4th app target) | `npm --prefix apps/core run dev` | `3010` |
| `apps/shared` | Shared app-level components used by sub-apps | n/a | n/a |
| `functions` | Firebase Cloud Functions package | `npm --prefix functions run serve` | emulator-managed |
| `mobile-app` | Expo / React Native client | `npm --prefix mobile-app run start` | Expo-managed |
| `espeezydbcodebase` | Secondary Firebase/TS package kept in-repo | package-specific | n/a |

## Architecture At A Glance

- The root app in `src/` is the main product surface and also hosts shared backend routes such as `src/app/api/preregister/route.ts`.
- `apps/prereg`, `apps/games`, and `apps/kanban` are standalone Next.js apps with their own `package.json` files and build pipelines.
- `apps/shared` currently holds shared cross-app UI fragments. The sub-apps import from here or from `apps/prereg/src` depending on the component.
- The main preregistration backend lives in the root app and is reused by the prereg sub-app via a thin proxy route.
- Auth is not fully unified internally: parts of the root app still rely on Firebase flows, while the games and kanban apps use Supabase auth directly.
- Firebase support code lives in both the root app and the `functions` package.

## Root App Responsibilities

The root application is where the broadest product surface exists today.

- Main marketing and registration pages
- Dashboard and authenticated product areas
- API routes for preregistration, billing, support, student flows, agents, and integrations
- Stripe payment flows
- Playwright test suite and deployment scripts

Important source areas:

```text
src/app/           App Router pages and API routes
src/components/    Shared web UI
src/context/       React providers
src/services/      Server/client service helpers
src/utils/         Infrastructure and auth helpers
src/workflows/     Business workflows
tests/             Playwright tests
messages/          i18n catalogs
scripts/           Deployment and migration helpers
```

## Quick Start

### 1. Install root dependencies

```bash
npm install
```

Install dependencies for any standalone packages you plan to run locally:

```bash
npm --prefix apps/prereg install
npm --prefix apps/games install
npm --prefix apps/kanban install
npm --prefix apps/core install
npm --prefix functions install
npm --prefix mobile-app install
```

### 2. Configure environment

There is no single authoritative `.env.example` at the root yet, so treat environment setup as package-specific.

At minimum, expect to configure:

- Supabase URL and anon/service credentials
- Firebase client/admin credentials
- Stripe secrets and webhook secrets
- SMTP credentials for email delivery
- Optional websocket / agent / Redis infrastructure variables

The games and kanban apps already ship local examples for their browser-side values.

### 3. Run the package you care about

```bash
# main app
npm run dev

# prereg app
npm --prefix apps/prereg run dev

# games app
npm --prefix apps/games run dev

# kanban app
npm --prefix apps/kanban run dev

# core app (new local VM-focused main runtime)
npm --prefix apps/core run dev
```

### Local VM Docker Runtime (Core App)

Use the dedicated local compose file to run only the new core app and its minimal core services:

```bash
npm run docker:core:up
```

Shutdown:

```bash
npm run docker:core:down
```

The compose definition lives at `docker-compose.core.local.yml` and is designed for local/small-VM execution, not cloud deployment.

## Common Commands

### Root app

```bash
npm run dev
npm run build
npm run lint
npm test
```

### Sub-app predeploy checks

```bash
npm run predeploy:prereg
npm run predeploy:games
npm run predeploy:kanban
npm run predeploy:apps
```

### Security / quality checks

```bash
npx tsc --noEmit
npx next build
npx playwright test --reporter=list
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list
```

## Deployment Notes

The root app has a hardened deployment path intended for VPS rollouts:

```bash
npm run deploy:resilient
```

Other modes:

```bash
npm run deploy:edge
npm run deploy:app-only
```

The script is designed to:

- pull with fast-forward only
- rebuild and restart the app container
- wait for health before switching over
- tolerate 80/443 conflicts by falling back to app-only mode

## Current Repo Conventions

- Next.js App Router is the default for web apps.
- Dynamic server routes should export `dynamic = 'force-dynamic'` when runtime behavior requires it.
- Server-side writes should stay on privileged server paths.
- `apps/prereg` proxies preregistration requests to the root app instead of owning the canonical backend.
- Games and Kanban builds should pass from inside each package before cross-app changes are considered done.

## README Index

Package-specific docs live here:

- `apps/prereg/README.md`
- `apps/games/README.md`
- `apps/kanban/README.md`
- `apps/shared/README.md`
- `functions/README.md`
- `mobile-app/README.md`
- `espeezydbcodebase/README.md`

## Sanity Rules For Working In This Repo

If you are onboarding or returning after time away, start with this sequence:

1. Read this file.
2. Read `CODEBASE_NAVIGATION.md` for a file-level jump map.
3. Read the package README for the area you are editing.
4. Run only the package-level build or typecheck that matches your change.
5. Only run the full root build/test suite when your change actually touches the root app or shared backend behavior.

That is the fastest path to avoiding cross-package confusion in this repository.
