# CereStudioAI Enhanced - Multi-stage Docker Build
# Author: Raj Shah

# Stage 1: Node.js build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Python backend stage
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create virtual environment and install Python dependencies
RUN python -m venv venv && \
    . venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 3: Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy Python environment from builder
COPY --from=backend-builder /app/venv /app/venv

# Copy built frontend from builder
COPY --from=frontend-builder /app/dist /app/static

# Copy backend code
COPY backend/ /app/backend/

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app

# Switch to non-root user
USER app

# Make sure to use venv
ENV PATH="/app/venv/bin:$PATH"

# Expose ports
EXPOSE 80 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
