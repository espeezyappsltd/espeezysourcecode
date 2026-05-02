# EspeezyBible.md


Espeezy Tool Factory: Practical, copy-paste operations guide for Windows + Linux + Docker + GitHub + VPS + agent workflows.

Audience: Non-technical operators, Builders and Validators.

Goal: Make setup, deploy, rollback, and verification repeatable with minimal mistakes.

---

## 0) Golden Rules (Read First)

1. Work from WSL Ubuntu for speed and fewer path issues.
2. Never commit secrets (`.env.local`, `.env`, private keys).
3. Run type check + build before push.
4. Deploy by pulling from GitHub on VPS using `scripts/ess.sh`.0
5. If something breaks, use the rollback steps exactly.

---

## 1) Quick Start (15-Minute Setup)

### Windows Host

1. Install WSL2 Ubuntu:

```powershell
wsl --install -d Ubuntu
wsl --set-default-version 2
```

2. Install Docker Desktop:
- Enable `Use the WSL 2 based engine`.
- Enable WSL integration for Ubuntu.

3. Verify in Ubuntu shell:

```bash
docker --version
docker compose version
git --version
node -v
npm -v
```

Target stack:
- Node.js 24.x
- npm 11.x
- lockfileVersion 3

### Clone + Run App Locally (WSL)

```bash
cd ~
git clone https://github.com/EspeezyTeam/espeezysourcecode.git
cd EspeezyApp
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` 
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AGENT_API_KEY`

Start app:

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker ps
docker logs -f Espeezy_App
```

---

## 2) VPS Setup (Production-Like)

### Provision VPS (Ubuntu 22.04/24.04)

Minimum recommended:
- 2 vCPU
- 4 GB RAM
- 40 GB SSD

### Bootstrap Commands (Run on VPS)

```bash
sudo apt update && sudo apt -y upgrade
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo apt -y install curl git ufw ca-certificates gnupg

sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
newgrp docker

docker --version
docker compose version
```

### Clone and Launch on VPS

```bash
sudo mkdir -p /opt
sudo chown deploy:deploy /opt
cd /opt
git clone https://github.com/EspeezyTeam/espeezysourcecode.git EspeezyApp
cd /opt/espeezy
cp .env.example .env.local
```

Fill `.env.local` with real values, then:

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker ps
docker logs -f Espeezy_App
```

---

## 3) Agent Sync Workflow (Preferred Deploy Path)

Use this script for updates:
- `scripts/agent-pull.sh`

Remote pull from your machine:

```bash
ssh deploy@YOUR_VPS_IP "bash /opt/espeezy/scripts/agent-pull.sh"
```

Inside VPS shell:

```bash
bash /opt/espeezy/scripts/agent-pull.sh
```

What it already handles:
- Stashes local uncommitted edits.
- Fast-forwards from `origin/main`.
- Reinstalls dependencies when package files changed.
- Restarts stack only if app container is down.

---

## 4) Tool Factory: Commands By Job

## 4.1 Build + Type Safety

### Bash

```bash
npm ci
npx tsc --noEmit
npm run build
```

### PowerShell

```powershell
npm ci
npx tsc --noEmit
npm run build
```

## 4.2 Tests

### Bash

```bash
npx playwright test --reporter=list
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list
```

### PowerShell

```powershell
npx playwright test --reporter=list
npx playwright test tests/security-adversarial.spec.ts --project=security --reporter=list
```

## 4.3 Docker Controls

### Bash

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml down
docker ps
docker logs -f espeezy_app
docker exec -it espeezy_app sh
```


```

## 4.4 Git Fast Lane

### Bash

```bash
git status
git checkout -b feat/my-change
git add -A
git commit -m "feat(scope): short description"
git pull --rebase origin main
git push -u origin feat/my-change
```



## 4.5 GitHub CLI

```bash
gh auth login
gh repo view sospeterkedogo/groupflow
gh pr create --fill
gh pr status
gh run list
gh run watch
```

## 4.6 URL Health Checks

### Bash

```bash
curl -I https://espeezy.com/preregister
curl -I https://espeezy.com
curl -I https://espeezy.com/terms
curl -I https://espeezy.com/privacy
curl -I https://espeezy.com/contact
curl -I https://espeezy.com/
curl -I https://espeezy.com/robots.txt
```

### PowerShell

```powershell
curl.exe -I https://espeezy.com
curl.exe -I https://espeezy.com/terms
curl.exe -I https://espeezy.com/privacy
curl.exe -I https://espeezy.com/contact
curl.exe -I https://espeezy.com/robots.txt
```

Expected: HTTP 200 for all pages above.

---


### PowerShell

```powershell
git status
git checkout -b feat/my-change
git add -A
git commit -m "feat(scope): short description"
git pull --rebase origin main
git push -u origin feat/my-change


