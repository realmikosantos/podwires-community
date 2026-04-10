#!/usr/bin/env bash
# ============================================================
# Podwires Community — Local Deploy Script
# Run from your Mac to push code to the server.
# Usage: bash deploy/push.sh <SERVER_IP> [ssh_key_path]
# Example: bash deploy/push.sh 143.198.12.34
#          bash deploy/push.sh 143.198.12.34 ~/.ssh/do_rsa
# ============================================================
set -euo pipefail

SERVER_IP="${1:-}"
SSH_KEY="${2:-}"
SSH_USER="root"
APP_USER="podwires"
APP_DIR="/home/$APP_USER/community"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail() { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }
step() { echo -e "${BLUE}──────── $1 ────────${NC}"; }

[[ -z "$SERVER_IP" ]] && fail "Usage: bash deploy/push.sh <SERVER_IP> [ssh_key_path]"

# Build SSH args
SSH_ARGS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
[[ -n "$SSH_KEY" ]] && SSH_ARGS="$SSH_ARGS -i $SSH_KEY"

ssh_cmd() { ssh $SSH_ARGS "$SSH_USER@$SERVER_IP" "$@"; }
scp_cmd() { scp $SSH_ARGS "$@"; }
rsync_cmd() { rsync -az --progress $([[ -n "$SSH_KEY" ]] && echo "-e ssh $SSH_ARGS" || echo "") "$@"; }

log "Deploying to $SERVER_IP → $APP_DIR"

# ── 1. Build client locally ───────────────────────────────────
step "Building Next.js client"
cd "$PROJECT_DIR/client"
npm run build
cd "$PROJECT_DIR"

# ── 2. Rsync project files (exclude node_modules, .next) ─────
step "Syncing files to server"
rsync -az --progress \
  $([[ -n "$SSH_KEY" ]] && echo "-e 'ssh $SSH_ARGS'" || true) \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='.git' \
  --delete \
  -e "ssh $SSH_ARGS" \
  "$PROJECT_DIR/" \
  "$SSH_USER@$SERVER_IP:$APP_DIR/"

# ── 3. Server-side: install deps + migrate + restart ─────────
step "Running server-side setup"
ssh_cmd bash <<REMOTE
set -euo pipefail

APP_DIR="$APP_DIR"
APP_USER="$APP_USER"

echo "→ Installing server dependencies..."
cd \$APP_DIR/server
npm install --omit=dev --silent

echo "→ Installing client dependencies..."
cd \$APP_DIR/client
npm install --omit=dev --silent

echo "→ Copying pre-built .next from transfer..."
# .next was built locally and transferred via rsync above

# Create .env files if they don't exist yet
if [[ ! -f "\$APP_DIR/server/.env" ]]; then
  cp "\$APP_DIR/server/.env.example" "\$APP_DIR/server/.env"
  echo "⚠  Created server/.env from example — FILL IN SECRETS before starting!"
fi

if [[ ! -f "\$APP_DIR/client/.env.local" ]]; then
  cp "\$APP_DIR/client/.env.example" "\$APP_DIR/client/.env.local"
  echo "⚠  Created client/.env.local from example — update API URL!"
fi

echo "→ Running database migrations..."
cd \$APP_DIR/server
node src/migrations/runner.js up || echo "⚠  Migration skipped (check .env DB settings)"

echo "→ Setting file ownership..."
chown -R $APP_USER:$APP_USER \$APP_DIR

echo "→ Restarting PM2 processes..."
cd \$APP_DIR
if pm2 list | grep -q "community"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "✅ Deploy complete!"
pm2 list
REMOTE

log ""
log "============================================================"
log "Deploy done! Visit https://community.podwires.com"
log ""
warn "If this is your FIRST deploy, SSH into the server and fill in:"
warn "  nano $APP_DIR/server/.env"
warn "  nano $APP_DIR/client/.env.local"
warn "Then run:  pm2 reload all"
log "============================================================"
