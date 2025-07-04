# CereStudioAI Enhanced - Production Deployment Guide

**Author:** Raj Shah  
**Version:** 2.0.0  
**Last Updated:** January 2024  
**Target Audience:** DevOps Engineers, System Administrators, Technical Teams  

## Overview

This comprehensive guide provides step-by-step instructions for deploying CereStudioAI Enhanced to production environments. The platform is designed for enterprise-grade deployment with high availability, scalability, and security.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04 LTS or CentOS 8

**Recommended Production Setup:**
- **CPU**: 16 cores
- **RAM**: 32GB
- **Storage**: 1TB NVMe SSD
- **Network**: 10Gbps connection
- **Load Balancer**: Nginx or HAProxy
- **Database**: PostgreSQL cluster

### Software Dependencies

**Required Software:**
- Docker 24.0+ and Docker Compose 2.0+
- Node.js 18.0+ and npm 9.0+
- Python 3.11+ and pip
- Git 2.30+
- SSL certificates (Let's Encrypt or commercial)

**Optional but Recommended:**
- Kubernetes 1.28+ for orchestration
- Prometheus and Grafana for monitoring
- Redis cluster for caching
- PostgreSQL for production database

## Quick Deployment

### Option 1: Automated Deployment Script

The fastest way to deploy CereStudioAI Enhanced:

```bash
# Clone the repository
git clone https://github.com/rajshah/cerestudio-ai-enhanced.git
cd cerestudio-ai-enhanced

# Make deployment script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production latest
```

### Option 2: Docker Compose

For containerized deployment:

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 3: Manual Deployment

For custom deployment scenarios:

```bash
# Build frontend
npm ci && npm run build

# Install backend dependencies
cd backend && pip install -r requirements.txt

# Start services
python analytics.py &
nginx -c /path/to/nginx.conf
```

## Detailed Production Setup

### 1. Environment Preparation

#### Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3.11 python3.11-pip python3.11-venv -y
```

#### Security Hardening

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Set up fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Commercial Certificate

```bash
# Create certificate directory
sudo mkdir -p /etc/ssl/cerestudio

# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/cerestudio/
sudo cp your-private-key.key /etc/ssl/cerestudio/
sudo cp ca-bundle.crt /etc/ssl/cerestudio/

# Set proper permissions
sudo chmod 600 /etc/ssl/cerestudio/*
sudo chown root:root /etc/ssl/cerestudio/*
```

### 3. Database Configuration

#### PostgreSQL Setup (Recommended for Production)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE cerestudio;
CREATE USER cerestudio_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE cerestudio TO cerestudio_user;
\q
EOF

# Configure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = '*'
# max_connections = 200
# shared_buffers = 256MB

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host cerestudio cerestudio_user 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### Redis Setup (For Caching)

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Modify:
# bind 127.0.0.1 ::1
# maxmemory 2gb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 4. Application Deployment

#### Environment Configuration

Create production environment file:

```bash
# Create .env.production
cat > .env.production << EOF
# Application
NODE_ENV=production
FLASK_ENV=production
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_ANALYTICS_API=https://yourdomain.com/api/analytics

# Database
DATABASE_URL=postgresql://cerestudio_user:secure_password_here@localhost:5432/cerestudio
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-here

# External Services
CEREBRAS_API_KEY=your-cerebras-api-key
ANALYTICS_ENDPOINT=https://analytics.yourdomain.com

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
LOG_LEVEL=INFO
EOF
```

#### Build and Deploy

```bash
# Build frontend
npm ci --production
npm run build

# Prepare backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
sudo tee /etc/systemd/system/cerestudio-backend.service > /dev/null << EOF
[Unit]
Description=CereStudioAI Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=cerestudio
WorkingDirectory=/opt/cerestudio/backend
Environment=PATH=/opt/cerestudio/backend/venv/bin
ExecStart=/opt/cerestudio/backend/venv/bin/python analytics.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cerestudio-backend
sudo systemctl start cerestudio-backend
```

### 5. Nginx Configuration

#### Production Nginx Setup

```nginx
# /etc/nginx/sites-available/cerestudio
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Static Files
    location / {
        root /opt/cerestudio/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cerestudio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Monitoring Setup

#### Prometheus Configuration

```yaml
# /opt/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "cerestudio_rules.yml"

scrape_configs:
  - job_name: 'cerestudio-backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Grafana Dashboard

```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### 7. Backup Configuration

#### Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/backup.sh

BACKUP_DIR="/backup/cerestudio"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
pg_dump -h localhost -U cerestudio_user cerestudio | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Application data backup
tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" /opt/cerestudio/data

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" s3://your-backup-bucket/cerestudio/
aws s3 cp "$BACKUP_DIR/app_data_$DATE.tar.gz" s3://your-backup-bucket/cerestudio/

# Cleanup old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

Set up cron job:

```bash
sudo crontab -e
# Add: 0 2 * * * /opt/scripts/backup.sh
```

## High Availability Setup

### Load Balancer Configuration

#### HAProxy Setup

```bash
# Install HAProxy
sudo apt install haproxy -y

# Configure HAProxy
sudo tee /etc/haproxy/haproxy.cfg > /dev/null << EOF
global
    daemon
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    option dontlognull

frontend cerestudio_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/cerestudio/
    redirect scheme https if !{ ssl_fc }
    default_backend cerestudio_backend

backend cerestudio_backend
    balance roundrobin
    option httpchk GET /health
    server web1 10.0.1.10:5000 check
    server web2 10.0.1.11:5000 check
    server web3 10.0.1.12:5000 check

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
EOF

sudo systemctl restart haproxy
```

### Database Clustering

#### PostgreSQL Streaming Replication

```bash
# On primary server
sudo -u postgres psql << EOF
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replication_password';
\q
EOF

# Configure postgresql.conf
echo "wal_level = replica" >> /etc/postgresql/14/main/postgresql.conf
echo "max_wal_senders = 3" >> /etc/postgresql/14/main/postgresql.conf
echo "wal_keep_segments = 64" >> /etc/postgresql/14/main/postgresql.conf

# Configure pg_hba.conf
echo "host replication replicator 10.0.1.0/24 md5" >> /etc/postgresql/14/main/pg_hba.conf

sudo systemctl restart postgresql
```

## Kubernetes Deployment

### Kubernetes Manifests

#### Namespace and ConfigMap

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cerestudio

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cerestudio-config
  namespace: cerestudio
data:
  NODE_ENV: "production"
  FLASK_ENV: "production"
  REACT_APP_API_URL: "https://api.cerestudio.com"
```

#### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cerestudio-app
  namespace: cerestudio
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cerestudio-app
  template:
    metadata:
      labels:
        app: cerestudio-app
    spec:
      containers:
      - name: cerestudio
        image: rajshah/cerestudio-ai-enhanced:latest
        ports:
        - containerPort: 80
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: cerestudio-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service and Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: cerestudio-service
  namespace: cerestudio
spec:
  selector:
    app: cerestudio-app
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: api
    port: 5000
    targetPort: 5000

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cerestudio-ingress
  namespace: cerestudio
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - cerestudio.com
    - www.cerestudio.com
    secretName: cerestudio-tls
  rules:
  - host: cerestudio.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cerestudio-service
            port:
              number: 80
```

## Performance Optimization

### Frontend Optimization

```bash
# Build with optimizations
npm run build

# Analyze bundle size
npm run analyze

# Enable service worker
# Already included in build process
```

### Backend Optimization

```python
# gunicorn.conf.py
bind = "0.0.0.0:5000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_actions_session_id ON user_actions(session_id);
CREATE INDEX idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Analyze tables
ANALYZE user_sessions;
ANALYZE user_actions;
ANALYZE performance_metrics;
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker-compose logs cerestudio-app
journalctl -u cerestudio-backend -f

# Check ports
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000

# Check disk space
df -h
```

#### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U cerestudio_user -d cerestudio

# Check PostgreSQL status
sudo systemctl status postgresql
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew --dry-run
```

### Performance Issues

#### High CPU Usage

```bash
# Check processes
top -p $(pgrep -d',' python)
htop

# Check application metrics
curl http://localhost:5000/metrics
```

#### Memory Leaks

```bash
# Monitor memory usage
free -h
ps aux --sort=-%mem | head

# Check application memory
docker stats
```

#### Slow Database Queries

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Security Checklist

### Pre-Deployment Security

- [ ] SSL/TLS certificates installed and configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Database credentials secured and rotated
- [ ] Application secrets generated and secured
- [ ] Security headers configured in Nginx
- [ ] Rate limiting implemented
- [ ] Input validation and sanitization verified
- [ ] CORS configuration reviewed
- [ ] Authentication and authorization tested

### Post-Deployment Security

- [ ] Security scanning completed
- [ ] Penetration testing performed
- [ ] Log monitoring configured
- [ ] Intrusion detection system deployed
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented
- [ ] Security updates scheduled
- [ ] Access controls reviewed and documented

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Monitor application health and performance
- Check error logs for issues
- Verify backup completion
- Review security alerts

#### Weekly
- Update system packages
- Analyze performance metrics
- Review user feedback and issues
- Check disk space and cleanup logs

#### Monthly
- Security patch updates
- Database maintenance and optimization
- Performance tuning and optimization
- Disaster recovery testing

#### Quarterly
- Security audit and penetration testing
- Capacity planning and scaling review
- Documentation updates
- Team training and knowledge transfer

### Update Procedures

#### Application Updates

```bash
# Backup current version
./backup.sh

# Pull latest code
git pull origin main

# Build new version
npm run build
docker build -t cerestudio:new .

# Deploy with zero downtime
docker-compose up -d --no-deps cerestudio-app

# Verify deployment
curl -f http://localhost:5000/health
```

#### System Updates

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
sudo systemctl restart cerestudio-backend
sudo systemctl restart nginx
```

## Support and Documentation

### Getting Help

- **Documentation**: [docs.cerestudio.ai](https://docs.cerestudio.ai)
- **Support Email**: support@cerestudio.ai
- **Emergency Contact**: +1 (555) 123-4567
- **GitHub Issues**: [GitHub Repository](https://github.com/rajshah/cerestudio-ai-enhanced/issues)

### Additional Resources

- **API Documentation**: [api.cerestudio.ai](https://api.cerestudio.ai)
- **Monitoring Dashboards**: [monitoring.cerestudio.ai](https://monitoring.cerestudio.ai)
- **Status Page**: [status.cerestudio.ai](https://status.cerestudio.ai)
- **Community Forum**: [community.cerestudio.ai](https://community.cerestudio.ai)

---

**Document Version**: 2.0.0  
**Last Updated**: January 2024  
**Author**: Raj Shah  
**Contact**: raj@cerestudio.ai

