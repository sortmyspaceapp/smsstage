#!/bin/bash

# GitHub Repository Setup Script for SpaceFinder
# This script helps set up the GitHub repository with proper configuration

set -e

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

log "🐙 Setting up GitHub repository for SpaceFinder..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    log "Initializing Git repository..."
    git init
    git branch -M main
fi

# Add all files
log "Adding files to Git..."
git add .

# Create initial commit
log "Creating initial commit..."
git commit -m "🚀 Initial commit: SpaceFinder production-ready setup

- Complete Docker containerization
- Production-ready backend with security hardening
- React admin dashboard
- Flutter mobile application
- AWS EC2 deployment scripts
- GitHub Actions CI/CD pipeline
- SSL/TLS configuration
- Comprehensive documentation

Features:
✅ Security audit and fixes
✅ Multi-stage Docker builds
✅ Automated deployment
✅ SSL certificate management
✅ Monitoring and logging
✅ Backup and recovery
✅ CI/CD pipeline with security scanning"

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    warning "No remote repository configured."
    log "To connect to GitHub:"
    log "1. Create a new repository on GitHub"
    log "2. Run: git remote add origin https://github.com/USERNAME/REPOSITORY.git"
    log "3. Run: git push -u origin main"
else
    log "Remote repository already configured: $(git remote get-url origin)"
    
    # Ask if user wants to push
    read -p "Do you want to push to remote repository? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Pushing to remote repository..."
        git push -u origin main
        success "Code pushed to GitHub successfully!"
    else
        warning "Skipping push. Run 'git push -u origin main' when ready."
    fi
fi

log ""
log "📋 GitHub Repository Setup Complete!"
log ""
log "🔧 Next Steps:"
log "1. Configure GitHub repository settings:"
log "   - Enable GitHub Actions"
log "   - Set up branch protection rules"
log "   - Configure repository secrets"
log ""
log "2. Required GitHub Secrets for CI/CD:"
log "   - SSH_PRIVATE_KEY (EC2 SSH private key)"
log "   - SERVER_HOST (EC2 public IP or domain)"
log "   - SERVER_USER (SSH username, usually 'ec2-user')"
log ""
log "3. Repository Settings to Configure:"
log "   - Go to Settings > Actions > General"
log "   - Enable 'Allow all actions and reusable workflows'"
log "   - Set up branch protection for 'main' branch"
log ""
log "4. Security Settings:"
log "   - Enable Dependabot alerts"
log "   - Enable secret scanning"
log "   - Enable code scanning"
log ""
log "🔗 Useful GitHub URLs (replace USERNAME/REPOSITORY):"
log "- Repository: https://github.com/USERNAME/REPOSITORY"
log "- Actions: https://github.com/USERNAME/REPOSITORY/actions"
log "- Settings: https://github.com/USERNAME/REPOSITORY/settings"
log "- Secrets: https://github.com/USERNAME/REPOSITORY/settings/secrets/actions"
log ""
log "📚 Documentation:"
log "- Deployment Guide: DEPLOYMENT.md"
log "- Setup Summary: DEPLOYMENT_SUMMARY.md"
log "- Backend API: backend/README.md"
log ""
success "🎉 GitHub repository setup completed successfully!"
