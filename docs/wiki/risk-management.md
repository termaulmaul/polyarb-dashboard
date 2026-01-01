# Risk Management System

## Overview

PolyArb implements a comprehensive, multi-layered risk management system designed to protect capital while maximizing arbitrage opportunities. The system follows the principle of "defensive trading" - prioritizing capital preservation over aggressive profit-seeking.

## Core Risk Principles

### 1. Never Hold Naked Positions
**Critical Rule**: The system never intentionally holds directional exposure to YES or NO tokens.

**Implementation**:
- All trades must result in hedged positions (YES + NO pairs)
- Pre-execution validation ensures both legs are placed
- Post-execution verification confirms hedged state
- Emergency protocols for handling partial fills

### 2. Atomic Execution
**Critical Rule**: Both arbitrage legs must execute simultaneously or not at all.

**Implementation**:
- Simultaneous order placement for YES and NO tokens
- Transaction batching to ensure atomicity
- Rollback mechanisms for failed executions
- Timeout protection against indefinite exposure

### 3. Bounded Losses
**Critical Rule**: All potential losses must be bounded and explainable.

**Implementation**:
- Maximum position sizes with hard limits
- Controlled exit strategies for partial fills
- Daily loss limits with automatic shutdown
- Transparent fee and slippage calculations

## Risk Management Components

### 1. PositionValidator

#### Purpose
Validates that all positions are properly hedged and contain no directional exposure.

#### Key Functions

**validateArbitragePosition(market_id, yes_order, no_order)**
- Ensures both orders exist for the same market
- Verifies both orders are filled (perfect hedge)
- Detects partial fills and flags as dangerous
- Records position state for monitoring

**validateExitPosition(market_id, exit_order)**
- Allows exits only for naked positions
- Prevents accidental reduction of hedged positions
- Validates exit execution and position cleanup

**getNakedPositions()**
- Returns all positions with directional exposure
- Used for emergency monitoring and alerts

#### Safety Triggers
- **Critical Alert**: Any naked position detected
- **Emergency Action**: Automatic position closure for naked exposure
- **System Halt**: Trading disabled if naked positions persist

### 2. RiskManager (Adaptive Sizing)

#### Purpose
Dynamically adjusts position sizes based on empirical performance data.

#### Scaling Algorithm

```python
def get_adaptive_position_size():
    # Emergency stop loss
    if daily_pnl <= EMERGENCY_STOP_LOSS:
        return 0  # Halt trading

    # Build performance history
    if len(execution_history) < SCALING_WINDOW:
        return INITIAL_POSITION_SIZE

    # Calculate success rate
    successful_trades = sum(1 for exec in recent_executions
                           if exec['status'] == 'BOTH_FILLED')
    success_rate = successful_trades / len(recent_executions)

    # Scale based on performance
    if success_rate >= MIN_SUCCESS_RATE:
        # Scale up for good performance
        new_size = min(current_size * SCALING_FACTOR, MAX_SCALING_SIZE)
    else:
        # Scale down for poor performance
        new_size = max(current_size / SCALING_FACTOR, INITIAL_POSITION_SIZE)

    return new_size
```

#### Scaling Parameters
- **Initial Size**: $10 per leg (conservative starting point)
- **Scaling Factor**: 1.5x (50% increase on success)
- **Max Size**: $100 per leg (hard upper limit)
- **Success Threshold**: 80% fill rate required for scaling
- **Evaluation Window**: Last 10 executions analyzed

### 3. Emergency Controls

#### Daily Loss Limits
```python
EMERGENCY_STOP_LOSS = -50.0  # Dollars

if risk_state['daily_pnl'] <= EMERGENCY_STOP_LOSS:
    logger.critical(f"🚨 EMERGENCY STOP: Daily loss ${risk_state['daily_pnl']:.2f}")
    risk_state['trading_enabled'] = False
    # Halt all trading activity
```

#### Circuit Breakers
- **Execution Failures**: Stop after 5 consecutive failures
- **API Errors**: Pause trading on connectivity issues
- **Position Errors**: Emergency close all positions on validation failures
- **Market Volatility**: Reduce position sizes during high volatility

### 4. Partial Fill Mitigation

#### One-Leg Fill Scenarios

**Scenario**: YES order fills, NO order doesn't

**Mitigation Strategy**:
1. **Immediate Retry**: Attempt NO order at current ask price
2. **Edge Validation**: Only retry if arbitrage edge still exists
3. **Timeout Protection**: Max 10 seconds for retry attempt
4. **Controlled Exit**: If retry fails, sell YES at best bid
5. **Loss Calculation**: `(YES_buy_price - YES_sell_price) * position_size`

