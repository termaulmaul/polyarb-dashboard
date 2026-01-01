# API Reference

## Backend API Endpoints

PolyArb provides a comprehensive REST API for arbitrage operations, monitoring, and configuration management.

### Base URL
```
http://localhost:3001
```

### Authentication
All trading endpoints require valid Polymarket API credentials configured in environment variables.

---

## Core Endpoints

### GET /health
Health check endpoint for system monitoring.

**Response:**
```json
{
  "active_executions": 0,
  "bot_enabled": false,
  "opportunities_count": 8,
  "status": "healthy",
  "timestamp": "2026-01-01T16:42:08.123456"
}
```

### GET /api/opportunities
Retrieve current arbitrage opportunities.

**Response:**
```json
[
  {
    "id": "arb_123456",
    "marketId": "123456",
    "marketName": "Will BTC reach $100k in 2026?",
    "yesAsk": 0.65,
    "noAsk": 0.33,
    "sum": 0.98,
    "edge": 2.0,
    "executable": true,
    "updatedAt": "2026-01-01T16:42:08.123456",
    "volume": 1000000
  }
]
```

**Fields:**
- `id`: Unique arbitrage opportunity identifier
- `marketId`: Polymarket contract ID
- `marketName`: Human-readable market description
- `yesAsk`: Best ask price for YES token
- `noAsk`: Best ask price for NO token
- `sum`: Sum of ask prices (should be < 1.0 for arbitrage)
- `edge`: Arbitrage edge percentage
- `executable`: Whether bot will execute this opportunity
- `updatedAt`: Last data update timestamp
- `volume`: 24h trading volume

### GET /api/logs
Retrieve execution logs and trading history.

**Parameters:**
- `limit` (optional): Maximum number of logs to return (default: 50)

**Response:**
```json
[
  {
    "id": "exec_1704123456_42",
    "timestamp": "2026-01-01T16:42:08.123456",
    "market": "Will BTC reach $100k in 2026?",
    "market_id": "123456",
    "yes_price": 0.65,
    "no_price": 0.33,
    "sum_price": 0.98,
    "edge": 2.0,
    "position_size": 25.0,
    "status": "BOTH_FILLED",
    "pnl": 0.0,
    "details": "Both legs filled successfully - risk-free arbitrage position",
    "execution_time": 2.34
  }
]
```

### GET /api/metrics
Retrieve current system metrics and performance data.

**Response:**
```json
{
  "bot_enabled": true,
  "daily_pnl": 12.50,
  "total_executions": 45,
  "success_rate": 0.89,
  "average_edge": 1.8,
  "current_position_size": 25.0,
  "active_positions": 0,
  "last_execution": "2026-01-01T16:42:08.123456"
}
```

### POST /api/bot/enable
Enable arbitrage bot with specified parameters.

**Request Body:**
```json
{
  "enabled": true,
  "min_edge": 0.5,
  "max_position_size": 100,
  "execution_timeout": 30
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Bot enabled with parameters",
  "config": {
    "enabled": true,
    "min_edge": 0.5,
    "max_position_size": 100,
    "execution_timeout": 30
  }
}
```

### POST /api/bot/disable
Disable arbitrage bot.

**Response:**
```json
{
  "status": "success",
  "message": "Bot disabled"
}
```

---

## Configuration Endpoints

### GET /api/config
Retrieve current bot configuration.

**Response:**
```json
{
  "enabled": false,
  "min_edge": 0.5,
  "max_position_size": 100,
  "execution_timeout": 30,
  "max_one_leg_exposure": 10,
  "scan_interval": 3000,
  "max_concurrent_executions": 3,
  "max_retries": 2,
  "initial_position_size": 10.0,
  "scaling_factor": 1.5,
  "max_scaling_size": 100.0,
  "min_success_rate": 0.8,
  "scaling_window": 10,
  "emergency_stop_loss": -50.0
}
```

### PUT /api/config
Update bot configuration parameters.

**Request Body:**
```json
{
  "min_edge": 1.0,
  "max_position_size": 50,
  "execution_timeout": 45
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Configuration updated",
  "config": { ... }
}
```

---

## Risk Management Endpoints

### GET /api/risk/status
Retrieve current risk management status.

**Response:**
```json
{
  "trading_enabled": true,
  "daily_pnl": 12.50,
  "current_position_size": 25.0,
  "success_rate": 0.89,
  "execution_history_count": 45,
  "naked_positions": [],
  "last_scaling_check": "2026-01-01T16:42:08.123456"
}
```

### GET /api/risk/positions
Retrieve all active positions.

**Response:**
```json
[
  {
    "market_id": "123456",
    "type": "hedged",
    "size": 25.0,
    "timestamp": "2026-01-01T16:42:08.123456",
    "pnl": 0.0
  }
]
```

### POST /api/risk/emergency-stop
Trigger emergency stop (disables trading).

**Response:**
```json
{
  "status": "success",
  "message": "Emergency stop activated - trading disabled",
  "daily_pnl": -45.50
}
```

