# PolyArb Backend

A production-ready Node.js backend for Polymarket arbitrage trading with real-time WebSocket updates.

## 🚀 Features

- **Pure Arbitrage**: YES + NO < 1.00 detection and execution
- **Real-time Scanning**: Continuous market monitoring
- **Dual-leg Execution**: Atomic arbitrage with timeout protection
- **Risk Management**: Position limits, execution guards, partial fill handling
- **WebSocket Streaming**: Real-time updates to frontend
- **SQLite Storage**: Persistent execution logs and metrics
- **Production Ready**: Error handling, logging, graceful shutdown

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js + WebSocket
- **Database**: SQLite (better-sqlite3)
- **CLOB Client**: Official @polymarket/clob-client
- **Validation**: Zod
- **Logging**: Winston
- **Process Management**: PM2 ready

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # HTTP + WS bootstrap
│   ├── config/
│   │   ├── env.ts             # Environment validation
│   │   └── constants.ts       # App constants
│   ├── polymarket/
│   │   ├── clobClient.ts      # Polymarket CLOB wrapper
│   │   ├── markets.ts         # Market data management
│   │   ├── orderbook.ts       # Order book fetching
│   │   └── auth.ts            # (Future) API authentication
│   ├── arb/
│   │   ├── scanner.ts         # Arbitrage opportunity detection
│   │   ├── executor.ts        # Dual-leg execution engine
│   │   ├── risk.ts            # Risk management & validation
│   │   └── state.ts           # Execution state tracking
│   ├── api/
│   │   ├── routes.ts          # REST API endpoints
│   │   └── ws.ts              # WebSocket real-time updates
│   ├── metrics/
│   │   └── calculator.ts      # PnL, win rate, analytics
│   ├── storage/
│   │   └── logs.ts            # SQLite execution logs
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   └── utils/
│       └── logger.ts          # Winston logging setup
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── .env.example               # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Polymarket account with private key

### Installation

```bash
# Clone and navigate
cd backend

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your Polymarket credentials
nano .env
```

### Configuration

Edit `.env` file:

```bash
# Required: Your Polymarket wallet private key
PM_PRIVATE_KEY=0x...

# Optional: Defaults shown
PM_CHAIN=polygon
PM_CLOB_HOST=https://clob.polymarket.com
MIN_EDGE_DEFAULT=1.5
MAX_POSITION_DEFAULT=10
EXECUTION_TIMEOUT_MS=3000
PORT=3001
```

### Running

```bash
# Development (with hot reload)
pnpm run dev

# Production build
pnpm run build
pnpm start

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

## 🔌 API Reference

### REST Endpoints

#### Markets
- `GET /api/markets` - Active Polymarket markets

#### Arbitrage
- `GET /api/opportunities` - Current arbitrage opportunities
- `POST /api/execute` - Execute arbitrage for market

#### Bot Control
- `GET /api/bot/status` - Bot status and configuration
- `POST /api/bot/config` - Update bot configuration
- `POST /api/bot/enable` - Enable bot
- `POST /api/bot/disable` - Disable bot

#### Analytics
- `GET /api/metrics` - Dashboard metrics (PnL, win rate, etc.)
- `GET /api/logs` - Execution logs with filtering

#### Health
- `GET /api/health` - Service health check

### WebSocket Streaming

Connect to `ws://localhost:3001/stream`

#### Message Types
- `opportunities` - Real-time arbitrage opportunities
- `metrics` - Live dashboard metrics
- `execution_log` - New execution logs
- `bot` - Bot status updates

#### Client Messages
```json
{
  "type": "subscribe",
  "topics": ["opportunities", "metrics", "logs"]
}
```

## 🎯 Arbitrage Logic

### Detection Algorithm

```typescript
// Core arbitrage condition
const sum = yesAsk + noAsk;
const edge = (1.0 - sum) * 100;

if (edge >= minEdge && sum < 1.0) {
  // Arbitrage opportunity exists
  return { executable: true, edge };
}
```

### Execution Flow

1. **Validation**: Bot enabled, edge meets threshold, position limits
2. **Dual-leg Placement**: BUY YES + BUY NO simultaneously
3. **Monitoring**: Track order status with timeout
4. **Resolution**:
   - **BOTH_FILLED**: Success, calculate PnL
   - **PARTIAL_FILL**: Cancel remaining, log partial
   - **FAILED**: Cancel all orders
   - **TIMEOUT**: Emergency cancellation

### Risk Management

- **Position Sizing**: Configurable max position per trade
- **Execution Timeout**: Prevent hanging orders (default 3s)
- **Concurrent Limits**: Max 3 simultaneous executions
- **Partial Fill Handling**: Cancel unfilled legs
- **Emergency Stop**: Immediate cancellation of all orders

## 📊 Metrics & Analytics

