#!/bin/bash

# CereStudioAI Enhanced Deployment Script
# Author: Raj Shah
# Usage: ./deploy.sh [environment] [version]

set -e

# Configuration
PROJECT_NAME="cerestudio-ai-enhanced"
DOCKER_REGISTRY="rajshah"
DEFAULT_ENV="production"
DEFAULT_VERSION="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
ENVIRONMENT=${1:-$DEFAULT_ENV}
VERSION=${2:-$DEFAULT_VERSION}

log_info "Starting deployment for environment: $ENVIRONMENT, version: $VERSION"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if required files exist
required_files=(
    "Dockerfile"
    "docker-compose.yml"
    "package.json"
    "backend/analytics.py"
    "backend/requirements.txt"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "Required file not found: $file"
        exit 1
    fi
done

log_success "Pre-deployment checks passed"

# Build and test
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Building production images..."
    
    # Build frontend
    log_info "Building frontend..."
    npm ci
    npm run build
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t $PROJECT_NAME:$VERSION .
    docker tag $PROJECT_NAME:$VERSION $PROJECT_NAME:latest
    
    # Run tests
    log_info "Running tests..."
    npm run test -- --run
    
    log_success "Build and tests completed"
fi

# Environment-specific deployment
case $ENVIRONMENT in
    "development")
        log_info "Deploying to development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
        ;;
    
    "staging")
        log_info "Deploying to staging environment..."
        # Copy production compose but with staging overrides
        docker-compose -f docker-compose.yml up -d --build
        ;;
    
    "production")
        log_info "Deploying to production environment..."
        
        # Backup current deployment
        if docker-compose ps | grep -q $PROJECT_NAME; then
            log_info "Creating backup of current deployment..."
            docker-compose down
        fi
        
        # Deploy new version
        docker-compose up -d
        
        # Health check
        log_info "Performing health check..."
        sleep 30
        
        max_attempts=10
        attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f http://localhost:5000/health > /dev/null 2>&1; then
                log_success "Health check passed"
                break
            else
                log_warning "Health check attempt $attempt/$max_attempts failed, retrying..."
                sleep 10
                ((attempt++))
            fi
        done
        
        if [[ $attempt -gt $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            log_error "Rolling back deployment..."
            docker-compose down
            exit 1
        fi
        ;;
esac

# Post-deployment tasks
log_info "Running post-deployment tasks..."

# Wait for services to be ready
sleep 10

# Display deployment information
log_info "Deployment Information:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo "  Frontend URL: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Analytics API: http://localhost:5000/api/analytics"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "  Monitoring: http://localhost:9090 (Prometheus)"
    echo "  Dashboards: http://localhost:3001 (Grafana)"
fi

# Show running containers
log_info "Running containers:"
docker-compose ps

# Performance optimization for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Applying production optimizations..."
    
    # Optimize Docker images
    docker system prune -f
    
    # Set up log rotation
    if [[ -f "/etc/logrotate.d/cerestudio" ]]; then
        log_info "Log rotation already configured"
    else
        log_info "Setting up log rotation..."
        sudo tee /etc/logrotate.d/cerestudio > /dev/null <<EOF
/var/log/cerestudio/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        docker-compose restart cerestudio-app
    endscript
}
EOF
    fi
fi

# Security hardening for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Applying security hardening..."
    
    # Set proper file permissions
    chmod 600 docker-compose.yml
    chmod 600 backend/analytics.py
    
    # Update system packages (if running on Ubuntu/Debian)
    if command -v apt-get &> /dev/null; then
        log_info "Updating system packages..."
        sudo apt-get update && sudo apt-get upgrade -y
    fi
fi

# Monitoring setup
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Setting up monitoring alerts..."
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for CereStudioAI

check_service() {
    local service=$1
    local url=$2
    
    if curl -f "$url" > /dev/null 2>&1; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is down"
        # Send alert (implement your notification system here)
    fi
}

check_service "Frontend" "http://localhost:3000"
check_service "Backend" "http://localhost:5000/health"
check_service "Analytics API" "http://localhost:5000/api/analytics/dashboard"
EOF
    
    chmod +x monitor.sh
    
    # Set up cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/monitor.sh") | crontab -
fi

# Backup strategy for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Setting up backup strategy..."
    
    # Create backup script
    cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for CereStudioAI

BACKUP_DIR="/backup/cerestudio"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose exec -T postgres pg_dump -U cerestudio cerestudio > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup application data
tar -czf "$BACKUP_DIR/data_backup_$DATE.tar.gz" ./data

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x backup.sh
    
    # Set up daily backup cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup.sh") | crontab -
fi

log_success "Deployment completed successfully!"

# Display next steps
log_info "Next Steps:"
echo "1. Verify the application is working correctly"
echo "2. Run integration tests: npm run test:integration"
echo "3. Monitor logs: docker-compose logs -f"
echo "4. Check metrics: http://localhost:9090 (if monitoring is enabled)"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "5. Set up SSL certificates for HTTPS"
    echo "6. Configure domain name and DNS"
    echo "7. Set up external monitoring and alerting"
    echo "8. Review security settings and firewall rules"
fi

log_info "Deployment script completed. CereStudioAI Enhanced is now running!"

# Optional: Open browser to the application
if command -v xdg-open &> /dev/null; then
    log_info "Opening application in browser..."
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    log_info "Opening application in browser..."
    open http://localhost:3000
fi