```

### PowerShell

```powershell
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml down
docker ps
docker logs -f espeezy_app
docker exec -it espeezy_app sh


## ) Idiot-Proof Deploy Checklist (Copy This Every Time)

1. Pull latest and switch to main.
2. Install dependencies (`npm ci`).
3. Run type check (`npx tsc --noEmit`).
4. Run build (`npm run build`).
5. Run required tests.
6. Commit with clear message.
7. Push branch and merge to main.
8. Run VPS sync script.
9. Verify public URLs return 200.
10. Verify app logs show no crash loop.

---

## 6) Failure Playbooks

## 6.1 Next Build Lock Error

### Bash

```bash
pkill -f "next build" || true
rm -f .next/build.lock
npm run build
```

### PowerShell

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item .next\build.lock -Force -ErrorAction SilentlyContinue
npm run build
```

## 6.2 Container Won't Start

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
docker logs -f espeezy_app
```

## 6.3 Bad Deployment Rollback

On VPS:

```bash
cd /opt/espeezy
git log --oneline -n 10
git reset --hard <GOOD_COMMIT_SHA>
docker compose -f docker-compose.dev.yml up -d --build
```

Note: rollback rewrites working tree state on VPS. Only do this on server copy.

## 6.4 Env/Firebase/Stripe Runtime Failures

1. Confirm `.env.local` exists and keys are non-empty.
2. Confirm key names match `.env.example` exactly.
3. Restart stack after env changes.
4. Check app logs for first thrown error line.

---

## 7) Secrets and Security

1. Do not commit `.env.local`.
2. Rotate leaked keys immediately.
3. Store long-term secrets in managed secret stores.
4. Keep `FIREBASE_SERVICE_ACCOUNT_KEY` server-only.
5. Never expose service role key in browser/client code.

---

## 8) Agent Team Operating Model

Suggested sequence for feature delivery:
1. Backend builder implements API/migration.
2. Backend validator runs security checks.
3. Frontend builder wires UI to service functions.
4. Frontend validator runs Playwright + accessibility.
5. DevOps builder runs final build/deploy.
6. DevOps validator checks logs, secrets, health endpoints.

Definition of done:
- Type check passes.
- Build passes.
- Security tests pass target.
- Critical public URLs return 200.

---

## 9) One-Command Aliases (Optional, Huge Speed Boost)

Add to `~/.bashrc` on WSL/VPS:

```bash
alias gf='cd ~/espeezy'
alias gfb='cd ~/espeezy && npm ci && npx tsc --noEmit && npm run build'
alias gft='cd ~/espeezy && npx playwright test --reporter=list'
alias gfd='cd ~/espeezy && docker compose -f docker-compose.dev.yml up -d --build'
alias gfl='docker logs -f Espeezy_App'
alias gfs='bash /opt/espeezy/scripts/agent-pull.sh'
```

Apply aliases:

```bash
source ~/.bashrc
```

---

## 10) Command Reference by Platform

## Windows PowerShell

```powershell
wsl -d Ubuntu
git status
docker ps
npm run build
```

## Ubuntu Bash (WSL or VPS)

```bash
git status
docker ps
npm run build
```

## CMD (if needed)

```cmd
git status
docker ps
npm run build
```

---

## 11) Daily 60-Second Triage

Run in this order:

1. `git status`
2. `docker ps`
3. `npx tsc --noEmit`
4. `npm run build`
5. `curl -I https://espeezy.com`
6. `docker logs --tail 80 Espeezy_App`

If all are healthy, proceed.

---

## 12) Stripe Business URL Verification Prep

Before submitting website in Stripe dashboard, verify:

1. `https://espeezy.com` returns 200.
2. `https://espeezy.com/terms` returns 200.
3. `https://espeezy.com/privacy` returns 200.
4. `https://espeezy.com/contact` returns 200.
5. `https://espeezy.com/robots.txt` returns 200.
6. No blanket bot-blocking for Stripe crawler user agent.

Quick probe:

```bash
curl -I https://espeezy.com https://espeezy.com/terms https://espeezy.com/privacy https://espeezy.com/contact https://espeezy.com/robots.txt
```

---

## 13) Emergency Contacts (Fill These)

- Primary owner: <SOSPETERKEDOGO>
- Infra owner: <SOSPETERKEDOGO>
- Domain DNS owner: <SOSPETERKEDOGO>
- Stripe account owner: <SOSPETERKEDOGO>
- Firebase owner: <SOSPETERKEDOGO>
- Contact info: <'Website: https://me.devpete.co.uk/'>
---

## 14) Final Note

If in doubt, do not improvise in production.

Use this order:
1. Reproduce
2. Collect logs
3. Type check
4. Build
5. Test
6. Deploy with `agent-pull.sh`
7. Verify URLs and logs
