# Planka (Espeezy) — Supabase Stack

This folder runs Planka using Supabase Postgres (no local Postgres container).

## 1) Prepare env

```bash
cd /home/runner/work/espeezysourcecode/espeezysourcecode/apps/kanban/planka
cp .env.production.example .env.production
```

Generate `SECRET_KEY`:

```bash
openssl rand -hex 64
```

Paste it into `.env.production` and set secure credentials.
Set `SUPABASE_DB_URL` in both `.env.local` and `.env.production`.

Use the Supabase connection string with:

- `sslmode=require`
- `options=-csearch_path%3Dplanka%2Cpublic`

Example:

```bash
postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require&options=-csearch_path%3Dplanka%2Cpublic
```

## 2) Apply Supabase migration

Run SQL from:

```bash
supabase/migrations/20260509_planka_schema.sql
```

This creates the dedicated `planka` schema used by the Planka container.

## 3) Run locally

```bash
cd /home/runner/work/espeezysourcecode/espeezysourcecode/apps/kanban/planka
npm run dev
```

Background mode:

```bash
npm run dev:detached
```

Migrate and create admin user locally:

```bash
npm run db:migrate:local
npm run db:create-admin:local
```

Stop local stack:

```bash
npm run dev:down
```

## 4) Run in production

```bash
npm run db:migrate:prod
npm run db:create-admin:prod
npm run prod
```

Logs and stop:

```bash
npm run prod:logs
npm run prod:down
```

## 5) Branding defaults

The stack starts with Espeezy-branded defaults:

- `DEFAULT_PROJECT_NAME=Espeezy Workspace`
- `DEFAULT_BOARD_NAME=Kanban Board`

Use your reverse proxy to serve `BASE_URL` (for example `https://kanban.espeezy.com`).
