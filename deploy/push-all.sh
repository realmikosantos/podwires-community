#!/usr/bin/env bash
# ============================================================
# Podwires VPS — Deploy ALL apps to Contabo Sydney
# Deploys: Community + PodwiresBot in one command
#
# Usage:
#   bash deploy/push-all.sh <SERVER_IP> [ssh_key_path]
#
# Example:
#   bash deploy/push-all.sh 194.233.xxx.xxx
#   bash deploy/push-all.sh 194.233.xxx.xxx ~/.ssh/contabo_rsa
# ============================================================
set -euo pipefail

SERVER_IP="${1:-}"
SSH_KEY="${2:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[ALL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
banner() { echo -e "\n${BLUE}════════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}════════════════════════════════════════${NC}\n"; }

[[ -z "$SERVER_IP" ]] && fail "Usage: bash deploy/push-all.sh <SERVER_IP> [ssh_key_path]"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
COMMUNITY_DIR="$(dirname "$SCRIPT_DIR")"
BOT_DIR="$MONOREPO_ROOT/Podwires Robot/podwiresbot"

# Verify bot directory exists
[[ ! -d "$BOT_DIR" ]] && fail "PodwiresBot not found at: $BOT_DIR"

SSH_ARG_FLAG=""
[[ -n "$SSH_KEY" ]] && SSH_ARG_FLAG="$SSH_KEY"

banner "Deploying Community + PodwiresBot → $SERVER_IP"

# ── Deploy Community ─────────────────────────────────────────
banner "1/2 Community"
if [[ -n "$SSH_ARG_FLAG" ]]; then
  bash "$SCRIPT_DIR/push.sh" "$SERVER_IP" "$SSH_ARG_FLAG"
else
  bash "$SCRIPT_DIR/push.sh" "$SERVER_IP"
fi

# ── Deploy PodwiresBot ───────────────────────────────────────
banner "2/2 PodwiresBot"
if [[ -n "$SSH_ARG_FLAG" ]]; then
  bash "$BOT_DIR/deploy/push.sh" "$SERVER_IP" "$SSH_ARG_FLAG"
else
  bash "$BOT_DIR/deploy/push.sh" "$SERVER_IP"
fi

# ── Final status check ───────────────────────────────────────
SSH_ARGS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
[[ -n "$SSH_KEY" ]] && SSH_ARGS="$SSH_ARGS -i $SSH_KEY"

banner "PM2 Status"
ssh $SSH_ARGS "root@$SERVER_IP" "pm2 list"

log ""
log "════════════════════════════════════════"
log "All apps deployed to $SERVER_IP"
log ""
log "  Community:   https://community.podwires.com"
log "  PodwiresBot: pm2 logs podwiresbot"
log ""
warn "First deploy? Fill in .env files:"
warn "  ssh root@$SERVER_IP"
warn "  nano /home/podwires/community/server/.env"
warn "  nano /home/podwires/podwiresbot/.env"
warn "  pm2 reload all --update-env"
log "════════════════════════════════════════"
