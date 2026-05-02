#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.dev.yml"
APP_SERVICE="app"
EDGE_SERVICE="caddy"
APP_CONTAINER="Espeezy_App"
APP_URL="http://127.0.0.1:3000/api/health"
START_EDGE="auto"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
err() { echo -e "${RED}[deploy]${NC} $*"; exit 1; }

usage() {
  cat <<'USAGE'
Usage: ./scripts/deploy-resilient.sh [--with-edge|--no-edge]

Options:
  --with-edge   Always try to start caddy (profile: edge).
  --no-edge     Never start caddy. Deploy app only.
  --help        Show this message.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --with-edge)
      START_EDGE="yes"
      ;;
    --no-edge)
      START_EDGE="no"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      err "Unknown argument: $1"
      ;;
  esac
  shift
done

[ -f "$COMPOSE_FILE" ] || err "Missing $COMPOSE_FILE in $(pwd)"
command -v docker >/dev/null 2>&1 || err "docker is not installed"

docker info >/dev/null 2>&1 || err "docker daemon is not reachable"

docker compose -f "$COMPOSE_FILE" config >/dev/null

if [ ! -f .env.local ]; then
  warn "Missing .env.local. App may boot in degraded mode."
fi

info "Pulling latest code..."
git fetch --prune origin
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git pull --ff-only origin "$CURRENT_BRANCH"

info "Recreating app service..."
docker compose -f "$COMPOSE_FILE" down || true
docker compose -f "$COMPOSE_FILE" up -d --build "$APP_SERVICE"

info "Waiting for app container health..."
for i in $(seq 1 40); do
  STATUS="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$APP_CONTAINER" 2>/dev/null || echo unknown)"
  if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "running" ]; then
    break
  fi
  if [ "$i" -eq 40 ]; then
    docker compose -f "$COMPOSE_FILE" logs --tail=120 "$APP_SERVICE" || true
    err "App failed to become healthy"
  fi
  sleep 2
done

if curl -fsS "$APP_URL" >/dev/null 2>&1; then
  info "App health endpoint is reachable"
else
  warn "Health endpoint did not return success; app may still be warming up"
fi

PORT80_BUSY=false
PORT443_BUSY=false
if ss -ltn '( sport = :80 )' | grep -q ':80'; then
  PORT80_BUSY=true
fi
if ss -ltn '( sport = :443 )' | grep -q ':443'; then
  PORT443_BUSY=true
fi

if [ "$START_EDGE" = "no" ]; then
  warn "Skipping edge proxy (requested --no-edge)"
elif [ "$START_EDGE" = "auto" ] && { [ "$PORT80_BUSY" = true ] || [ "$PORT443_BUSY" = true ]; }; then
  warn "Skipping edge proxy because host ports 80/443 are in use"
  warn "Run with --with-edge after freeing ports"
else
  info "Starting edge proxy (caddy profile)..."
  if docker compose -f "$COMPOSE_FILE" --profile edge up -d "$EDGE_SERVICE"; then
    info "Edge proxy started"
  else
    warn "Edge proxy failed to start; app remains live on port 3000"
  fi
fi

info "Deployment completed"
docker compose -f "$COMPOSE_FILE" ps
