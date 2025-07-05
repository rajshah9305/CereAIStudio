#!/bin/bash

# CereStudioAI Enhanced - Automated Deployment Script
# Author: Raj Shah
# Version: 2.1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cerestudio-ai-enhanced"
DOCKER_IMAGE="$PROJECT_NAME"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_DIR/deploy.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_DIR/deploy.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_DIR/deploy.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_DIR/deploy.log"
}

show_help() {
    echo "CereStudioAI Enhanced - Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [VERSION]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy for development"
    echo "  staging      - Deploy for staging"
    echo "  production   - Deploy for production"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production latest"
    echo "  $0 staging v2.1.0"
    echo ""
    echo "Options:"
    echo "  --help       Show this help message"
    echo "  --backup     Create backup before deployment"
    echo "  --no-build   Skip building new images"
    echo "  --rollback   Rollback to previous version"
    echo "  --setup      Initialize project structure"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    # Check available ports
    if netstat -tuln | grep -q ':3000\|:5000\|:3001\|:9090'; then
        log_warning "Some required ports (3000, 5000, 3001, 9090) are in use"
    fi
    
    log_success "All requirements satisfied"
}

create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./monitoring"
    mkdir -p "./nginx"
    mkdir -p "./backend"
    mkdir -p "./frontend"
    mkdir -p "./docker"
    mkdir -p "./config"
    
    log_success "Directories created"
}

setup_project_structure() {
    log_info "Setting up project structure..."
    
    # Create main Dockerfile
    cat > Dockerfile << 'EOF'
# Multi-stage build for CereStudioAI Enhanced
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

EXPOSE 5000
CMD ["python", "backend/app.py"]
EOF

    # Create development docker-compose
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DEBUG=true
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cerestudio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

    # Create staging docker-compose
    cat > docker-compose.staging.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=staging
      - DEBUG=false
    depends_on:
      - redis
      - postgres

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cerestudio_staging
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
EOF

    # Create production docker-compose
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  app:
    image: cerestudio-ai-enhanced:${VERSION:-latest}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    environment:
      - NODE_ENV=production
      - DEBUG=false
    depends_on:
      - redis
      - postgres

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    deploy:
      restart_policy:
        condition: on-failure

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cerestudio_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      restart_policy:
        condition: on-failure

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  redis_data:
  postgres_data:
  grafana_data:
EOF

    # Create nginx configuration
    mkdir -p nginx
    cat > nginx/prod.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
EOF

    # Create monitoring configuration
    mkdir -p monitoring
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cerestudio-app'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s
EOF

    # Create sample environment file
    cat > .env.example << 'EOF'
# Database
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/cerestudio

# Redis
REDIS_URL=redis://redis:6379

# Application
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password

# External APIs
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
EOF

    # Create basic package.json if it doesn't exist
    if [ ! -f "frontend/package.json" ]; then
        mkdir -p frontend
        cat > frontend/package.json << 'EOF'
{
  "name": "cerestudio-frontend",
  "version": "2.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.0",
    "vitest": "^0.32.0"
  }
}
EOF
    fi

    # Create basic requirements.txt if it doesn't exist
    if [ ! -f "backend/requirements.txt" ]; then
        mkdir -p backend
        cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
prometheus-client==0.19.0
pytest==7.4.3
pytest-asyncio==0.21.1
EOF
    fi

    # Create basic health check endpoint
    if [ ! -f "backend/app.py" ]; then
        mkdir -p backend
        cat > backend/app.py << 'EOF'
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="CereStudioAI Enhanced API", version="2.1.0")

@app.get("/health")
async def health_check():
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "version": "2.1.0"}
    )

@app.get("/")
async def root():
    return {"message": "CereStudioAI Enhanced API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
EOF
    fi

    log_success "Project structure setup completed"
}

backup_current_deployment() {
    if [ "$CREATE_BACKUP" = true ]; then
        log_info "Creating backup of current deployment..."
        
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
        
        # Backup application data
        tar -czf "$BACKUP_FILE" \
            --exclude=node_modules \
            --exclude=venv \
            --exclude=__pycache__ \
            --exclude=.git \
            --exclude=docker_data \
            . 2>/dev/null || true
        
        log_success "Backup created: $BACKUP_FILE"
    fi
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Created .env from .env.example. Please update with your actual values."
        else
            log_warning "No .env file found. Using default environment variables."
        fi
    fi
    
    # Source environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
}

build_frontend() {
    log_info "Building frontend..."
    
    if [ -f "frontend/package.json" ]; then
        cd frontend
        
        # Install dependencies
        npm ci --production
        
        # Build for production
        npm run build
        
        cd ..
        log_success "Frontend build completed"
    else
        log_warning "No frontend package.json found, skipping frontend build"
    fi
}

