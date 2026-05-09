# Planka Production (Espeezy)

This folder ports the official Planka production Docker setup into this repository for the Kanban surface.

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

## 2) Create admin user and start

```bash
docker compose --env-file .env.production -f docker-compose.production.yml run --rm planka npm run db:create-admin-user
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

## 3) Branding defaults

The stack starts with Espeezy-branded defaults:

- `DEFAULT_PROJECT_NAME=Espeezy Workspace`
- `DEFAULT_BOARD_NAME=Kanban Board`

Use your reverse proxy to serve `BASE_URL` (for example `https://kanban.espeezy.com`).
