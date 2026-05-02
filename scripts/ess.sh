#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script (Scripts Dir Version)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/espeezy"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }

info "Syncing code from GitHub..."
cd "$APP_DIR"

# Stash any accidental local changes
STASHED=false
if ! git diff --quiet; then
  warn "Uncommitted changes detected — stashing before pull"
  git stash push -m "agent-sync auto-stash $(date -u +%Y%m%dT%H%M%SZ)"
  STASHED=true
fi

# Pull latest
info "Fetching latest changes..."
git fetch --prune origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "HEAD")

if [ "$LOCAL" = "$REMOTE" ]; then
  info "Already up to date ($(git rev-parse --short HEAD))."
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  info "Pulling latest from $BRANCH..."
  git pull --ff-only origin "$BRANCH"
  info "Updated to $(git rev-parse --short HEAD)."
fi

if $STASHED; then
  warn "Restoring stash..."
  git stash pop || warn "Stash pop failed — check git stash list"
fi

# Check if node_modules is stale
if git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "package.*json"; then
  warn "package.json changed — reinstalling deps..."
  if [ -f "docker-compose.dev.yml" ] && docker ps | grep -q Espeezy_app; then
    docker exec Espeezy_app npm ci --prefer-offline
  else
    npm ci --prefer-offline
  fi
  info "Dependencies updated."
fi

# Ensure app is running
if [ -f "docker-compose.dev.yml" ]; then
  RUNNING=$(docker inspect --format='{{.State.Running}}' Espeezy_App 2>/dev/null || echo "false")
  if [ "$RUNNING" != "true" ]; then
    warn "App container is not running — restarting full stack (app + caddy)..."
    docker compose -f docker-compose.dev.yml up -d
    info "Stack restarted."
  else
    info "App container is healthy."
    # Ensure Caddy is also running (may have been profile-gated previously)
    CADDY_RUNNING=$(docker inspect --format='{{.State.Running}}' espeezy_caddy_cache 2>/dev/null || echo "false")
    if [ "$CADDY_RUNNING" != "true" ]; then
      warn "Caddy container not running — starting..."
      docker compose -f docker-compose.dev.yml up -d caddy
      info "Caddy started."
    fi
  fi
fi

info "Done. Latest commit: $(git log -1 --pretty='%h %s (%ar)')"
