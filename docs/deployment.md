# Deployment Guide

## Overview

This guide covers deploying PolyArb in production environments. The system is designed for reliability, security, and scalability.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows (WSL2)
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Stable internet connection

### Software Dependencies
- **Node.js**: 18.0.0 or higher
- **Python**: 3.8.0 or higher
- **pnpm**: Latest stable version
- **Git**: Latest stable version

### External Services
- **Polymarket Account**: API keys and wallet
- **Database**: PostgreSQL (optional, for advanced logging)
- **Monitoring**: Prometheus/Grafana (optional)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/termaulmaul/polyarb-dashboard.git
cd polyarb-dashboard
```

### 2. Install Dependencies

```bash
# Frontend dependencies
pnpm install

# Backend dependencies
cd backend/python
pip install -r requirements.txt
cd ../..
```

### 3. Configure Environment

Create `.env` file in project root:

```bash
# Polymarket API Credentials
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_PASSPHRASE=your_passphrase_here

# Wallet Private Key (KEEP SECURE!)
WALLET_PRIVATE_KEY=your_private_key_here

# System Configuration
NODE_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/polyarb

# Monitoring (optional)
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

### 4. Wallet Setup

#### Get Polymarket API Keys
1. Visit https://polymarket.com/profile/api-keys
2. Generate new API key and passphrase
3. Save credentials securely

#### Wallet Configuration
1. Use MetaMask, WalletConnect, or Coinbase Wallet
2. Ensure wallet has POLYGON network configured
3. Export private key securely (never commit to git)
4. Fund wallet with sufficient POLYGON for gas fees

## Development Deployment

### Quick Start (Demo Mode)

```bash
# Start in demo mode (safe, no real trading)
./start_full.sh

# Verify demo mode warnings in logs
# Open http://localhost:8080
```

### Development with Real Trading

```bash
# Ensure .env file has real credentials
# Start with small position sizes
./start_full.sh

# Monitor logs closely
# Enable bot with $1-5 position sizes initially
```

## Production Deployment

### Option 1: Docker Deployment

#### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 3001
CMD ["python", "app.py"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production

  backend:
    build: ./backend/python
    ports:
      - "3001:3001"
    environment:
      - POLYMARKET_API_KEY=${POLYMARKET_API_KEY}
      - POLYMARKET_API_PASSPHRASE=${POLYMARKET_API_PASSPHRASE}
      - WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY}
    volumes:
      - ./logs:/app/logs

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=polyarb
      - POSTGRES_USER=polyarb
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### Deploy with Docker
```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

### Option 2: Cloud Deployment

#### AWS EC2 Deployment

```bash
# Provision EC2 instance (t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups polyarb-sg

# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip postgresql

# Clone and setup
git clone https://github.com/termaulmaul/polyarb-dashboard.git
cd polyarb-dashboard

# Setup environment
cp .env.example .env
nano .env  # Configure credentials

# Install and start
pnpm install
cd backend/python && pip install -r requirements.txt
cd ../..

# Start services
./start_full.sh
```

#### DigitalOcean App Platform

1. **Create App Spec** (`app.yaml`):
```yaml
name: polyarb-dashboard
services:
- name: frontend
  source_dir: /
  github:
    repo: termaulmaul/polyarb-dashboard
    branch: main
  run_command: pnpm run build && pnpm preview
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production

- name: backend
  source_dir: backend/python
  github:
    repo: termaulmaul/polyarb-dashboard
    branch: main
  run_command: python app.py
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: POLYMARKET_API_KEY
    value: ${POLYMARKET_API_KEY}
    type: SECRET
  - key: POLYMARKET_API_PASSPHRASE
    value: ${POLYMARKET_API_PASSPHRASE}
    type: SECRET
  - key: WALLET_PRIVATE_KEY
    value: ${WALLET_PRIVATE_KEY}
    type: SECRET
```

2. **Deploy**:
```bash
doctl apps create --spec app.yaml
```

### Option 3: Heroku Deployment

#### Frontend Deployment
```bash
# Build for static hosting
pnpm run build

# Deploy to Netlify/Vercel/Surge
npx surge dist/
# or
npx vercel --prod
```

#### Backend Deployment
```bash
# Create Heroku app
heroku create polyarb-backend

# Set environment variables
heroku config:set POLYMARKET_API_KEY=your_key
heroku config:set POLYMARKET_API_PASSPHRASE=your_passphrase
heroku config:set WALLET_PRIVATE_KEY=your_private_key

# Deploy
git push heroku main
```

## Configuration Tuning

### Production Configuration

```python
# config/production.py
@dataclass
class ProductionConfig:
    # Conservative production settings
    enabled: bool = False  # Require manual enable
    min_edge: float = 1.0  # Higher edge threshold
    max_position_size: float = 25.0  # Smaller positions
    execution_timeout: int = 45  # Longer timeout
    scan_interval: int = 10000  # Less frequent scanning

    # Risk management
    initial_position_size: float = 5.0  # Very conservative start
    emergency_stop_loss: float = -25.0  # Tighter stop loss
    max_concurrent_executions: int = 1  # Sequential execution
