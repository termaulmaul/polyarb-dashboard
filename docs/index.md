# PolyArb - Production-Ready Arbitrage Trading System

Welcome to the PolyArb project documentation!

PolyArb is a sophisticated arbitrage trading system designed for Polymarket's binary options market, featuring advanced risk management, real-time monitoring, and production-ready architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Python 3.8+
- pnpm package manager
- Valid Polymarket API credentials

### Installation
```bash
# Clone repository
git clone https://github.com/termaulmaul/polyarb-dashboard.git
cd polyarb-dashboard

# Install dependencies
pnpm install
cd backend/python && pip install -r requirements.txt && cd ../..

# Start development environment
./start_full.sh
```

## 📊 System Overview

PolyArb consists of three main components:

### Frontend Dashboard (React/TypeScript)
- Real-time trading dashboard
- Live arbitrage opportunity display
- Risk management controls
- WebSocket-based live updates

### Backend Engine (Flask/Python)
- Core arbitrage logic
- Order execution and monitoring
- Position validation and safety checks
- API integration with Polymarket

### Risk Management System
- Multi-layer safety mechanisms
- Emergency stop capabilities
- Position size validation
- Loss limit enforcement

## ⚠️ Safety First

**IMPORTANT**: PolyArb includes multiple safety layers:
- Demo mode for safe testing
- Position size limits
- Emergency stop mechanisms
- Hedged position enforcement
- Real-time risk monitoring

## 📚 Documentation

### Getting Started
- [Architecture Overview](architecture.md) - System design and components
- [Risk Management](risk-management.md) - Safety and risk controls
- [API Reference](api-reference.md) - Complete API documentation

### Deployment & Operations
- [Deployment Guide](deployment.md) - Production deployment instructions
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [Configuration](configuration.md) - Configuration options and setup
- [Monitoring](monitoring.md) - Monitoring and alerting systems

### Development
- [Contributing](contributing.md) - How to contribute to the project
- [Testing](testing.md) - Testing strategies and procedures
- [Security](security.md) - Security best practices

## 🔗 Quick Links

- [GitHub Repository](https://github.com/termaulmaul/polyarb-dashboard)
- [Main README](../README.md)
- [Live Demo](http://localhost:8080) (when running locally)

## 📈 Project Status

- **Version**: 1.0.0 (Production Ready)
- **Status**: ⚡ Active Development
- **License**: MIT
- **Last Updated**: January 2026

## 🛡️ Risk Warning

**Trading cryptocurrencies and derivatives involves substantial risk of loss and is not suitable for every investor.** The use of this software does not guarantee profits and may result in the loss of all invested capital. Always test thoroughly in demo mode before using real funds.

---

*This documentation is maintained via GitHub Wiki. For the latest updates, visit the [GitHub repository](https://github.com/termaulmaul/polyarb-dashboard).*