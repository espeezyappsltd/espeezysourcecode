# Espeezy

Espeezy is a student-focused workspace that combines task coordination, social presence, creator tools, marketplace flows, payments, and agent-assisted operations in a single Next.js application.

## What It Does

- Team dashboards for projects, activity, analytics, and shared coordination
- Social and community surfaces including feed, network, presence, chat, and profile systems
- Marketplace and funding flows with Stripe checkout, billing portal, donations, and payment workflows
- Supabase-backed auth, persistence, RLS policies, and real-time collaboration
- Internal agent orchestration for task routing, validation, and admin operations

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Stripe
- Playwright
- Upstash Redis rate limiting
- Liveblocks

## Prerequisites

- Node.js 24.x recommended
- npm 11.x recommended
- Supabase project credentials
- Stripe account and webhook configuration for billing flows

## Getting Started

1. Install dependencies.

```bash
npm install
```

2. Configure environment variables for Supabase, Stripe, email, and any agent or Redis services used in your deployment.

3. Start local development.

```bash
npm run dev
```

4. Open the app in your browser.

```text
http://localhost:3000
```

## Core Scripts

```bash
npm run dev
npm run build
npm test
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list
npx tsc --noEmit
```

## Vercel Deployment

This project is configured for one-click deployment on Vercel.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sospeterkedogo/espeezysourcecode)

### Manual Setup

1. Import the repository into Vercel at [vercel.com/new](https://vercel.com/new).
2. Vercel auto-detects Next.js — no extra framework setting needed.
3. Add the required environment variables in the **Settings → Environment Variables** panel (see `.env.example` for the full list).
4. Click **Deploy**.

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Base64-encoded service-account JSON |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://espeezy.com`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Transactional email |

See `.env.example` for the complete variable reference.

## Resilient VPS Deployment

Use the hardened deploy script to avoid common rollout blockers (stale `node_modules`, port 80/443 collisions, unhealthy app startup):

```bash
npm run deploy:resilient
```

Optional modes:

```bash
# Force edge proxy startup (Caddy profile)
npm run deploy:edge

# Always deploy app only on port 3000
npm run deploy:app-only
```

What it does automatically:

- Pulls latest code with fast-forward only
- Rebuilds and starts the app container
- Waits for container health
- Skips Caddy when host ports 80/443 are already occupied
- Keeps the app live on port 3000 even if edge proxy cannot bind

## Stripe Setup

The application expects Stripe to be configured for:

- Subscription checkout
- One-time purchases and donations
- Billing portal sessions
- Signed webhook delivery

Typical required variables include:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_PRICE_PRO_ID`
- `STRIPE_PRICE_PREMIUM_ID`
- `STRIPE_PRICE_LIFETIME_ID`
- `STRIPE_PORTAL_CONFIGURATION_ID` (optional, but recommended)

Webhook handling lives under the App Router Stripe API endpoints in `src/app/api/stripe/` and payment state transitions are coordinated by `src/workflows/paymentWorkflow.ts`.

## Project Structure

```text
src/
	app/           App Router pages and API routes
	components/    Reusable UI and layout pieces
	context/       React context providers
	services/      Server/client service helpers
	utils/         Shared infrastructure utilities
	workflows/     Long-running business workflows
supabase/        SQL schema and migration history
tests/           Playwright coverage
messages/        Locale message catalogs
mobile-app/      React Native companion app
```

## Quality Gates

Before shipping changes, the repo is expected to pass:

- `npx tsc --noEmit`
- `npx next build`
- `npx playwright test --reporter=list`

For security-sensitive work, also run:

```bash
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list
```

## Notes

- App Router server routes should export `dynamic = 'force-dynamic'` when required by runtime behavior.
- Supabase writes should use the admin client only on the server.
- Stripe and auth failures should return safe JSON responses without leaking internals.