build_backend() {
    log_info "Setting up backend..."
    
    if [ -f "backend/requirements.txt" ]; then
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            python3 -m venv venv
        fi
        
        # Activate virtual environment and install dependencies
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r backend/requirements.txt
        
        log_success "Backend setup completed"
    else
        log_warning "No backend requirements.txt found, skipping backend setup"
    fi
}

build_docker_images() {
    if [ "$SKIP_BUILD" != true ]; then
        log_info "Building Docker images..."
        
        # Build main application image
        docker build -t "$DOCKER_IMAGE:$VERSION" .
        
        # Tag as latest if this is a production deployment
        if [ "$ENVIRONMENT" = "production" ]; then
            docker tag "$DOCKER_IMAGE:$VERSION" "$DOCKER_IMAGE:latest"
        fi
        
        log_success "Docker images built successfully"
    else
        log_info "Skipping Docker build as requested"
    fi
}

deploy_application() {
    log_info "Deploying application to $ENVIRONMENT..."
    
    # Set environment-specific configurations
    case $ENVIRONMENT in
        development)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down || true
    
    # Start new containers
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Health check with retries
    RETRY_COUNT=0
    MAX_RETRIES=5
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            log_success "Application deployed successfully!"
            return 0
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            log_warning "Health check attempt $RETRY_COUNT failed, retrying..."
            sleep 10
        fi
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts. Deployment may have issues."
    exit 1
}

run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    if [ -f "frontend/package.json" ]; then
        cd frontend
        npm test -- --run || log_warning "Frontend tests failed"
        cd ..
    fi
    
    # Backend tests
    if [ -f "backend/requirements.txt" ] && [ -d "venv" ]; then
        source venv/bin/activate
        if [ -d "backend/tests" ]; then
            python -m pytest backend/tests/ || log_warning "Backend tests failed"
        else
            log_warning "No backend tests directory found"
        fi
    fi
    
    log_success "Tests completed"
}

monitor_deployment() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Setting up monitoring..."
        
        # Wait for monitoring services
        sleep 10
        
        # Check Prometheus
        if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
            log_success "Prometheus is running"
        else
            log_warning "Prometheus health check failed"
        fi
        
        # Check Grafana
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            log_success "Grafana is running"
        else
            log_warning "Grafana health check failed"
        fi
    fi
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Clean up old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
    fi
    
    # Clean up old logs (keep last 10)
    if [ -d "$LOG_DIR" ]; then
        ls -t "$LOG_DIR"/*.log 2>/dev/null | tail -n +11 | xargs -r rm
    fi
    
    log_success "Cleanup completed"
}

rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Find the latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -n 1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    # Stop current deployment
    docker-compose down || true
    
    # Extract backup
    tar -xzf "$LATEST_BACKUP"
    
    # Restart services
    docker-compose up -d
    
    log_success "Rollback completed using backup: $LATEST_BACKUP"
}

show_status() {
    log_info "Deployment Status:"
    
    # Show running containers
    docker-compose ps
    
    # Show service URLs
    echo ""
    log_info "Application URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  Health Check: http://localhost:5000/health"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  Monitoring: http://localhost:3001 (Grafana)"
        echo "  Metrics: http://localhost:9090 (Prometheus)"
    fi
}

# Main deployment logic
main() {
    # Default values
    ENVIRONMENT="development"
    VERSION="latest"
    CREATE_BACKUP=false
    SKIP_BUILD=false
    ROLLBACK=false
    SETUP=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --backup)
                CREATE_BACKUP=true
                shift
                ;;
            --no-build)
                SKIP_BUILD=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --setup)
                SETUP=true
                shift
                ;;
            development|staging|production)
                ENVIRONMENT=$1
                shift
                ;;
            *)
                if [[ $1 =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || [ "$1" = "latest" ]; then
                    VERSION=$1
                fi
                shift
                ;;
        esac
    done
    
    # Initialize logging
    create_directories
    
    # Handle setup
    if [ "$SETUP" = true ]; then
        setup_project_structure
        log_success "Project setup completed. You can now run the deployment."
        exit 0
    fi
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        rollback_deployment
        exit 0
    fi
    
    # Main deployment process
    log_info "Starting deployment for $ENVIRONMENT environment (version: $VERSION)"
    
    check_requirements
    setup_environment
    backup_current_deployment
    
    if [ "$ENVIRONMENT" = "production" ]; then
        run_tests
    fi
    
    build_frontend
    build_backend
    build_docker_images
    deploy_application
    monitor_deployment
    cleanup
    
    log_success "Deployment completed successfully!"
    show_status
}

# Error handler
handle_error() {
    log_error "Deployment failed on line $1"
    log_info "Check the logs in $LOG_DIR/deploy.log for more details"
    exit 1
}

# Set error trap
trap 'handle_error $LINENO' ERR

# Script entry point
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
