#!/bin/bash

# SpaceFinder Production Server Setup Script
# This script sets up an Ubuntu 22.04 LTS server for SpaceFinder deployment

set -e

echo "🚀 Starting SpaceFinder Production Server Setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for potential local development)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx (for reverse proxy)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 8080/tcp  # Admin Dashboard

# Configure fail2ban
echo "🛡️ Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/spacefinder
sudo chown $USER:$USER /opt/spacefinder

# Create SSL directory
echo "🔒 Creating SSL directory..."
sudo mkdir -p /opt/spacefinder/ssl
sudo chown $USER:$USER /opt/spacefinder/ssl

# Create logs directory
echo "📝 Creating logs directory..."
sudo mkdir -p /opt/spacefinder/logs
sudo chown $USER:$USER /opt/spacefinder/logs

# Create backup directory
echo "💾 Creating backup directory..."
sudo mkdir -p /opt/spacefinder/backups
sudo chown $USER:$USER /opt/spacefinder/backups

# Create systemd service for SpaceFinder
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/spacefinder.service > /dev/null <<EOF
[Unit]
Description=SpaceFinder Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/spacefinder
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable spacefinder

# Create logrotate configuration
echo "📝 Configuring log rotation..."
sudo tee /etc/logrotate.d/spacefinder > /dev/null <<EOF
/opt/spacefinder/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        /bin/kill -USR1 \$(cat /var/run/nginx.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

# Create backup script
echo "💾 Creating backup script..."
tee /opt/spacefinder/backup.sh > /dev/null <<EOF
#!/bin/bash
# SpaceFinder Backup Script

BACKUP_DIR="/opt/spacefinder/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="spacefinder_backup_\$DATE.tar.gz"

echo "Creating backup: \$BACKUP_FILE"

# Create backup of volumes
docker run --rm -v spacefinder_postgres_data:/data -v spacefinder_redis_data:/redis -v \$BACKUP_DIR:/backup alpine tar czf /backup/\$BACKUP_FILE /data /redis

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "spacefinder_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$BACKUP_FILE"
EOF

chmod +x /opt/spacefinder/backup.sh

# Create daily backup cron job
echo "⏰ Setting up daily backup..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/spacefinder/backup.sh >> /opt/spacefinder/logs/backup.log 2>&1") | crontab -

# Create monitoring script
echo "📊 Creating monitoring script..."
tee /opt/spacefinder/monitor.sh > /dev/null <<EOF
#!/bin/bash
# SpaceFinder Monitoring Script

echo "=== SpaceFinder System Status ==="
echo "Date: \$(date)"
echo "Uptime: \$(uptime)"
echo ""

echo "=== Docker Services ==="
docker-compose -f /opt/spacefinder/docker-compose.prod.yml ps
echo ""

echo "=== Disk Usage ==="
df -h
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)"
echo ""

echo "=== Application Logs (last 10 lines) ==="
tail -n 10 /opt/spacefinder/logs/*.log 2>/dev/null || echo "No logs found"
EOF

chmod +x /opt/spacefinder/monitor.sh

# Create update script
echo "🔄 Creating update script..."
tee /opt/spacefinder/update.sh > /dev/null <<EOF
#!/bin/bash
# SpaceFinder Update Script

set -e

echo "🔄 Updating SpaceFinder..."

# Stop services
echo "⏹️ Stopping services..."
docker-compose -f docker-compose.prod.yml down

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Clean up unused images
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Update completed!"
EOF

chmod +x /opt/spacefinder/update.sh

echo ""
echo "✅ SpaceFinder Production Server Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Reboot the server: sudo reboot"
echo "2. Clone your repository to /opt/spacefinder"
echo "3. Copy env.production.example to .env.production and configure"
echo "4. Set up SSL certificates in /opt/spacefinder/ssl"
echo "5. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📚 Useful Commands:"
echo "- Monitor system: /opt/spacefinder/monitor.sh"
echo "- Update application: /opt/spacefinder/update.sh"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "- Service control: sudo systemctl start/stop/restart spacefinder"
echo ""
echo "🔒 Security Features Enabled:"
echo "- UFW firewall configured"
echo "- Fail2ban intrusion prevention"
echo "- Docker containers running as non-root"
echo "- SSL/TLS ready (certificates needed)"
echo ""
echo "⚠️  Don't forget to:"
echo "- Configure your domain DNS"
echo "- Set up SSL certificates"
echo "- Update environment variables"
echo "- Test all services"
