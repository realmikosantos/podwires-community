#!/usr/bin/env bash
# ============================================================
# Podwires Community — Server Setup Script
# Run this ONCE on a fresh Ubuntu 24.04 VPS as root.
# Usage: bash server-setup.sh
# ============================================================
set -euo pipefail

# ── Config (edit these before running) ──────────────────────
APP_USER="podwires"
APP_DIR="/home/$APP_USER/community"
DB_NAME="podwires_community"
DB_USER="podwires_db"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24)}"   # auto-generate if not set
NODE_VERSION="20"
DOMAIN="community.podwires.com"
EMAIL="miko@podwires.com"          # Let's Encrypt notifications
# ────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail() { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

[[ $EUID -ne 0 ]] && fail "Run as root: sudo bash server-setup.sh"

log "Starting Podwires Community server setup..."
log "Domain: $DOMAIN"
log "App dir: $APP_DIR"

# ── 1. System update ─────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Essential tools ───────────────────────────────────────
log "Installing essentials..."
apt-get install -y -qq \
  curl wget git unzip build-essential \
  ufw fail2ban \
  software-properties-common gnupg ca-certificates

# ── 3. Node.js 20 LTS ────────────────────────────────────────
log "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs
node -v && npm -v

# ── 4. PM2 ───────────────────────────────────────────────────
log "Installing PM2..."
npm install -g pm2 --quiet
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 5. PostgreSQL 16 ─────────────────────────────────────────
log "Installing PostgreSQL 16..."
sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | tee /etc/apt/trusted.gpg.d/postgresql.asc > /dev/null
apt-get update -qq
apt-get install -y -qq postgresql-16 postgresql-client-16

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# ── 6. Create database & user ────────────────────────────────
log "Creating database user and database..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
log "Database: $DB_NAME | User: $DB_USER | Password: $DB_PASS"

# ── 7. Nginx ─────────────────────────────────────────────────
log "Installing Nginx..."
apt-get install -y -qq nginx
systemctl enable nginx

# ── 8. Certbot ───────────────────────────────────────────────
log "Installing Certbot (Let's Encrypt)..."
snap install --classic certbot > /dev/null 2>&1 || apt-get install -y -qq certbot python3-certbot-nginx
ln -sf /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true

# ── 9. App user & directory ──────────────────────────────────
log "Creating app user: $APP_USER..."
id -u "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "/home/$APP_USER"

# ── 10. Firewall ─────────────────────────────────────────────
log "Configuring firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow ssh > /dev/null
ufw allow 'Nginx Full' > /dev/null
ufw --force enable > /dev/null
log "Firewall: SSH + HTTP + HTTPS allowed"

# ── 11. Nginx config (temporary HTTP for cert) ───────────────
log "Writing Nginx config..."
cat > /etc/nginx/sites-available/community.podwires.com <<'NGINX'
# Rate limiting
limit_req_zone $binary_remote_addr zone=community_api:10m rate=10r/s;

upstream community_frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream community_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name community.podwires.com;

    # API routes
    location /api/ {
        limit_req zone=community_api burst=20 nodelay;
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io WebSocket
    location /socket.io/ {
        proxy_pass http://community_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Next.js frontend
    location / {
        proxy_pass http://community_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # Next.js static assets (cached)
    location /_next/static/ {
        proxy_pass http://community_frontend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    access_log /var/log/nginx/community.podwires.com.access.log;
    error_log /var/log/nginx/community.podwires.com.error.log;
}
NGINX

ln -sf /etc/nginx/sites-available/community.podwires.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ── 12. SSL certificate ──────────────────────────────────────
log "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect || \
  warn "SSL cert failed — make sure $DOMAIN DNS points to this server's IP. Run 'certbot --nginx -d $DOMAIN' manually after DNS propagates."

# ── 13. Save credentials ─────────────────────────────────────
CREDS_FILE="/root/podwires-community-credentials.txt"
cat > "$CREDS_FILE" <<EOF
# Podwires Community — Server Credentials
# Generated: $(date)

DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
APP_DIR=$APP_DIR
EOF
chmod 600 "$CREDS_FILE"

log ""
log "============================================================"
log "Server setup complete!"
log "Credentials saved to: $CREDS_FILE"
log ""
log "NEXT STEPS:"
log "1. Make sure community.podwires.com DNS → $(curl -s ifconfig.me)"
log "2. Run from your Mac:  bash deploy/push.sh YOUR_SERVER_IP"
log "3. Fill in .env values on the server after push"
log "============================================================"
echo ""
echo "DB_PASS=$DB_PASS"   # Print for immediate copy
