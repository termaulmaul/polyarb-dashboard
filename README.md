# 🚀 PolyArb - Production-Ready Polymarket Arbitrage Engine

**⚡ Real-Time Binary Market Arbitrage Trading Platform**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/termaulmaul/polyarb-dashboard)
[![Engine](https://img.shields.io/badge/Engine-CLOB%20API-blue)](https://github.com/termaulmaul/polyarb-dashboard)
[![Risk](https://img.shields.io/badge/Risk-Managed-orange)](https://github.com/termaulmaul/polyarb-dashboard)

> **⚠️ PRODUCTION WARNING**: This engine places REAL orders on Polymarket when wallet credentials are provided. Test thoroughly in demo mode before live trading.

---

## 🎯 What is PolyArb?

PolyArb is a **production-ready arbitrage trading engine** for Polymarket's binary options market. It exploits pricing inefficiencies between YES and NO tokens to generate consistent, risk-free profits through mathematical arbitrage.

### Key Features
- ✅ **Real CLOB API Integration** - Direct trading on Polymarket
- ✅ **Simultaneous Order Execution** - Atomic YES+NO arbitrage
- ✅ **Advanced Risk Management** - Position validation, emergency stops
- ✅ **Adaptive Position Sizing** - Start small, scale based on performance
- ✅ **Comprehensive Monitoring** - Real-time execution tracking
- ✅ **Production Safety** - Multiple fail-safes and validation layers

---

## 📊 Economic Model

### Arbitrage Principle
Every Polymarket contract settles to exactly **$1.00 total payout**:
- If outcome = YES: YES token = $1.00, NO token = $0.00
- If outcome = NO: YES token = $0.00, NO token = $1.00

### Arbitrage Opportunity
When `askYES + askNO < $1.00`, there's a guaranteed profit opportunity:
- Buy both tokens at the discounted price
- Hold until settlement for $1.00 total payout
- **Risk-free profit** = `$1.00 - (askYES + askNO)`

### Example
```
Market: "Will BTC reach $100k in 2026?"
YES Ask: $0.65
NO Ask: $0.33
Sum: $0.98

Arbitrage: Buy both → Pay $0.98 → Receive $1.00 at settlement
Profit: $0.02 per dollar risked (2% edge)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    POLYARB DASHBOARD                        │
├─────────────────────────────────────────────────────────────┤
│  📊 Frontend (React/TypeScript) ← API → Backend (Flask)     │
├─────────────────────────────────────────────────────────────┤
│  🔑 WalletManager → API Keys + Private Key Validation       │
│  📊 OrderManager → Real CLOB API Integration                │
│  🛡️  PositionValidator → No Naked Exposure                   │
│  📈 Risk Management → Adaptive Position Sizing              │
│  📝 Comprehensive Logging → Full Execution Tracking         │
├─────────────────────────────────────────────────────────────┤
│  🎯 PRODUCTION READY: Place Real Orders on Polymarket       │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Safety Features |
|-----------|---------|-----------------|
| **OrderManager** | Real order placement & monitoring | Timeout protection, fill validation |
| **PositionValidator** | Prevent naked exposure | Risk assessment, emergency exits |
| **RiskManager** | Adaptive position sizing | Performance-based scaling, stop losses |
| **WalletManager** | Secure credential handling | Demo mode, validation |
| **ExecutionLogger** | Comprehensive tracking | Post-analysis, performance metrics |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** & **Python 3.8+**
- **pnpm** package manager
- **EVM Wallet** (MetaMask, WalletConnect, Coinbase)

### Installation

```bash
# Clone repository
git clone https://github.com/termaulmaul/polyarb-dashboard.git
cd polyarb-dashboard

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend/python
pip install -r requirements.txt
cd ../..
```

### Development Mode (Safe - No Real Trading)

```bash
# Start both frontend and backend (recommended)
./start_full.sh

# Or use pnpm
pnpm run dev:full
```

**URLs:**
- **Dashboard**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Production Mode (⚠️ REAL TRADING)

```bash
# 1. Setup Polymarket credentials
cp .env.example .env
# Edit .env with your credentials:
# POLYMARKET_API_KEY=your_key
# POLYMARKET_API_PASSPHRASE=your_passphrase
# WALLET_PRIVATE_KEY=your_private_key

# 2. Start production engine
./start_full.sh

# 3. Enable bot in dashboard with small position sizes
```

---

## 🛡️ Safety & Risk Management

### Core Safety Principles
- **Never hold naked positions** - Always hedged YES+NO pairs
- **Atomic execution** - Both orders placed simultaneously
- **Timeout protection** - Max 30 seconds exposure per trade
- **Emergency stops** - Daily loss limits, circuit breakers
- **Conservative scaling** - Start small, prove performance first

### Risk Mitigation Features

| Feature | Description | Trigger |
|---------|-------------|---------|
| **Position Validation** | Ensures no directional exposure | Every execution |
| **Partial Fill Handling** | Mitigates one-leg fills | When orders don't fully execute |
| **Emergency Stop Loss** | Stops trading on losses | Daily PnL < -$50 |
| **Adaptive Sizing** | Scales based on success rate | Performance-based |
| **Timeout Protection** | Prevents indefinite exposure | 30-second limit |

### Demo Mode Protection
- **Automatic detection** of missing credentials
- **Mock trading** with realistic simulation
- **Clear warnings** about demo status
- **No real money** risked in demo mode

---

## 📊 Dashboard Features

### Real-Time Arbitrage Detection
- ✅ Live market scanning (100+ markets)
- ✅ Real-time edge calculation
- ✅ Executable opportunity filtering
- ✅ Performance metrics tracking

### Execution Monitoring
- ✅ Live order status updates
- ✅ Fill rate tracking
- ✅ PnL calculation
- ✅ Risk exposure monitoring

### Responsive Design
- 📱 **Mobile**: Card-based layout
- 💻 **Desktop**: Full table view
- 🎯 **Tablet**: Optimized hybrid layout

---

## ⚙️ Configuration

### BotConfig Parameters

```python
@dataclass
class BotConfig:
    # Trading parameters
    enabled: bool = False
    min_edge: float = 0.5  # Minimum 0.5% edge to execute
    max_position_size: float = 100  # Max $ per leg

    # Timing
    execution_timeout: int = 30  # Seconds to wait for fills
    max_one_leg_exposure: int = 10  # Max seconds for unfilled leg
    scan_interval: int = 3000  # Milliseconds between scans

    # Risk management
    initial_position_size: float = 10.0  # Start with $10 per leg
    scaling_factor: float = 1.5  # Scale up by 50% on success
    max_scaling_size: float = 100.0  # Maximum size to scale to
    min_success_rate: float = 0.8  # Need 80% success to scale up
    scaling_window: int = 10  # Evaluate last 10 executions
    emergency_stop_loss: float = -50.0  # Stop if daily loss > $50
```

### Environment Variables

```bash
# Polymarket API Credentials (get from https://polymarket.com/profile/api-keys)
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_PASSPHRASE=your_passphrase_here

# Wallet Private Key (NEVER share this!)
WALLET_PRIVATE_KEY=your_private_key_here
```

---

## 📈 Performance Metrics

### Success Criteria (Per Specification)
- ✅ **Consistent small profits** through high-volume execution
- ✅ **Risk-free positions** when both legs fill
- ✅ **Bounded losses** with controlled exits
- ✅ **Explainable results** via comprehensive logging

### Key Metrics Tracked
- **Fill Rate**: Percentage of successful executions
- **Average Edge**: Mean profit per trade
- **Daily PnL**: Total profit/loss per day
- **Position Size**: Current adaptive sizing
- **Execution Time**: Average time per trade
- **Success Rate**: Rolling success percentage

---

## 🔧 Development & Testing

### Running Tests

```bash
# Backend unit tests
cd backend/python
python -m pytest

# Frontend tests
pnpm test

# Integration tests
pnpm run test:e2e
```

### Demo Mode Testing

```bash
# Run without credentials (safe testing)
./start_full.sh

# Check logs for "DEMO MODE" warnings
# Verify no real orders are placed
# Test all UI features safely
```

### Production Testing

```bash
# Start with minimal position sizes ($1-5)
# Monitor execution logs closely
# Verify position validation works
# Test emergency stop functionality
```

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill all application ports
./kill-ports.sh

# Or manually
lsof -ti:3001,8080,8081 | xargs kill -9
```

#### Demo Mode Not Working
- Check that no `.env` file exists with credentials
- Verify console shows "DEMO MODE" warnings
- Check backend logs for mock execution messages

#### Real Trading Not Working
- Verify `.env` file has correct credentials
- Check Polymarket API key permissions
- Ensure wallet has sufficient POLYGON balance
- Verify network is set to Polygon

#### Low Fill Rates
- Reduce position sizes
- Increase min_edge threshold
- Check market liquidity
- Monitor execution timing

#### Emergency Stops Triggering
- Review recent execution logs
- Check daily PnL calculations
- Verify position sizing logic
- Review risk management parameters

### Logs Location
- **Backend**: Console output when running `./start_full.sh`
- **Frontend**: Browser DevTools Console (F12)
- **API**: http://localhost:3001/api/logs

---

## 📚 Documentation

### Wiki Sections
- [Architecture Overview](wiki/architecture.md)
- [Risk Management](wiki/risk-management.md)
- [API Reference](wiki/api-reference.md)
- [Deployment Guide](wiki/deployment.md)
- [Troubleshooting](wiki/troubleshooting.md)

### Key Files
- `backend/python/order_manager.py` - Core trading engine
- `backend/python/wallet_manager.py` - Wallet security
- `src/components/OpportunitiesTable.tsx` - Main dashboard
- `WALLET_SETUP.md` - Wallet configuration
- `kill-ports.sh` - Port management utility

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Always test in demo mode first
- Add comprehensive logging for new features
- Include risk management for trading logic
- Update documentation for API changes
- Follow existing code style and patterns

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

**This software is for educational and research purposes. Trading cryptocurrencies and derivatives involves substantial risk of loss and is not suitable for every investor. Past performance does not guarantee future results.**

**Always:**
- Test thoroughly in demo mode before live trading
- Start with small position sizes
- Monitor performance closely
- Have emergency stop mechanisms in place
- Never risk more than you can afford to lose

**The authors are not responsible for any financial losses incurred through the use of this software.**

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/termaulmaul/polyarb-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/termaulmaul/polyarb-dashboard/discussions)
- **Documentation**: [Wiki](https://github.com/termaulmaul/polyarb-dashboard/wiki)

---

**Built with ❤️ for the DeFi community**
