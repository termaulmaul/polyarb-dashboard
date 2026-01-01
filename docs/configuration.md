# Configuration Guide

## Environment Variables

### Required Credentials

```bash
# Polymarket API Credentials
# Get from: https://polymarket.com/profile/api-keys
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_PASSPHRASE=your_passphrase_here

# Wallet Private Key (NEVER share this!)
# Get from your wallet (MetaMask, etc.)
WALLET_PRIVATE_KEY=your_private_key_here
```

### Optional Configuration

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database (if used)
DATABASE_URL=postgresql://user:pass@localhost:5432/polyarb

# Logging
LOG_LEVEL=info
LOG_FILE=logs/polyarb.log

# Security
CORS_ORIGIN=http://localhost:8080
SESSION_SECRET=your_secret_here
```

## Bot Configuration

### Core Trading Parameters

```python
@dataclass
class BotConfig:
    # Trading Control
    enabled: bool = False
    min_edge: float = 0.5  # Minimum 0.5% edge to execute

    # Position Sizing
    initial_position_size: float = 10.0  # Start with $10 per leg
    max_position_size: float = 100.0     # Maximum $100 per leg
    scaling_factor: float = 1.5          # Scale up by 50% on success
    max_scaling_size: float = 100.0      # Maximum size to scale to

    # Timing
    execution_timeout: int = 30          # Max 30 seconds exposure
    max_one_leg_exposure: int = 10       # Max 10 seconds for unfilled leg
    scan_interval: int = 3000            # Scan every 3 seconds

    # Risk Management
    min_success_rate: float = 0.8        # Need 80% success to scale
    scaling_window: int = 10             # Evaluate last 10 trades
    emergency_stop_loss: float = -50.0   # Stop if daily loss > $50
    max_daily_loss: float = -100.0       # Absolute daily loss limit
```

## Network Configuration

### Polygon Network Settings

```javascript
const POLYGON_CONFIG = {
  chainId: 137,
  rpcUrl: 'https://polygon-rpc.com/',
  blockExplorer: 'https://polygonscan.com/',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  }
}
```

### API Endpoints

```javascript
const API_ENDPOINTS = {
  // Polymarket
  baseUrl: 'https://clob.polymarket.com',
  markets: '/markets',
  orders: '/orders',
  positions: '/positions',

  // Local Backend
  backend: 'http://localhost:3001',
  health: '/health',
  arbitrage: '/api/arbitrage',
  execute: '/api/execute'
}
```

## Frontend Configuration

### UI Settings

```typescript
interface UIConfig {
  // Update Intervals
  marketRefreshInterval: 5000,    // 5 seconds
  metricsRefreshInterval: 10000,  // 10 seconds

  // Display Options
  maxOpportunities: 50,
  decimalPlaces: 4,
  currencySymbol: '$',

  // Responsive Breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  }
}
```

### WebSocket Configuration

```typescript
interface WSConfig {
  url: 'ws://localhost:3001/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000
}
```

## Security Configuration

### API Security

```python
API_SECURITY = {
    'rate_limit': '100/hour',
    'cors_origins': ['http://localhost:8080'],
    'api_keys_required': True,
    'encryption_enabled': True
}
```

### Wallet Security

```python
WALLET_SECURITY = {
    'key_encryption': True,
    'session_timeout': 3600,  # 1 hour
    'max_retries': 3,
    'lockout_duration': 300   # 5 minutes
}
```

## Logging Configuration

### Log Levels

```python
LOG_CONFIG = {
    'version': 1,
    'formatters': {
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
    },
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/polyarb.log',
            'formatter': 'detailed'
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'detailed'
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file', 'console']
    }
}
```

## Performance Configuration

### Optimization Settings

```python
PERFORMANCE_CONFIG = {
    'max_concurrent_requests': 10,
    'request_timeout': 30,
    'cache_ttl': 300,  # 5 minutes
    'batch_size': 100,
    'memory_limit': '512MB'
}
```

## Deployment Configuration

### Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - POLYMARKET_API_KEY=${POLYMARKET_API_KEY}
      - POLYMARKET_API_PASSPHRASE=${POLYMARKET_API_PASSPHRASE}
      - WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY}
```

### Production Environment

```bash
# Production .env
NODE_ENV=production
PORT=8080
POLYMARKET_API_KEY=prod_key_here
POLYMARKET_API_PASSPHRASE=prod_passphrase_here
WALLET_PRIVATE_KEY=prod_private_key
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
```

## Configuration Validation

### Startup Checks

```python
def validate_config():
    """Validate all required configuration on startup"""
    required_vars = [
        'POLYMARKET_API_KEY',
        'POLYMARKET_API_PASSPHRASE',
        'WALLET_PRIVATE_KEY'
    ]

    for var in required_vars:
        if not os.getenv(var):
            raise ValueError(f"Missing required environment variable: {var}")

    # Validate wallet format
    private_key = os.getenv('WALLET_PRIVATE_KEY')
    if not is_valid_private_key(private_key):
        raise ValueError("Invalid wallet private key format")

    print("✅ Configuration validation passed")
```

### Runtime Validation

```python
def validate_trading_config(config: BotConfig):
    """Validate trading configuration parameters"""
    assert 0 < config.min_edge <= 5, "min_edge must be between 0 and 5%"
    assert config.initial_position_size > 0, "position_size must be positive"
    assert config.execution_timeout > 0, "execution_timeout must be positive"
    assert 0 < config.min_success_rate <= 1, "success_rate must be between 0 and 1"

    print("✅ Trading configuration validated")
```

## Configuration Management

### Environment-Specific Configs

```python
def load_config(env: str = 'development'):
    """Load configuration based on environment"""
    base_config = {
        'development': {
            'debug': True,
            'log_level': 'debug',
            'mock_trading': True
        },
        'staging': {
            'debug': False,
            'log_level': 'info',
            'mock_trading': False
        },
        'production': {
            'debug': False,
            'log_level': 'warn',
            'mock_trading': False
        }
    }

    return base_config.get(env, base_config['development'])
```

### Hot Reload

```python
def watch_config_changes():
    """Watch for configuration file changes and reload"""
    import time
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

    class ConfigHandler(FileSystemEventHandler):
        def on_modified(self, event):
            if event.src_path.endswith('config.py'):
                print("🔄 Configuration reloaded")
                reload_config()

    observer = Observer()
    observer.schedule(ConfigHandler(), path='.', recursive=False)
    observer.start()
```