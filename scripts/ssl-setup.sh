#!/bin/bash

# SSL Certificate Setup Script for SpaceFinder
# This script helps set up SSL certificates using Let's Encrypt

set -e

# Configuration
DOMAIN_NAME="${1:-your-domain.com}"
ADMIN_DOMAIN="${2:-admin.your-domain.com}"
EMAIL="${3:-admin@your-domain.com}"
SSL_DIR="/opt/spacefinder/ssl"
NGINX_CONF="/opt/spacefinder/nginx/nginx.conf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if domain is provided
if [ "$DOMAIN_NAME" = "your-domain.com" ]; then
    warning "Using default domain: smsstage.ceartech.com"
    DOMAIN_NAME="smsstage.ceartech.com"
    ADMIN_DOMAIN="smsstage.ceartech.com"
fi

log "🔒 Setting up SSL certificates for SpaceFinder..."
log "Domain: $DOMAIN_NAME"
log "Admin Domain: $ADMIN_DOMAIN"
log "Email: $EMAIL"

# Install certbot
log "📦 Installing certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
log "⏹️ Stopping nginx..."
sudo systemctl stop nginx

# Create temporary nginx config for certificate generation
log "📝 Creating temporary nginx configuration..."
sudo tee /etc/nginx/sites-available/temp-ssl-setup > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/temp-ssl-setup /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start nginx
log "🌐 Starting nginx..."
sudo systemctl start nginx

# Obtain SSL certificates
log "🔐 Obtaining SSL certificates..."
sudo certbot certonly --webroot -w /var/www/html -d "$DOMAIN_NAME" --email "$EMAIL" --agree-tos --non-interactive

# Update nginx configuration with SSL
log "📝 Updating nginx configuration with SSL..."
sudo tee /etc/nginx/sites-available/spacefinder-ssl > /dev/null <<EOF
# Upstream servers
upstream backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream admin {
    server 127.0.0.1:8080;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$host\$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API endpoints
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin dashboard
    location /admin {
        proxy_pass http://admin/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}

# Admin path on same domain
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Admin dashboard
    location / {
        proxy_pass http://admin/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API proxy for admin
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the new configuration
sudo ln -sf /etc/nginx/sites-available/spacefinder-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/temp-ssl-setup

# Test nginx configuration
log "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
log "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Set up automatic certificate renewal
log "⏰ Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-hook 'systemctl reload nginx'") | crontab -

# Copy certificates to application directory
log "📋 Copying certificates to application directory..."
sudo mkdir -p "$SSL_DIR"
sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$SSL_DIR/cert.pem"
sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$SSL_DIR/key.pem"
sudo chown -R $USER:$USER "$SSL_DIR"

success "🎉 SSL setup completed successfully!"

log ""
log "📋 SSL Configuration Summary:"
log "- Domain: $DOMAIN_NAME"
log "- Admin Domain: $ADMIN_DOMAIN"
log "- Certificates: /etc/letsencrypt/live/$DOMAIN_NAME/"
log "- Application SSL Dir: $SSL_DIR"
log "- Auto-renewal: Enabled"

log ""
log "🔗 Service URLs:"
log "- Main Site: https://$DOMAIN_NAME"
log "- Admin Dashboard: https://$ADMIN_DOMAIN"
log "- API: https://$DOMAIN_NAME/api/"
log "- Health Check: https://$DOMAIN_NAME/health"

log ""
log "⚠️  Next Steps:"
log "1. Update your DNS records to point to this server"
log "2. Test SSL certificates: curl -I https://$DOMAIN_NAME"
log "3. Update environment variables with HTTPS URLs"
log "4. Restart your application services"

log ""
log "🔧 SSL Management Commands:"
log "- Renew certificates: sudo certbot renew"
log "- Check certificate status: sudo certbot certificates"
log "- Test renewal: sudo certbot renew --dry-run"