---

## WebSocket Endpoints

### WS /ws/opportunities
Real-time arbitrage opportunities stream.

**Message Format:**
```json
{
  "type": "opportunities_update",
  "data": [
    {
      "id": "arb_123456",
      "marketId": "123456",
      "marketName": "Will BTC reach $100k in 2026?",
      "yesAsk": 0.65,
      "noAsk": 0.33,
      "sum": 0.98,
      "edge": 2.0,
      "executable": true,
      "updatedAt": "2026-01-01T16:42:08.123456"
    }
  ]
}
```

### WS /ws/executions
Real-time execution updates stream.

**Message Format:**
```json
{
  "type": "execution_update",
  "data": {
    "id": "exec_1704123456_42",
    "status": "BOTH_FILLED",
    "pnl": 0.0,
    "details": "Both legs filled successfully",
    "timestamp": "2026-01-01T16:42:08.123456"
  }
}
```

### WS /ws/metrics
Real-time metrics updates stream.

**Message Format:**
```json
{
  "type": "metrics_update",
  "data": {
    "daily_pnl": 12.50,
    "success_rate": 0.89,
    "current_position_size": 25.0,
    "active_positions": 1
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": {
    "field": "specific_field",
    "value": "problematic_value"
  }
}
```

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_CREDENTIALS` | API credentials invalid | Check .env file |
| `INSUFFICIENT_BALANCE` | Wallet balance too low | Add funds to wallet |
| `MARKET_INACTIVE` | Market no longer active | Skip this market |
| `ORDER_REJECTED` | Order parameters invalid | Check size/price limits |
| `NETWORK_ERROR` | Connectivity issues | Retry after delay |
| `RISK_LIMIT_EXCEEDED` | Position size too large | Reduce position size |
| `EMERGENCY_STOP` | Risk management triggered | Manual intervention required |

---

## Rate Limits

- **Opportunities**: 120 requests/minute
- **Logs**: 60 requests/minute
- **Metrics**: 120 requests/minute
- **Configuration**: 30 requests/minute
- **Trading Operations**: 10 requests/minute

Rate limits reset every minute. Exceeded limits return HTTP 429.

---

## SDK Examples

### Python Client

```python
import requests

class PolyArbClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url

    def get_opportunities(self):
        response = requests.get(f"{self.base_url}/api/opportunities")
        return response.json()

    def get_metrics(self):
        response = requests.get(f"{self.base_url}/api/metrics")
        return response.json()

    def enable_bot(self, config):
        response = requests.post(f"{self.base_url}/api/bot/enable", json=config)
        return response.json()

# Usage
client = PolyArbClient()
opportunities = client.get_opportunities()
metrics = client.get_metrics()
```

### JavaScript Client

```javascript
class PolyArbClient {
    constructor(baseURL = 'http://localhost:3001') {
        this.baseURL = baseURL;
    }

    async getOpportunities() {
        const response = await fetch(`${this.baseURL}/api/opportunities`);
        return response.json();
    }

    async getMetrics() {
        const response = await fetch(`${this.baseURL}/api/metrics`);
        return response.json();
    }

    async enableBot(config) {
        const response = await fetch(`${this.baseURL}/api/bot/enable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        return response.json();
    }
}

// Usage
const client = new PolyArbClient();
const opportunities = await client.getOpportunities();
const metrics = await client.getMetrics();
```

### WebSocket Client

```javascript
// Opportunities stream
const opportunitiesWs = new WebSocket('ws://localhost:3001/ws/opportunities');
opportunitiesWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New opportunities:', data.data);
};

// Executions stream
const executionsWs = new WebSocket('ws://localhost:3001/ws/executions');
executionsWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('New execution:', data.data);
};
```

---

## Data Types

### Opportunity
```typescript
interface Opportunity {
  id: string;
  marketId: string;
  marketName: string;
  yesAsk: number;
  noAsk: number;
  sum: number;
  edge: number;
  executable: boolean;
  updatedAt: string;
  volume: number;
}
```

### ExecutionLog
```typescript
interface ExecutionLog {
  id: string;
  timestamp: string;
  market: string;
  market_id: string;
  yes_price: number;
  no_price: number;
  sum_price: number;
  edge: number;
  position_size: number;
  status: 'BOTH_FILLED' | 'ONE_FILLED' | 'NONE_FILLED' | 'FAILED';
  pnl: number;
  details: string;
  execution_time: number;
}
```

### BotConfig
```typescript
interface BotConfig {
  enabled: boolean;
  min_edge: number;
  max_position_size: number;
  execution_timeout: number;
  max_one_leg_exposure: number;
  scan_interval: number;
  max_concurrent_executions: number;
  max_retries: number;
  initial_position_size: number;
  scaling_factor: number;
  max_scaling_size: number;
  min_success_rate: number;
  scaling_window: number;
  emergency_stop_loss: number;
}
```

This API provides comprehensive access to all PolyArb functionality, enabling integration with external systems, monitoring tools, and trading applications.