### Dashboard Metrics
- **Today PnL**: Daily profit/loss
- **Trades Executed**: Number of executions
- **Win Rate**: Success percentage
- **Average Edge**: Mean arbitrage edge
- **PnL History**: 7-day sparkline data

### Execution Logs
- **Status Tracking**: BOTH_FILLED, PARTIAL_FILL, FAILED, CANCELLED
- **Timing**: Execution timestamps and durations
- **Market Data**: YES/NO prices, expected edge
- **Details**: Error messages, partial fill info

## 🔒 Security

### Private Key Management
- **Backend Only**: Private keys never exposed to frontend
- **Environment Variables**: Secure credential storage
- **No Client Signing**: All transactions signed server-side

### Input Validation
- **Zod Schemas**: Runtime type validation
- **Fail Closed**: Invalid inputs rejected
- **Error Logging**: All validation failures logged

### Network Security
- **Helmet**: Security headers
- **CORS**: Configured origins only
- **Rate Limiting**: Future implementation

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Get opportunities
curl http://localhost:3001/api/opportunities

# WebSocket test
wscat -c ws://localhost:3001/stream
```

### Environment Testing

```bash
# Test without real orders (simulation mode)
NODE_ENV=test pnpm run dev

# Dry run mode (log but don't execute)
DRY_RUN=true pnpm run dev
```

## 📈 Performance

### Benchmarks
- **Scan Interval**: 5 seconds (configurable)
- **Order Book Cache**: 2 seconds TTL
- **WebSocket Broadcast**: 1 second intervals
- **Database**: SQLite with WAL mode

### Optimization Features
- **Connection Pooling**: Efficient CLOB API usage
- **Caching**: Market data and order book caching
- **Async Processing**: Non-blocking execution monitoring
- **Memory Management**: Automatic cleanup of old data

## 🚨 Production Deployment

### PM2 Configuration

```json
{
  "name": "polyarb-backend",
  "script": "dist/server.js",
  "instances": 1,
  "exec_mode": "fork",
  "env": {
    "NODE_ENV": "production"
  },
  "error_log": "./logs/pm2-error.log",
  "out_log": "./logs/pm2-out.log",
  "log_log": "./logs/pm2-combined.log"
}
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Monitoring

- **Health Checks**: `/api/health` endpoint
- **Metrics Export**: Prometheus compatible (future)
- **Log Aggregation**: Winston with file rotation
- **Process Monitoring**: PM2 dashboard

## 🤝 Integration with Frontend

### Data Contract Matching

The backend APIs are designed to match the frontend TypeScript interfaces exactly:

- `Opportunity[]` from `/api/opportunities`
- `DashboardMetrics` from `/api/metrics`
- `ExecutionLog[]` from `/api/logs`
- `BotConfig` from `/api/bot/status`

### Real-time Synchronization

WebSocket streams provide live updates:
- Frontend subscribes to relevant topics
- Backend broadcasts state changes
- Automatic reconnection handling

## 📝 Development Guidelines

### Code Style
- **TypeScript Strict**: All strict checks enabled
- **ESLint**: Airbnb config with TypeScript
- **Prettier**: Consistent formatting
- **Import Order**: Standard library → third-party → local

### Error Handling
- **Try/Catch**: All async operations wrapped
- **Logging**: Winston structured logging
- **Graceful Degradation**: Failures don't crash the service
- **Recovery**: Automatic retry for transient failures

### Testing Strategy
- **Unit Tests**: Core logic (scanner, executor, risk)
- **Integration Tests**: API endpoints
- **E2E Tests**: Full execution flows
- **Load Tests**: Concurrent execution limits

## 🔄 Future Enhancements

### Advanced Features
- **Multi-market Arbitrage**: Cross-market opportunities
- **Dynamic Position Sizing**: Kelly criterion implementation
- **Hedging Strategies**: Partial fill recovery
- **Machine Learning**: Pattern recognition (opt-in only)

### Infrastructure
- **Microservices**: Split scanner/executor services
- **Redis Caching**: High-performance data caching
- **Message Queues**: Async execution processing
- **Load Balancing**: Horizontal scaling support

### Compliance & Security
- **Audit Logging**: SOC2 compliance features
- **Key Rotation**: Automatic credential rotation
- **Rate Limiting**: Advanced DDoS protection
- **Multi-sig**: Enhanced security for large positions

---

## ⚠️ Important Notes

### Risk Disclaimer
This software is for educational and research purposes. Arbitrage opportunities are rare and execution carries financial risk. Always test thoroughly before using with real funds.

### Regulatory Compliance
Ensure compliance with local regulations regarding automated trading and cryptocurrency transactions.

### Support
For issues and questions, please check the logs and ensure proper environment configuration.

---

*Built with production-grade practices for reliable arbitrage execution on Polymarket.*</content>
<parameter name="filePath">/Users/maul/github/polyarb-dashboard/backend/README.md