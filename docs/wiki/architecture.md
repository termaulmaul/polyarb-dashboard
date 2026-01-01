# PolyArb Architecture Overview

## System Architecture

PolyArb is a production-ready arbitrage trading system designed for Polymarket's binary options market. The system follows a modular architecture with clear separation of concerns and multiple safety layers.

## Core Components

### 1. Frontend Dashboard (React/TypeScript)

**Location**: `src/`
**Purpose**: Real-time trading dashboard and user interface

#### Key Components:
- **OpportunitiesTable**: Live arbitrage opportunity display
- **BotControlPanel**: Trading parameter configuration
- **ExecutionLog**: Real-time execution monitoring
- **MetricsSidebar**: Performance metrics and risk monitoring
- **WalletConnect**: Secure wallet integration

#### Features:
- Real-time data updates (5-second intervals)
- Responsive design (mobile/tablet/desktop)
- WebSocket integration for live updates
- Comprehensive error handling and user feedback

### 2. Backend Engine (Flask/Python)

**Location**: `backend/python/`
**Purpose**: Core arbitrage logic and execution engine

#### Key Components:
- **OrderManager**: Production-ready order placement and monitoring
- **WalletManager**: Secure credential management and validation
- **PositionValidator**: Risk management and position safety
- **RiskManager**: Adaptive position sizing and emergency controls

#### Architecture Layers:

```
┌─────────────────────────────────────────┐
│         API Layer (Flask)               │
├─────────────────────────────────────────┤
│  Arbitrage Scanner → OrderManager       │
│  Risk Management → PositionValidator    │
│  Wallet Security → WalletManager        │
├─────────────────────────────────────────┤
│         CLOB API Layer                  │
└─────────────────────────────────────────┘
```

## Data Flow

### 1. Market Scanning Phase

```
Polymarket API → Arbitrage Scanner → Edge Calculation → Opportunity Queue
```

- Fetches live market data from Polymarket
- Calculates arbitrage edges for all active markets
- Filters opportunities based on minimum edge threshold
- Updates dashboard with real-time opportunities

### 2. Execution Phase

```
Opportunity → Risk Assessment → Order Placement → Fill Monitoring → Position Validation
```

- Validates position safety (no naked exposure)
- Places simultaneous BUY orders for YES and NO tokens
- Monitors order fills with timeout protection
- Validates final position state
- Logs comprehensive execution details

### 3. Risk Management Phase

```
Execution History → Performance Analysis → Position Scaling → Emergency Controls
```

- Tracks success rates and PnL over rolling windows
- Adjusts position sizes based on empirical performance
- Implements emergency stops for excessive losses
- Maintains comprehensive audit trails

## Safety Architecture

### Multiple Protection Layers

#### 1. Input Validation
- Wallet credential verification
- API key authentication
- Parameter bounds checking
- Market data validation

#### 2. Execution Safety
- Atomic order placement (both legs simultaneously)
- Timeout protection (30-second max exposure)
- Fill validation before position confirmation
- Emergency cancellation mechanisms

#### 3. Position Safety
- Pre-execution position validation
- Post-execution exposure checking
- Naked position detection and mitigation
- Hedged position requirements

#### 4. Risk Controls
- Daily loss limits with automatic shutdown
- Adaptive position sizing based on performance
- Success rate monitoring with scaling controls
- Manual override capabilities

### Demo Mode Protection

When credentials are missing, the system automatically enters **demo mode**:

- All trading logic executes normally
- Orders are simulated with realistic outcomes
- No real money is risked
- Clear warnings displayed throughout UI
- Comprehensive logging for testing validation

## Performance Characteristics

### Scalability
- **Concurrent Executions**: Up to 3 simultaneous arbitrage attempts
- **Market Coverage**: 100+ active Polymarket contracts
- **Update Frequency**: 5-second market data refresh
- **Execution Speed**: Sub-second order placement

### Reliability
- **Uptime Target**: 99.9% (excluding planned maintenance)
- **Error Recovery**: Automatic retry with exponential backoff
- **Data Integrity**: Comprehensive validation at all layers
- **Audit Trail**: Complete execution history with timestamps

### Monitoring
- **Real-time Metrics**: Dashboard displays live performance
- **Health Checks**: Automated system health monitoring
- **Alert System**: Configurable alerts for critical events
- **Log Aggregation**: Structured logging for analysis

## Deployment Architecture

### Development Environment
```
Local Machine
├── Frontend (Vite dev server)
├── Backend (Flask dev server)
└── Demo Mode (Mock CLOB client)
```

### Production Environment
```
Cloud Infrastructure
├── Frontend (Static hosting)
├── Backend (Containerized Flask app)
├── Database (Execution logs & metrics)
└── Monitoring (Health checks & alerts)
```

### Security Considerations
- **Credential Isolation**: Sensitive data never logged
- **Network Security**: HTTPS-only communication
- **Access Control**: API key rotation and validation
- **Audit Logging**: All actions logged with timestamps

## Integration Points

### Polymarket CLOB API
- **Authentication**: API key + passphrase + wallet signature
- **Order Types**: GTC limit orders for arbitrage precision
- **Market Data**: Real-time order book and market information
- **Position Tracking**: Account balance and position monitoring

### Wallet Integration
- **Supported Wallets**: MetaMask, WalletConnect, Coinbase Wallet
- **Network**: Polygon mainnet (automatic switching)
- **Security**: Client-side key management, never transmitted
- **Transaction Signing**: EIP-712 compliant signature generation

### External Dependencies
- **py-clob-client**: Official Polymarket Python SDK
- **Web3.py**: Ethereum interaction and signature handling
- **Flask-CORS**: Cross-origin request handling
- **React Query**: Frontend data fetching and caching

## Configuration Management

### Environment Variables
```bash
# Polymarket API
POLYMARKET_API_KEY=...
POLYMARKET_API_PASSPHRASE=...

# Wallet
WALLET_PRIVATE_KEY=...

# System
DEBUG=true
LOG_LEVEL=INFO
```

### Runtime Configuration
- **BotConfig**: Trading parameters (edges, sizes, timeouts)
- **RiskConfig**: Safety parameters (limits, scaling factors)
- **NetworkConfig**: API endpoints and timeouts

## Testing Strategy

### Unit Testing
- Individual component testing
- Mock external dependencies
- Edge case validation
- Error condition handling

### Integration Testing
- End-to-end execution flows
- API integration validation
- Performance benchmarking
- Load testing scenarios

### Demo Mode Testing
- Full system testing without financial risk
- Realistic simulation of market conditions
- UI/UX validation across devices
- Performance monitoring and optimization

## Future Enhancements

### Planned Features
- **Multi-market Support**: Cross-exchange arbitrage
- **Advanced Strategies**: Statistical arbitrage models
- **Portfolio Optimization**: Multi-asset position management
- **Machine Learning**: Predictive edge detection

### Scalability Improvements
- **Microservices Architecture**: Component separation
- **Database Integration**: Historical data storage
- **Real-time Alerts**: SMS/email notifications
- **Advanced Analytics**: Performance dashboards

This architecture provides a solid foundation for reliable, scalable arbitrage trading while maintaining the highest standards of safety and risk management.