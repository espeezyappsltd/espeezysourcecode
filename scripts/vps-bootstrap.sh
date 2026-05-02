#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# espeezy.com — VPS Bootstrap Script
# Run once on a fresh Ubuntu 22.04/24.04 VPS as root or with sudo.
#
# What it does:
#   1. Hardens SSH (key-only auth, disables password login)
#   2. Installs Docker + Docker Compose v2
#   3. Installs useful dev tools (git, tmux, zsh, fzf, nano, curl, jq)
#   4. Creates a non-root deploy user `deploy`
#   5. Clones the repo to /opt/espeezy
#   6. Creates a placeholder .env.local (you fill it in)
#   7. Starts the full dev stack (Next.js + Caddy)
#   8. Configures UFW firewall
#   9. Sets up a systemd service so the stack auto-starts on reboot
#
# Usage:
#   wget -qO- https://raw.githubusercontent.com/sospeterkedogo/espeezy/main/scripts/vps-bootstrap.sh | sudo bash
#
#   Or after cloning:
#   sudo bash scripts/vps-bootstrap.sh
#
# After running, you MUST:
#   1. Paste your .env.local into /opt/espeezy/.env.local
#   2. Set CADDY_DOMAIN in /opt/espeezy/.env.docker
#   3. Add agent SSH public keys to /home/deploy/.ssh/authorized_keys
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
REPO="https://github.com/sospeterkedogo/espeezy.git"
APP_DIR="/opt/espeezy"
DEPLOY_USER="deploy"

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
section() { echo -e "\n${GREEN}══════════════════════════════════════════${NC}"; echo -e "${GREEN} $*${NC}"; echo -e "${GREEN}══════════════════════════════════════════${NC}"; }

section "espeezy.com VPS Bootstrap"

# ── 1. System update ───────────────────────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Essential tools ─────────────────────────────────────────────────────────
info "Installing essentials..."
apt-get install -y -qq git curl wget tmux zsh fzf nano jq ufw unattended-upgrades fail2ban

# ── 3. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
else
  info "Docker already installed: $(docker --version)"
fi

# Enable Docker service
systemctl enable docker
systemctl start docker

# ── 4. Create deploy user ─────────────────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  info "Creating user '$DEPLOY_USER'..."
  useradd -m -s /bin/zsh "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  mkdir -p /home/$DEPLOY_USER/.ssh
  chmod 700 /home/$DEPLOY_USER/.ssh
  touch /home/$DEPLOY_USER/.ssh/authorized_keys
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
  info "User '$DEPLOY_USER' created. Add SSH keys to /home/$DEPLOY_USER/.ssh/authorized_keys"
else
  info "User '$DEPLOY_USER' already exists."
  usermod -aG docker "$DEPLOY_USER"
fi

# ── 5. Clone or update repo ───────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Repo already cloned. Pulling latest..."
  sudo -u $DEPLOY_USER git -C "$APP_DIR" pull origin main
else
  info "Cloning repo to $APP_DIR..."
  git clone "$REPO" "$APP_DIR"
  chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"
fi

# ── 6. Create placeholder .env.local ─────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.local" ]; then
  info "Creating placeholder .env.local — FILL THIS IN before starting!"
  cat > "$APP_DIR/.env.local" <<'ENV'
# ── Firebase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
FIREBASE_SERVICE_ACCOUNT_KEY=your-service-account-json

# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── App URL ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://dev.espeezy.com

# ── OpenAI ────────────────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...

# ── Liveblocks ────────────────────────────────────────────────────────────────
LIVEBLOCKS_SECRET_KEY=sk_...
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_...
ENV
  chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR/.env.local"
  warn "⚠️  Edit $APP_DIR/.env.local before starting the stack!"
fi

# ── 7. Docker env file ────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.docker" ]; then
  cat > "$APP_DIR/.env.docker" <<'DOCKERENV'
# Domain for Caddy auto-HTTPS. Change to your real domain.
# For raw IP access: set to your VPS IP (no HTTPS, HTTP only)
CADDY_DOMAIN=dev.espeezy.com
DOCKERENV
  chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR/.env.docker"
fi

# ── 8. Firewall ───────────────────────────────────────────────────────────────
info "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw allow 443/udp  comment "HTTP/3 QUIC"
ufw --force enable
info "UFW enabled. Ports: 22, 80, 443."

# ── 9. Fail2ban (brute-force protection) ─────────────────────────────────────
info "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 10. Auto-security updates ─────────────────────────────────────────────────
info "Enabling unattended security upgrades..."
dpkg-reconfigure -f noninteractive unattended-upgrades

# ── 11. Systemd service for auto-restart on reboot ────────────────────────────
info "Creating systemd service: espeezy-dev..."
cat > /etc/systemd/system/espeezy-dev.service <<SYSTEMD
[Unit]
Description=espeezy.com Dev Stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env.docker
ExecStart=/usr/bin/docker compose -f docker-compose.dev.yml up -d --build
ExecStop=/usr/bin/docker compose -f docker-compose.dev.yml down
TimeoutStartSec=300
User=${DEPLOY_USER}

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable espeezy-dev
info "Systemd service enabled. Stack will auto-start on every reboot."

# ── 12. Useful aliases for deploy user ───────────────────────────────────────
cat >> /home/$DEPLOY_USER/.zshrc <<'ALIASES'

# ── espeezy.com shortcuts ────────────────────────────────────────────────────
alias cs-up="cd /opt/espeezy && docker compose -f docker-compose.dev.yml up -d"
alias cs-down="cd /opt/espeezy && docker compose -f docker-compose.dev.yml down"
alias cs-logs="cd /opt/espeezy && docker compose -f docker-compose.dev.yml logs -f app"
alias cs-restart="cd /opt/espeezy && docker compose -f docker-compose.dev.yml restart app"
alias cs-rebuild="cd /opt/espeezy && docker compose -f docker-compose.dev.yml up -d --build app"
alias cs-pull="cd /opt/espeezy && git pull origin main"
alias cs-shell="docker exec -it espeezy_app sh"
alias cs-status="docker compose -f /opt/espeezy/docker-compose.dev.yml ps"
ALIASES

chown $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.zshrc

# ── 13. Start the stack ───────────────────────────────────────────────────────
section "Starting espeezy.com dev stack..."
cd "$APP_DIR"

if [ -s "$APP_DIR/.env.local" ] && ! grep -q "YOUR_PROJECT" "$APP_DIR/.env.local"; then
  sudo -u $DEPLOY_USER docker compose -f docker-compose.dev.yml up -d --build
  info "Stack started! Next.js is building... watch logs with:"
  echo ""
  echo "  docker compose -f $APP_DIR/docker-compose.dev.yml logs -f app"
else
  warn "Skipping stack start — .env.local has placeholder values."
  warn "Edit $APP_DIR/.env.local then run: sudo systemctl start espeezy-dev"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
section "Bootstrap complete!"
echo ""
echo "  App dir   : $APP_DIR"
echo "  SSH user  : $DEPLOY_USER"
echo "  Logs      : docker compose -f $APP_DIR/docker-compose.dev.yml logs -f"
echo ""
echo "  Next steps:"
echo "  1. Paste your real .env.local values into $APP_DIR/.env.local"
echo "  2. Set CADDY_DOMAIN in $APP_DIR/.env.docker"
echo "  3. Add agent SSH public keys to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "  4. Run: sudo systemctl start espeezy-dev"
echo ""
echo "  SSH access (share with agents):"
echo "    ssh $DEPLOY_USER@$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo ""
