# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed.
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/ess.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -d "/opt/espeezy/.git" ]; then   APP_DIR="/opt/espeezy"; else   APP_DIR="$REPO_ROOT"; fi
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
info "Using app directory: $APP_DIR"
cd "$APP_DIR"
# Stash any accidental local changes (agents shouldn't leave uncommitted changes)
STASHED=false
if ! git diff --quiet; then   warn "Uncommitted changes detected — stashing before pull";   git stash push -m "agent-sync auto-stash $(date -u +%Y%m%dT%H%M%SZ)";   STASHED=true; fi
# Pull latest
git fetch --prune origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" = "$REMOTE" ]; then   info "Already up to date ($(git rev-parse --short HEAD))."; else   git pull --ff-only origin main;   info "Updated to $(git rev-parse --short HEAD)."; fi
if $STASHED; then   warn "Restoring stash...";   git stash pop || warn "Stash pop failed — check git stash list"; fi
# Check if node_modules is stale (package.json changed)
if git rev-parse --verify HEAD@{1} >/dev/null 2>&1 && git diff HEAD@{1} HEAD --name-only | grep -q "package.*json"; then   warn "package.json changed — reinstalling deps inside container...";   docker exec espeezy_app npm ci --prefer-offline;   info "Dependencies updated."; fi
# Hot reload is automatic via WATCHPACK_POLLING — no restart needed.
# But if the app container crashed, bring it back up.
RUNNING=$(docker inspect --format='{{.State.Running}}' espeezy_app 2>/dev/null || echo "false")
if [ "$RUNNING" != "true" ]; then   warn "App container is not running — restarting stack...";   docker compose -f "$APP_DIR/docker-compose.dev.yml" up -d;   info "Stack restarted."; else   info "App container is healthy. Hot reload active — changes live."; fi
info "Done. Latest commit: $(git log -1 --pretty='%h %s (%ar)')"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, Claude, etc.) SSH in and run this script to pull
# the latest code. Next.js hot-reload picks up changes instantly via the
# volume mount — no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
# It can also be run manually for quick syncs without needing to log in and run git pull.
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
#
#   Or from inside the VPS:
#   cs-pull  (alias set up by vps-bootstrap.sh)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — Agent Sync Script
#
# Agents (GitHub Copilot, ChatGPT, etc.) SSH in and run this script to pull the latest code: 
#   ssh deploy@YOUR_VPS_IP "bash /espeezy/scripts/ess.sh" 
# Next.js hot-reload picks up changes instantly via the
# volume mount so no container restart needed. This keeps the agent dev loop super fast.
#
# This script is intended to run from a GitHub Actions workflow.
#
# It can be triggered on a schedule (e.g. every hour) to keep the VPS code in sync with GitHub, ensuring agents always have the latest code and dependencies.
#
# It can also be run manually for quick syncs without needing to log in and run git pull.
#
# It handles stashing any accidental local changes, pulling the latest code, and then popping the stash.
#
# It also checks if package.json or package-lock.json changed and runs npm ci inside the container if needed.
# 
# Finally, it verifies the app container is running and restarts the stack if it crashed. 
#
# Usage:
#   ssh deploy@YOUR_VPS_IP "bash /espeezy/scripts/ess.sh"
#
#   Or from inside the VPS:
#   scripts/ess.sh  (alias set up by user [pete])
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/opt/espeezy"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info() { echo -e "${GREEN}[agent-sync]${NC} $*"; }
warn() { echo -e "${YELLOW}[agent-sync]${NC} $*"; }
err()  { echo -e "${RED}[agent-sync]${NC} $*"; exit 1; }
info "Syncing code from GitHub..."
cd "$APP_DIR"