```

### Environment-Specific Config

```bash
# .env.production
NODE_ENV=production
DEBUG=false
LOG_LEVEL=WARNING

# Performance tuning
UV_THREADPOOL_SIZE=4
NODE_OPTIONS="--max-old-space-size=512"

# Security
SESSION_SECRET=your-secret-key
CORS_ORIGINS=https://yourdomain.com
```

## Monitoring & Observability

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl -I http://localhost:8080

# API responsiveness
curl http://localhost:3001/api/opportunities
```

### Log Aggregation

```bash
# View recent logs
tail -f backend/python/logs/polyarb.log

# Search for errors
grep "ERROR" backend/python/logs/polyarb.log

# Monitor execution success
grep "BOTH_FILLED" backend/python/logs/polyarb.log | wc -l
```

### Metrics Dashboard

```bash
# Install monitoring stack
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# Configure Grafana datasource to point to Prometheus
# Add PolyArb metrics endpoint: http://localhost:3001/metrics
```

### Alerting

```bash
# Email alerts for critical events
# Configure SMTP in environment
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=alerts@yourdomain.com

# Alert triggers:
# - Daily loss > $25
# - Success rate < 70%
# - API connectivity issues
# - Emergency stops triggered
```

## Security Best Practices

### Credential Management
```bash
# Never commit secrets to git
git secrets --install
git secrets --register-aws  # Prevents AWS keys
git secrets --add 'POLYMARKET_API_KEY'
git secrets --add 'WALLET_PRIVATE_KEY'

# Use environment variables or secret managers
# Rotate API keys regularly
```

### Network Security
```bash
# Use HTTPS in production
# Configure firewall rules
sudo ufw allow 8080/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 22/tcp    # SSH only
sudo ufw --force enable

# Use reverse proxy (nginx)
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup & Recovery

```bash
# Database backups
pg_dump polyarb > backup_$(date +%Y%m%d_%H%M%S).sql

# Log rotation
logrotate -f /etc/logrotate.d/polyarb

# Configuration backups
cp .env .env.backup.$(date +%Y%m%d)

# Full system backup
tar -czf backup_$(date +%Y%m%d).tar.gz \
    /path/to/polyarb \
    /var/lib/postgresql \
    /etc/nginx/sites-available
```

## Scaling Considerations

### Horizontal Scaling
```yaml
# Kubernetes deployment for scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: polyarb-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: polyarb-backend
  template:
    spec:
      containers:
      - name: polyarb
        image: polyarb:latest
        env:
        - name: POLYMARKET_API_KEY
          valueFrom:
            secretKeyRef:
              name: polyarb-secrets
              key: api-key
```

### Performance Optimization
```python
# Gunicorn for production serving
gunicorn --workers 4 --bind 0.0.0.0:3001 app:app

# Database connection pooling
SQLALCHEMY_POOL_SIZE = 10
SQLALCHEMY_MAX_OVERFLOW = 20

# Redis for caching (optional)
REDIS_URL = redis://localhost:6379
CACHE_TTL = 300  # 5 minutes
```

## Troubleshooting Production

### Common Issues

#### High Latency
```bash
# Check network connectivity
ping clob.polymarket.com

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/opportunities

# Optimize database queries
EXPLAIN ANALYZE SELECT * FROM executions WHERE created_at > NOW() - INTERVAL '1 day';
```

#### Memory Issues
```bash
# Monitor memory usage
htop
free -h

# Configure Python memory limits
export PYTHONMALLOC=jemalloc
export MALLOC_ARENA_MAX=2
```

#### Database Performance
```bash
# Check slow queries
SELECT pid, query, state, wait_event
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '1 minute';

# Add indexes for performance
CREATE INDEX idx_executions_timestamp ON executions(created_at);
CREATE INDEX idx_executions_status ON executions(status);
```

### Emergency Procedures

#### Emergency Stop
```bash
# Immediate stop all trading
curl -X POST http://localhost:3001/api/risk/emergency-stop

# Kill all processes
./kill-ports.sh
pkill -f "python app.py"
pkill -f "vite"

# Check for naked positions manually
curl http://localhost:3001/api/risk/positions
```

#### Recovery Process
```bash
# 1. Assess damage
curl http://localhost:3001/api/risk/status

# 2. Close any naked positions manually
# 3. Reset risk state if needed
# 4. Restart with conservative settings
# 5. Monitor closely for 24 hours
```

## Maintenance Schedule

### Daily Tasks
- [ ] Review execution logs
- [ ] Check system health
- [ ] Monitor PnL performance
- [ ] Update market data

### Weekly Tasks
- [ ] Rotate API keys
- [ ] Update dependencies
- [ ] Review risk parameters
- [ ] Backup database

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update trading strategies
- [ ] Review emergency procedures

This deployment guide ensures PolyArb runs reliably and securely in production environments while maintaining the highest standards of risk management and operational excellence.