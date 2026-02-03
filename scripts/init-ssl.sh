#!/bin/bash
# =============================================================================
# SSL Certificate Initialization Script for Nomad Cafe
# =============================================================================
#
# This script initializes SSL certificates using Let's Encrypt (certbot).
# Run this script ONCE on initial deployment.
#
# Usage:
#   ./scripts/init-ssl.sh example.com admin@example.com
#
# Prerequisites:
#   - Domain pointed to this server
#   - Ports 80 and 443 open
#   - Docker and docker-compose installed
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arguments
DOMAIN=${1:-}
EMAIL=${2:-}

# Validate arguments
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 nomadcafe.dev admin@nomadcafe.dev"
    exit 1
fi

echo -e "${GREEN}=== Nomad Cafe SSL Initialization ===${NC}"
echo ""
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Create required directories
echo -e "${YELLOW}Creating certificate directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www

# Create a temporary nginx config for the initial certificate request
echo -e "${YELLOW}Creating temporary nginx configuration...${NC}"
cat > nginx/conf.d/default.conf << 'TEMPCONF'
# Temporary configuration for SSL initialization
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Nomad Cafe - SSL initialization in progress';
        add_header Content-Type text/plain;
    }
}
TEMPCONF

# Start nginx only (without SSL)
echo -e "${YELLOW}Starting nginx for certificate challenge...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to start
sleep 5

# Request certificate from Let's Encrypt
echo -e "${YELLOW}Requesting SSL certificate from Let's Encrypt...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Restore the full nginx configuration
echo -e "${YELLOW}Restoring full nginx configuration...${NC}"
cat > nginx/conf.d/default.conf << FULLCONF
# =============================================================================
# Server Configuration for Nomad Cafe
# =============================================================================

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration (Mozilla Modern)
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Request size limits
    client_max_body_size 10M;

    # API Routes -> Django Backend
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://api_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/auth/ {
        limit_req zone=login_limit burst=5 nodelay;

        proxy_pass http://api_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    location /admin/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
    }

    location /static/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health Check Endpoints
    location = /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location = /api/health/ {
        access_log off;
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Frontend Routes -> React SPA
    location / {
        proxy_pass http://frontend_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
    }
}
FULLCONF

# Reload nginx with new configuration
echo -e "${YELLOW}Reloading nginx with SSL configuration...${NC}"
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo -e "${GREEN}=== SSL Certificate Installation Complete ===${NC}"
echo ""
echo "Your site should now be accessible at: https://$DOMAIN"
echo ""
echo "The certbot container will automatically renew certificates."
echo ""