**Code Example**:
```python
def handle_yes_only_fill(execution):
    # Try to fill NO order
    current_no_ask = get_current_ask_price(execution.no_order.token_id)

    if current_no_ask + execution.yes_order.price < 1.0:
        # Edge still exists, retry NO order
        retry_order_id = place_order(execution.no_order.token_id, BUY,
                                   execution.no_order.size, current_no_ask)
        # Monitor for 10 seconds...
        if order_fills(retry_order_id):
            return 0.0, "Both legs filled after retry"
        else:
            cancel_order(retry_order_id)

    # Exit YES position
    exit_price = get_best_bid_price(execution.yes_order.token_id)
    loss = (execution.yes_order.price - exit_price) * execution.yes_order.size
    return -loss, f"Controlled exit with loss: ${loss:.4f}"
```

## Risk Metrics Monitoring

### Real-Time Metrics

| Metric | Purpose | Alert Threshold |
|--------|---------|-----------------|
| **Daily PnL** | Overall performance tracking | < -$50 triggers stop |
| **Success Rate** | Execution reliability | < 80% reduces sizing |
| **Fill Rate** | Order execution success | < 90% investigated |
| **Average Edge** | Profitability per trade | < 0.5% reviewed |
| **Execution Time** | Performance monitoring | > 30s flagged |

### Position Exposure Tracking

```python
class PositionTracker:
    def __init__(self):
        self.positions = {}  # market_id -> position_data
        self.exposure_limits = {
            'max_single_market': 1000,  # $1000 max per market
            'max_total_exposure': 5000,  # $5000 total exposure
            'max_hedge_imbalance': 0.1   # 10% max imbalance
        }

    def validate_exposure(self, market_id, position_size):
        # Check single market limit
        market_exposure = sum(pos['size'] for pos in self.positions.values()
                             if pos['market_id'] == market_id)
        if market_exposure + position_size > self.exposure_limits['max_single_market']:
            return False, "Single market exposure limit exceeded"

        # Check total exposure limit
        total_exposure = sum(pos['size'] for pos in self.positions.values())
        if total_exposure + position_size > self.exposure_limits['max_total_exposure']:
            return False, "Total exposure limit exceeded"

        return True, "Exposure within limits"
```

## Error Handling & Recovery

### Execution Errors

| Error Type | Handling Strategy | Recovery Action |
|------------|-------------------|-----------------|
| **Network Timeout** | Retry with backoff | Continue after delay |
| **API Rate Limit** | Exponential backoff | Pause and resume |
| **Insufficient Balance** | Immediate stop | Alert and manual intervention |
| **Order Rejection** | Parameter validation | Adjust order parameters |
| **Partial Fill** | Risk mitigation | Controlled position exit |

### System Failures

**Database Connection Loss**:
- Continue operation with in-memory state
- Retry connection in background
- Alert when reconnection successful

**API Key Issues**:
- Fallback to demo mode
- Alert for credential refresh
- Graceful degradation

**Market Data Disruption**:
- Use cached data for critical decisions
- Reduce position sizes during uncertainty
- Alert for manual oversight

## Testing & Validation

### Risk Scenario Testing

```python
def test_risk_scenarios():
    # Test partial fill mitigation
    test_partial_fill_recovery()

    # Test emergency stop conditions
    test_emergency_stop_loss()

    # Test position validation
    test_naked_position_detection()

    # Test adaptive sizing
    test_position_scaling_algorithm()

    # Test exposure limits
    test_exposure_limit_enforcement()
```

### Demo Mode Validation

- **Zero Financial Risk**: All tests run without real money
- **Realistic Simulation**: Mock orders with realistic success/failure rates
- **Full Logic Testing**: All risk management code executes normally
- **Performance Validation**: Timing and scaling algorithms tested

## Configuration Parameters

### Risk Configuration

```python
@dataclass
class RiskConfig:
    # Position limits
    max_single_market_exposure: float = 1000.0
    max_total_exposure: float = 5000.0
    max_hedge_imbalance: float = 0.1

    # Emergency controls
    emergency_stop_loss: float = -50.0
    max_consecutive_failures: int = 5
    circuit_breaker_timeout: int = 300  # 5 minutes

    # Recovery settings
    retry_attempts: int = 3
    retry_backoff_seconds: int = 5
    recovery_timeout_minutes: int = 30
```

## Audit & Compliance

### Execution Logging

Every arbitrage execution logs:
- **Timestamp**: Precise execution timing
- **Market ID**: Contract identification
- **Order Details**: YES/NO prices, sizes, IDs
- **Execution Result**: Fill status, PnL, timing
- **Risk Metrics**: Exposure levels, position validation
- **Error Context**: Any failures or mitigation actions

### Performance Analytics

Daily reports include:
- **Profit/Loss Breakdown**: By market, strategy, time
- **Risk Metrics**: Max drawdown, Sharpe ratio, win rate
- **Execution Quality**: Fill rates, slippage, timing
- **System Health**: Error rates, recovery events

### Regulatory Compliance

- **Transparent Operations**: All actions logged and auditable
- **Risk Controls**: Multiple independent safety layers
- **Emergency Protocols**: Clear escalation procedures
- **Capital Protection**: Conservative position sizing

This comprehensive risk management system ensures that PolyArb operates with the highest standards of safety while maximizing arbitrage opportunities through disciplined, systematic trading.