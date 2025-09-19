#!/bin/bash

# SpaceFinder Deployment Script
# This script deploys the SpaceFinder application to production

set -e

# Configuration
APP_DIR="/opt/spacefinder"
BACKUP_DIR="/opt/spacefinder/backups"
LOG_FILE="/opt/spacefinder/logs/deploy.log"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if we're in the correct directory
if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.prod.yml not found. Please run this script from the project root."
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found. Please create it from env.production.example"
fi

log "🚀 Starting SpaceFinder deployment..."

# Create backup before deployment
log "💾 Creating backup before deployment..."
BACKUP_FILE="spacefinder_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
mkdir -p "$BACKUP_DIR"

if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
    log "Creating backup of current state..."
    docker run --rm \
        -v spacefinder_postgres_data:/data \
        -v spacefinder_redis_data:/redis \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/$BACKUP_FILE" /data /redis 2>/dev/null || warning "Backup creation failed, continuing..."
else
    log "No running containers found, skipping backup..."
fi

# Pull latest code
log "📥 Pulling latest code from repository..."
if git pull origin main; then
    success "Code updated successfully"
else
    warning "Failed to pull latest code or no git repository found"
fi

# Stop existing services
log "⏹️ Stopping existing services..."
if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
    docker-compose -f "$COMPOSE_FILE" down
    success "Services stopped"
else
    log "No running services found"
fi

# Pull latest Docker images
log "📥 Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build and start services
log "🏗️ Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be healthy
log "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
log "🔍 Checking service health..."
HEALTH_CHECK_FAILED=false

# Check backend health
if curl -f -s http://localhost:3000/health > /dev/null; then
    success "Backend service is healthy"
else
    error "Backend service health check failed"
fi

# Check admin dashboard health
if curl -f -s http://localhost:8080/health > /dev/null; then
    success "Admin dashboard is healthy"
else
    warning "Admin dashboard health check failed"
fi

# Run database migrations
log "🗄️ Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma db push || warning "Database migration failed"

# Clean up unused Docker images
log "🧹 Cleaning up unused Docker images..."
docker image prune -f

# Check disk space
log "💾 Checking disk space..."
DISK_USAGE=$(df -h "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    warning "Disk usage is high: ${DISK_USAGE}%"
fi

# Show service status
log "📊 Service status:"
docker-compose -f "$COMPOSE_FILE" ps

# Show resource usage
log "📈 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Clean up old backups (keep last 7 days)
log "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "spacefinder_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true

success "🎉 Deployment completed successfully!"

log "📋 Deployment Summary:"
log "- Services started: $(docker-compose -f "$COMPOSE_FILE" ps -q | wc -l)"
log "- Backup created: $BACKUP_FILE"
log "- Disk usage: ${DISK_USAGE}%"
log "- Log file: $LOG_FILE"

log ""
log "🔗 Service URLs:"
log "- Backend API: http://localhost:3000"
log "- Admin Dashboard: http://localhost:8080"
log "- Health Check: http://localhost:3000/health"

log ""
log "📚 Useful Commands:"
log "- View logs: docker-compose -f $COMPOSE_FILE logs -f"
log "- Stop services: docker-compose -f $COMPOSE_FILE down"
log "- Restart services: docker-compose -f $COMPOSE_FILE restart"
log "- Monitor system: $APP_DIR/monitor.sh"

log ""
log "⚠️  Next Steps:"
log "1. Test all endpoints and functionality"
log "2. Monitor logs for any errors"
log "3. Set up SSL certificates if not already done"
log "4. Configure domain DNS if needed"
log "5. Update monitoring and alerting systems"
