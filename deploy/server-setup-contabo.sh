#!/usr/bin/env bash
# ============================================================
# Podwires VPS — Full Server Bootstrap
# Contabo Sydney | Ubuntu 22.04/24.04
# Sets up: Community + PodwiresBot on one server
#
# Run ONCE as root:
#   bash server-setup-contabo.sh
# ============================================================
set -euo pipefail

# ── Config ───────────────────────────────────────────────────
APP_USER="podwires"
COMMUNITY_DIR="/home/$APP_USER/community"
BOT_DIR="/home/$APP_USER/podwiresbot"
DB_NAME_COMMUNITY="podwires_community"
DB_NAME_BOT="podwiresbot"
DB_USER="podwires_db"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24)}"
NODE_VERSION="20"
COMMUNITY_DOMAIN="community.podwires.com"
EMAIL="miko@podwires.com"
# ─────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
step() { echo -e "${BLUE}──── $1 ────${NC}"; }

[[ $EUID -ne 0 ]] && echo "Run as root: sudo bash $0" && exit 1

step "1/12 System update"
apt-get update -qq && apt-get upgrade -y -qq

step "2/12 Essential packages"
apt-get install -y -qq \
  curl wget git unzip build-essential \
  ufw fail2ban \
  software-properties-common gnupg ca-certificates \
  certbot python3-certbot-nginx

step "3/12 Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
apt-get install -y -qq nodejs
log "Node $(node -v) | npm $(npm -v)"

step "4/12 PM2 (process manager)"
npm install -g pm2 --quiet
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

step "5/12 PostgreSQL 16"
sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | tee /etc/apt/trusted.gpg.d/postgresql.asc >/dev/null
apt-get update -qq && apt-get install -y -qq postgresql-16 postgresql-client-16
systemctl enable postgresql && systemctl start postgresql

sudo -u postgres psql <<SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

CREATE DATABASE $DB_NAME_COMMUNITY OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME_COMMUNITY TO $DB_USER;

CREATE DATABASE $DB_NAME_BOT OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME_BOT TO $DB_USER;

ALTER USER $DB_USER CREATEDB;
SQL
log "PostgreSQL: created databases '$DB_NAME_COMMUNITY' and '$DB_NAME_BOT'"

step "6/12 App user + directories"
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi
mkdir -p "$COMMUNITY_DIR" "$BOT_DIR" "/home/$APP_USER/logs"
chown -R "$APP_USER:$APP_USER" "/home/$APP_USER"

step "7/12 Nginx"
apt-get install -y -qq nginx
systemctl enable nginx

# Community Nginx config
cat > /etc/nginx/sites-available/$COMMUNITY_DOMAIN <<'NGINX'
limit_req_zone $binary_remote_addr zone=community_api:10m rate=10r/s;

upstream community_frontend { server 127.0.0.1:3000; keepalive 64; }
upstream community_backend  { server 127.0.0.1:5000; keepalive 64; }

server {
    listen 80;
    server_name community.podwires.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name community.podwires.com;

    ssl_certificate     /etc/letsencrypt/live/community.podwires.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/community.podwires.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    client_max_body_size 50M;

    # API → Express (port 5000)
    location /api/ {
        limit_req zone=community_api burst=20 nodelay;
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io → Express (WebSocket)
    location /socket.io/ {
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Next.js frontend (port 3000)
    location / {
        proxy_pass http://community_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://community_frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    access_log /var/log/nginx/community.access.log;
    error_log  /var/log/nginx/community.error.log;
}
NGINX

ln -sf /etc/nginx/sites-available/$COMMUNITY_DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

step "8/12 UFW Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

step "9/12 fail2ban"
systemctl enable fail2ban && systemctl start fail2ban

step "10/12 Unified PM2 ecosystem"
cat > /home/$APP_USER/ecosystem.config.cjs <<ECOSYSTEM
module.exports = {
  apps: [
    // ── Podwires Community — Express + Socket.io API ──────────────
    {
      name: 'community-api',
      script: './server/src/index.js',
      cwd: '/home/podwires/community',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      autorestart: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env: { NODE_ENV: 'production', PORT: 5000 },
      out_file:   '/home/podwires/logs/community-api.out.log',
      error_file: '/home/podwires/logs/community-api.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // ── Podwires Community — Next.js frontend ─────────────────────
    {
      name: 'community-client',
      script: 'npm',
      args: 'start',
      cwd: '/home/podwires/community/client',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      autorestart: true,
      env: { NODE_ENV: 'production', PORT: 3000 },
      out_file:   '/home/podwires/logs/community-client.out.log',
      error_file: '/home/podwires/logs/community-client.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // ── PodwiresBot — AI Team daemon ───────────────────────────────
    {
      name: 'podwiresbot',
      script: 'daemon.js',
      cwd: '/home/podwires/podwiresbot',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      autorestart: true,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      out_file:   '/home/podwires/logs/podwiresbot.out.log',
      error_file: '/home/podwires/logs/podwiresbot.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
ECOSYSTEM
chown $APP_USER:$APP_USER /home/$APP_USER/ecosystem.config.cjs

step "11/12 Swap (2GB safety net)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  log "2GB swap enabled"
fi

step "12/12 SSL certificate"
certbot --nginx -d "$COMMUNITY_DOMAIN" --non-interactive --agree-tos \
  -m "$EMAIL" --redirect 2>/dev/null || \
  warn "SSL skipped — point $COMMUNITY_DOMAIN DNS to this IP first, then run: certbot --nginx -d $COMMUNITY_DOMAIN"

# ── Save credentials ─────────────────────────────────────────
CREDS="/root/podwires-credentials.txt"
cat > "$CREDS" <<EOF
# Podwires VPS Credentials — $(date)
# Keep this file private!

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo 'unknown')

DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME_COMMUNITY=$DB_NAME_COMMUNITY
DB_NAME_BOT=$DB_NAME_BOT

DATABASE_URL_COMMUNITY=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME_COMMUNITY
DATABASE_URL_BOT=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME_BOT

COMMUNITY_DIR=$COMMUNITY_DIR
BOT_DIR=$BOT_DIR
ECOSYSTEM=/home/$APP_USER/ecosystem.config.cjs
EOF
chmod 600 "$CREDS"

echo ""
echo "════════════════════════════════════════════════════"
log "Server bootstrap complete!"
echo ""
log "DB credentials saved to: $CREDS"
echo ""
warn "NEXT STEPS from your Mac:"
warn "  1. bash deploy/push.sh <SERVER_IP>           # deploy Community"
warn "  2. bash deploy/push-podwiresbot.sh <SERVER_IP>  # deploy PodwiresBot"
warn "  OR: bash deploy/push-all.sh <SERVER_IP>     # deploy both at once"
echo ""
warn "After first push, fill in .env files on server:"
warn "  nano $COMMUNITY_DIR/server/.env"
warn "  nano $BOT_DIR/.env"
warn "Then: pm2 start /home/podwires/ecosystem.config.cjs"
warn "      pm2 save"
echo "════════════════════════════════════════════════════"
echo "DB_PASS=$DB_PASS"
