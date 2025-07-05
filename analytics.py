#!/usr/bin/env python3
"""
CereStudioAI Enhanced Backend
Author: Raj Shah
Version: 2.1.0
Python 3.11+ Compatible
"""

import os
import sys
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import warnings

# Suppress pandas warnings for cleaner logs
warnings.filterwarnings('ignore', category=FutureWarning)

# Core Flask imports
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

# Data processing
import pandas as pd
import numpy as np

# Utilities
import requests
from python_dateutil import parser
import structlog
import psutil
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Security
from cryptography.fernet import Fernet
import jwt
from functools import wraps

# Environment
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

# Initialize Flask app
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Configuration
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DATABASE_URL = os.getenv('DATABASE_URL', '')
    REDIS_URL = os.getenv('REDIS_URL', '')
    CEREBRAS_API_KEY = os.getenv('CEREBRAS_API_KEY', '')
    ANALYTICS_ENDPOINT = os.getenv('ANALYTICS_ENDPOINT', '')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    PROMETHEUS_ENABLED = os.getenv('PROMETHEUS_ENABLED', 'true').lower() == 'true'

app.config.from_object(Config)

# CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Global error handler
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error("Unhandled exception", error=str(e), traceback=traceback.format_exc())
    REQUEST_COUNT.labels(method=request.method, endpoint='error').inc()
    
    if app.config['FLASK_ENV'] == 'development':
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500
    else:
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

# Authentication decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No authorization token provided'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid authorization token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

# Middleware for request metrics
@app.before_request
def before_request():
    request.start_time = datetime.utcnow()
    REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint or 'unknown').inc()

@app.after_request
def after_request(response):
    if hasattr(request, 'start_time') and Config.PROMETHEUS_ENABLED:
        request_latency = (datetime.utcnow() - request.start_time).total_seconds()
        REQUEST_LATENCY.observe(request_latency)
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Health check endpoint
@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Basic health checks
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '2.1.0',
            'environment': app.config['FLASK_ENV'],
            'checks': {
                'database': 'not_configured',
                'redis': 'not_configured',
                'memory': 'ok',
                'disk': 'ok'
            }
        }
        
        # Memory check
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            health_status['checks']['memory'] = 'warning'
            health_status['status'] = 'degraded'
        
        # Disk check
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            health_status['checks']['disk'] = 'warning'
            health_status['status'] = 'degraded'
        
        status_code = 200 if health_status['status'] == 'healthy' else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500

# Metrics endpoint for Prometheus
@app.route('/metrics')
def metrics():
    """Prometheus metrics endpoint"""
    if not Config.PROMETHEUS_ENABLED:
        return jsonify({'error': 'Metrics disabled'}), 404
    
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

# API Routes
@app.route('/api/analytics/events', methods=['POST'])
def track_event():
    """Track analytics events"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['event_type', 'user_id', 'timestamp']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Process the event
        event = {
            'event_type': data['event_type'],
            'user_id': data['user_id'],
            'timestamp': data['timestamp'],
            'properties': data.get('properties', {}),
            'session_id': data.get('session_id', ''),
            'processed_at': datetime.utcnow().isoformat()
        }
        
        logger.info("Event tracked", event=event)
        
        return jsonify({
            'success': True,
            'event_id': f"evt_{datetime.utcnow().timestamp()}",
            'message': 'Event tracked successfully'
        }), 201
        
    except Exception as e:
        logger.error("Failed to track event", error=str(e))
        return jsonify({'error': 'Failed to track event'}), 500

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get analytics dashboard data"""
    try:
        # Simulate dashboard data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Generate sample data
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        
        dashboard_data = {
            'summary': {
                'total_users': np.random.randint(1000, 5000),
                'active_users': np.random.randint(500, 2000),
                'total_sessions': np.random.randint(2000, 10000),
                'avg_session_duration': round(np.random.uniform(120, 600), 2)
            },
            'daily_stats': [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'users': int(np.random.randint(50, 200)),
                    'sessions': int(np.random.randint(100, 500)),
                    'page_views': int(np.random.randint(500, 2000))
                }
                for date in dates
            ],
            'top_pages': [
                {'page': '/dashboard', 'views': int(np.random.randint(500, 1500))},
                {'page': '/projects', 'views': int(np.random.randint(300, 1000))},
                {'page': '/analytics', 'views': int(np.random.randint(200, 800))},
                {'page': '/settings', 'views': int(np.random.randint(100, 500))},
            ],
            'user_agents': [
                {'browser': 'Chrome', 'count': int(np.random.randint(500, 1500))},
                {'browser': 'Firefox', 'count': int(np.random.randint(200, 800))},
                {'browser': 'Safari', 'count': int(np.random.randint(150, 600))},
                {'browser': 'Edge', 'count': int(np.random.randint(100, 400))},
            ]
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logger.error("Failed to get dashboard data", error=str(e))
        return jsonify({'error': 'Failed to retrieve dashboard data'}), 500

@app.route('/api/ai/cerebras', methods=['POST'])
def cerebras_proxy():
    """Proxy requests to Cerebras API"""
    try:
        if not app.config['CEREBRAS_API_KEY']:
            return jsonify({'error': 'Cerebras API key not configured'}), 500
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Make request to Cerebras API (placeholder)
        response_data = {
            'success': True,
            'response': 'This is a simulated Cerebras API response',
            'model': data.get('model', 'llama3.1-8b'),
            'tokens_used': np.random.randint(50, 200),
            'processing_time': round(np.random.uniform(0.5, 2.0), 3)
        }
        
        logger.info("Cerebras API request processed", request_data=data)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Cerebras API request failed", error=str(e))
        return jsonify({'error': 'Failed to process Cerebras API request'}), 500

@app.route('/api/system/status', methods=['GET'])
def system_status():
    """Get system status information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        status = {
            'cpu': {
                'usage_percent': cpu_percent,
                'count': psutil.cpu_count()
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            },
            'python_version': sys.version,
            'uptime': datetime.utcnow().isoformat()
        }
        
        return jsonify(status), 200
        
    except Exception as e:
        logger.error("Failed to get system status", error=str(e))
        return jsonify({'error': 'Failed to retrieve system status'}), 500

# Root route for basic API info
@app.route('/')
def index():
    """API information endpoint"""
    return jsonify({
        'name': 'CereStudioAI Enhanced Backend',
        'version': '2.1.0',
        'status': 'running',
        'environment': app.config['FLASK_ENV'],
        'endpoints': {
            'health': '/health',
            'metrics': '/metrics',
            'analytics_events': '/api/analytics/events',
            'dashboard': '/api/analytics/dashboard',
            'cerebras': '/api/ai/cerebras',
            'system_status': '/api/system/status'
        }
    })

# Development server
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = app.config['FLASK_ENV'] == 'development'
    
    logger.info(
        "Starting CereStudioAI Enhanced Backend",
        version="2.1.0",
        port=port,
        debug=debug,
        environment=app.config['FLASK_ENV']
    )
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
