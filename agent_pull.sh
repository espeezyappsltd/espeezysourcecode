#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR" && pwd)"
APP_DIR="/opt/espeezy"

# Use /opt/espeezy if it exists (VPS), otherwise use repo root (local/dev)
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$REPO_ROOT"
fi

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }

info "Syncing code from GitHub..."
info "Using app directory: $APP_DIR"
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
  # Try to pull main or current branch
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
if git rev-parse --verify HEAD@{1} >/dev/null 2>&1 && git diff HEAD@{1} HEAD --name-only | grep -q "package.*json"; then
  warn "package.json changed — reinstalling deps..."
  if [ -f "docker-compose.dev.yml" ] && docker ps | grep -q espeezy_app; then
    docker exec espeezy_app npm ci --prefer-offline
  else
    npm ci --prefer-offline
  fi
  info "Dependencies updated."
fi

info "Done. Latest commit: $(git log -1 --pretty='%h %s (%ar)')"
