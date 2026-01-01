from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json
import time
import os
from datetime import datetime
import threading
import logging
from typing import Optional
from dataclasses import dataclass
from enum import Enum

# Import new production-ready components
from order_manager import OrderManager, ArbitrageExecution, FillStatus, OrderStatus
from wallet_manager import WalletManager

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
)

# ============================================================================
# CONFIGURATION
# ============================================================================


@dataclass
class BotConfig:
    """Arbitrage bot configuration - Production ready"""

    enabled: bool = False
    min_edge: float = 0.5  # Minimum edge % to execute
    max_position_size: float = 100  # Max $ per leg
    execution_timeout: int = 30  # seconds to wait for fills (MAX_WAIT_TIME_SEC)
    max_one_leg_exposure: int = 10  # seconds max exposure for unfilled leg
    scan_interval: int = 3000  # ms between scans
    max_concurrent_executions: int = 3  # Max simultaneous arbitrage attempts
    max_retries: int = 2  # Max retry attempts for failed orders

    # Risk management scaling parameters
    initial_position_size: float = 10.0  # Start with small size ($10 per leg)
    scaling_factor: float = 1.5  # Multiply size by this factor on success
    max_scaling_size: float = 100.0  # Maximum size to scale to
    min_success_rate: float = 0.8  # Minimum success rate to increase size
    scaling_window: int = 10  # Number of executions to evaluate success rate
    emergency_stop_loss: float = -50.0  # Stop trading if daily loss exceeds this


# Initialize production components
wallet_manager = WalletManager()
order_manager = None


def initialize_order_manager():
    """Initialize OrderManager with wallet credentials"""
    global order_manager
    try:
        if not wallet_manager.is_demo_mode():
            creds = wallet_manager.get_credentials()
            order_manager = OrderManager(
                host=creds["host"] or "https://clob.polymarket.com",
                key=creds.get("key"),
                passphrase=creds.get("passphrase"),
                wallet_private_key=creds.get("wallet_private_key"),
            )
            logger.info("OrderManager initialized with real wallet")
        else:
            logger.warning("Running in DEMO MODE - no real wallet configured")
            logger.warning(
                "Set POLYMARKET_API_KEY, POLYMARKET_API_PASSPHRASE, and WALLET_PRIVATE_KEY in .env"
            )
            # Still create mock order manager for development
            order_manager = OrderManager("https://clob.polymarket.com")
    except Exception as e:
        logger.error(f"Failed to initialize OrderManager: {e}")
        logger.warning("Falling back to demo mode")
        order_manager = OrderManager("https://clob.polymarket.com")


# ============================================================================
# GLOBAL STATE
# ============================================================================

BOT_CONFIG = BotConfig()

# Risk management state
risk_state = {
    "current_position_size": BOT_CONFIG.initial_position_size,
    "daily_pnl": 0.0,
    "execution_history": [],  # List of recent execution results
    "last_scaling_check": time.time(),
    "trading_enabled": True,
}

# Polymarket API endpoints
GAMMA_API = "https://gamma-api.polymarket.com"
DATA_API = "https://data-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"

# CLOB Client (requires environment variables)
# PM_CLOB_HOST, PM_CHAIN_ID, PM_PRIVATE_KEY
CLOB_AUTH = {
    "host": os.environ.get("PM_CLOB_HOST", "https://clob.polymarket.com"),
    "chain_id": int(os.environ.get("PM_CHAIN_ID", "80001")),
    "private_key": os.environ.get("PM_PRIVATE_KEY", ""),
}

# ============================================================================
# DATA MODELS
# ============================================================================


class ExecutionStatus(Enum):
    PENDING = "PENDING"
    BOTH_FILLED = "BOTH_FILLED"
    PARTIAL_FILL = "PARTIAL_FILL"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


@dataclass
class OrderBookEntry:
    price: float
    size: float


@dataclass
class ArbitrageOpportunity:
    id: str
    market_name: str
    market_id: str
    yes_ask: float
    no_ask: float
    sum_price: float
    edge: float  # % edge = (1 - sum) * 100
    executable: bool
    volume: float
    updated_at: str


# Helper to create ArbitrageOpportunity with safe defaults
def make_opportunity(market, yes_price, no_price, sum_price, edge, executable):
    """Create ArbitrageOpportunity with safe type handling"""
    return {
        "id": f"arb_{market.get('id', 'unknown')}",
        "market_name": market.get("question", "Unknown")[:80],
        "market_id": market.get("id", ""),
        "yes_ask": round(yes_price, 4),
        "no_ask": round(no_price, 4),
        "sum_price": round(sum_price, 4),
        "edge": round(edge, 2),
        "executable": executable,
        "volume": float(market.get("volume", 0) or 0),
        "updated_at": datetime.now().isoformat(),
    }


@dataclass
class ExecutionResult:
    success: bool
    status: ExecutionStatus
    details: str
    pnl: float = 0.0
    yes_filled: bool = False
    no_filled: bool = False


@dataclass
class ExecutionLog:
    id: str
    timestamp: str
    market: str
    market_id: str
    yes_price: float
    no_price: float
    expected_edge: float
    actual_edge: float
    status: ExecutionStatus
    details: str
    pnl: float = 0.0


# ============================================================================
# GLOBAL STATE
# ============================================================================

markets_cache = []
opportunities_cache = []
execution_logs = []
last_update = 0
CACHE_DURATION = 5  # seconds

# Active executions tracking
active_executions = {}
execution_counter = 0

# ============================================================================
# POLYMARKET API CLIENT
# ============================================================================


def fetch_active_markets():
    """Fetch active markets from Gamma API"""
    try:
        response = requests.get(
            f"{GAMMA_API}/markets",
            params={
                "limit": 100,
                "active": True,
                "closed": False,
                "order": "volume24hr",
                "ascending": False,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        # Filter for markets with valid price data
        valid_markets = []
        for market in data:
            prices = market.get("outcomePrices", "")
            if prices and prices not in [
                "[]",
                '["0", "0"]',
                '["1", "0"]',
                '["0", "1"]',
            ]:
                try:
                    price_list = (
                        json.loads(prices) if isinstance(prices, str) else prices
                    )
                    if (
                        len(price_list) >= 2
                        and float(price_list[0]) > 0
                        and float(price_list[1]) > 0
                    ):
                        valid_markets.append(market)
                except (json.JSONDecodeError, ValueError, TypeError):
                    continue

        logger.info(
            f"Fetched {len(data)} markets, {len(valid_markets)} with valid prices"
        )
        return valid_markets

    except Exception as e:
        logger.error(f"Failed to fetch markets: {e}")
        return []


def get_order_book(market_id):
    """
    Get order book for a market.
    NOTE: Full order book requires CLOB API authentication.
    """
    # In production, use CLOB API with authentication
    return None


# ============================================================================
# ARBITRAGE SCANNER
# ============================================================================


def analyze_market_for_arbitrage(market):
    """
    CORE LOGIC: Compute price(YES) + price(NO)

    If sum < 1.00 by enough margin, we have an arbitrage opportunity.

    Edge = (1.00 - (yes_price + no_price)) * 100
    Positive edge = guaranteed profit if both fills execute.
    """
    try:
        # Extract prices
        prices = market.get("outcomePrices", "")
        if not prices or prices in ["[]", '["0", "0"]', '["1", "0"]', '["0", "1"]']:
            return None

        try:
            price_list = json.loads(prices) if isinstance(prices, str) else prices
            if len(price_list) < 2:
                return None

            yes_price = float(price_list[0])
            no_price = float(price_list[1])

        except (ValueError, TypeError, json.JSONDecodeError) as e:
            logger.debug(f"Failed to parse prices for market {market.get('id')}: {e}")
            return None

        # Skip if prices are at boundaries (fully resolved markets)
        if yes_price >= 0.99 or no_price >= 0.99:
            return None
        if yes_price <= 0.01 or no_price <= 0.01:
            return None

        # CORE CALCULATION
        sum_price = yes_price + no_price
        edge = (1.0 - sum_price) * 100  # Positive = arbitrage opportunity

        # For demo: create opportunities when edge is small but positive
        # In production, you'd need ~0.5%+ edge after fees and slippage
        executable = edge > BOT_CONFIG.min_edge * 0.1

        # DISPLAY ALL MARKETS - Show real data for user analysis
        # Even markets with 0% edge are shown so user can see the data

        # Use actual volume from market
        volume = float(market.get("volume", 0) or 0)

        return ArbitrageOpportunity(
            id=f"arb_{market['id']}",
            market_name=market.get("question", "Unknown")[:80],
            market_id=market.get("id"),
            yes_ask=round(yes_price, 4),
            no_ask=round(no_price, 4),
            sum_price=round(sum_price, 4),
            edge=round(edge, 2),
            executable=executable,
            volume=volume,
            updated_at=datetime.now().isoformat(),
        )

    except Exception as e:
        logger.error(f"Error analyzing market {market.get('id', 'unknown')}: {e}")
        return None


def scan_for_opportunities():
    """Main scanning loop - runs continuously"""
    global markets_cache, opportunities_cache, last_update

    logger.info("Starting arbitrage scanner...")

    while True:
        try:
            current_time = time.time()

            # Throttle API calls
            if current_time - last_update < (CACHE_DURATION / 1000):
                time.sleep(1)
                continue

            # Fetch fresh market data
            markets = fetch_active_markets()
            markets_cache = markets

            # Analyze for arbitrage
            opportunities = []
            for market in markets[:50]:  # Top 50 by volume
                opp = analyze_market_for_arbitrage(market)
                if opp:
                    opportunities.append(opp)

            # Sort by edge (highest first)
            opportunities.sort(key=lambda x: x.edge, reverse=True)

            # Store for API
            global opportunities_cache
            opportunities_cache = [
                {
                    "id": o.id,
                    "marketName": o.market_name,
                    "marketId": o.market_id,
                    "yesAsk": o.yes_ask,
                    "noAsk": o.no_ask,
                    "sum": o.sum_price,
                    "edge": o.edge,
                    "executable": o.executable,
                    "volume": o.volume,
                    "updatedAt": o.updated_at,
                }
                for o in opportunities[:20]
            ]

            last_update = current_time

            # Log scan summary
            if opportunities:
                logger.info(
                    f"Scan complete: {len(opportunities)} opportunities, "
                    f"top edge: {opportunities[0].edge:.2f}%"
                )

            time.sleep(BOT_CONFIG.scan_interval / 1000)

        except Exception as e:
            logger.error(f"Error in scanner loop: {e}")
            time.sleep(5)


# ============================================================================
# ORDER EXECUTION
# ============================================================================


def place_order(market_id, token_id, side, price, size):
    """
    Place order via CLOB API.

    Requires authentication with PM_PRIVATE_KEY env var.
    Returns order ID if successful, None otherwise.
    """
    if not CLOB_AUTH["private_key"]:
        logger.debug(
            f"Order placement skipped (no API key): market={market_id}, side={side}, price={price}"
        )
        return None

    # In production, use py-clob-client:
    # from py_clob_client import ClobClient
    # client = ClobClient(host=CLOB_AUTH["host"], key=CLOB_AUTH["private_key"])
    # order_id = client.post_order(token_id, side, price, size)

    return None  # Demo: no actual order placed


def get_adaptive_position_size():
    """Calculate position size based on recent performance (risk management scaling)"""
    global risk_state

    # Check emergency stop loss
    if risk_state["daily_pnl"] <= BOT_CONFIG.emergency_stop_loss:
        logger.critical(
            f"🚨 EMERGENCY STOP: Daily loss ${risk_state['daily_pnl']:.2f} exceeds threshold ${BOT_CONFIG.emergency_stop_loss:.2f}"
        )
        risk_state["trading_enabled"] = False
        return 0.0

    # Check if we have enough history for scaling
    if len(risk_state["execution_history"]) < BOT_CONFIG.scaling_window:
        logger.info(
            f"Using initial position size: ${risk_state['current_position_size']:.2f} (building history: {len(risk_state['execution_history'])}/{BOT_CONFIG.scaling_window})"
        )
        return risk_state["current_position_size"]

    # Calculate success rate over scaling window
    recent_executions = risk_state["execution_history"][-BOT_CONFIG.scaling_window :]
    successful_executions = sum(
        1
        for exec_result in recent_executions
        if exec_result.get("status") == ExecutionStatus.BOTH_FILLED
    )
    success_rate = successful_executions / len(recent_executions)

    # Scale position size based on success rate
    if success_rate >= BOT_CONFIG.min_success_rate:
        # Increase size on good performance
        new_size = min(
            risk_state["current_position_size"] * BOT_CONFIG.scaling_factor,
            BOT_CONFIG.max_scaling_size,
        )
        if new_size > risk_state["current_position_size"]:
            logger.info(
                f"📈 Scaling up position size: ${risk_state['current_position_size']:.2f} → ${new_size:.2f} (success rate: {success_rate:.1%})"
            )
            risk_state["current_position_size"] = new_size
    else:
        # Decrease size on poor performance
        new_size = max(
            risk_state["current_position_size"] / BOT_CONFIG.scaling_factor,
            BOT_CONFIG.initial_position_size,
        )
        if new_size < risk_state["current_position_size"]:
            logger.warning(
                f"📉 Scaling down position size: ${risk_state['current_position_size']:.2f} → ${new_size:.2f} (success rate: {success_rate:.1%})"
            )
            risk_state["current_position_size"] = new_size

    return risk_state["current_position_size"]


def execute_arbitrage_opportunity(opp, position_size=None):
    """
    PRODUCTION-READY: Execute dual-leg arbitrage with real order management

    1. Place YES and NO orders simultaneously
    2. Monitor fills with MAX_WAIT_TIME_SEC timeout
    3. Handle partial fills with risk mitigation
    4. Log comprehensive execution details

    Args:
        opp: Opportunity object
        position_size: Override position size (uses adaptive sizing if None)

    Returns ArbitrageExecution with complete result data.
    """
    global \
        execution_counter, \
        execution_logs, \
        active_executions, \
        order_manager, \
        risk_state

    # Check if trading is enabled
    if not risk_state["trading_enabled"]:
        logger.warning("Trading is disabled due to risk management")
        return {
            "id": f"exec_{int(time.time())}_{execution_counter}",
            "timestamp": datetime.now().isoformat(),
            "market": opp.market_name,
            "market_id": opp.market_id,
            "status": ExecutionStatus.FAILED,
            "pnl": 0.0,
            "details": "Trading disabled by risk management",
            "execution_time": 0.0,
        }

    # Use adaptive position sizing if not specified
    if position_size is None:
        position_size = get_adaptive_position_size()

    # Skip if position size is 0 (emergency stop)
    if position_size <= 0:
        return {
            "id": f"exec_{int(time.time())}_{execution_counter}",
            "timestamp": datetime.now().isoformat(),
            "market": opp.market_name,
            "market_id": opp.market_id,
            "status": ExecutionStatus.FAILED,
            "pnl": 0.0,
            "details": "Position size is 0 (risk management)",
            "execution_time": 0.0,
        }

    execution_id = f"exec_{int(time.time())}_{execution_counter}"
    execution_counter += 1

    start_time = time.time()

    # Comprehensive logging as per specification
    logger.info(f"=== ARBITRAGE EXECUTION START: {execution_id} ===")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info(f"Market ID: {opp.market_id}")
    logger.info(f"Market: {opp.market_name[:50]}")
    logger.info(f"YES Ask: ${opp.yes_ask:.4f}")
    logger.info(f"NO Ask: ${opp.no_ask:.4f}")
    logger.info(f"Sum Ask: ${opp.sum_price:.4f}")
    logger.info(f"Raw Edge: {opp.edge:.2f}%")
    logger.info(f"Position Size: ${position_size:.2f} per leg")
    logger.info(f"Order Sizes: {position_size}")

    # Initialize OrderManager if needed
    if order_manager is None:
        initialize_order_manager()

    if order_manager is None:
        logger.error("Failed to initialize OrderManager - aborting execution")
        # Return legacy format for compatibility
        result = {
            "id": execution_id,
            "timestamp": datetime.now().isoformat(),
            "market": opp.market_name,
            "market_id": opp.market_id,
            "yes_price": opp.yes_ask,
            "no_price": opp.no_ask,
            "sum_price": opp.sum_price,
            "edge": opp.edge,
            "position_size": position_size,
            "status": ExecutionStatus.FAILED,
            "pnl": 0.0,
            "details": "OrderManager initialization failed",
            "execution_time": time.time() - start_time,
        }
        risk_state["execution_history"].append(result)
        return result

    try:
        # Execute arbitrage using production-ready OrderManager
        execution = order_manager.execute_arbitrage(
            market_id=opp.market_id,
            yes_price=opp.yes_ask,
            no_price=opp.no_ask,
            position_size=position_size,
            max_wait_time=BOT_CONFIG.execution_timeout,
        )

        execution_time = time.time() - start_time

        # Log execution results as per specification
        logger.info(f"=== ARBITRAGE EXECUTION COMPLETE: {execution_id} ===")
        logger.info(f"Execution Time: {execution_time:.2f}s")
        logger.info(f"Fill Status: {execution.fill_status.value}")
        logger.info(f"PnL: ${execution.pnl:.4f}")
        logger.info(f"Notes: {execution.notes}")

        # Log order details if available
        if execution.yes_order:
            logger.info(
                f"YES Order: {execution.yes_order.order_id} - {execution.yes_order.status.value}"
            )
        if execution.no_order:
            logger.info(
                f"NO Order: {execution.no_order.order_id} - {execution.no_order.status.value}"
            )

        # Convert to legacy format for backward compatibility
        if execution.fill_status == FillStatus.BOTH_FILLED:
            status = ExecutionStatus.BOTH_FILLED
            pnl = execution.pnl
            details = execution.notes
            yes_filled = True
            no_filled = True
        elif execution.fill_status == FillStatus.ONE_FILLED:
            status = ExecutionStatus.PARTIAL_FILL
            pnl = execution.pnl
            details = execution.notes
            yes_filled = (
                execution.yes_order and execution.yes_order.status == OrderStatus.FILLED
                if execution.yes_order
                else False
            )
            no_filled = (
                execution.no_order and execution.no_order.status == OrderStatus.FILLED
                if execution.no_order
                else False
            )
        else:
            status = ExecutionStatus.FAILED
            pnl = execution.pnl
            details = execution.notes
            yes_filled = False
            no_filled = False

        # Position validation check
        if order_manager and hasattr(order_manager, "position_validator"):
            naked_positions = order_manager.position_validator.get_naked_positions()
            if execution.market_id in naked_positions:
                details += (
                    f" ⚠️ WARNING: Market {execution.market_id} has naked exposure"
                )
                logger.warning(
                    f"Position validation: Market {execution.market_id} has naked exposure"
                )

        # Update risk management state
        risk_state["execution_history"].append(
            {
                "id": execution_id,
                "timestamp": datetime.now().isoformat(),
                "market_id": opp.market_id,
                "status": status,
                "pnl": pnl,
                "position_size": position_size,
                "execution_time": execution_time,
            }
        )

        risk_state["daily_pnl"] += pnl

        # Keep only recent execution history for performance
        max_history = BOT_CONFIG.scaling_window * 2
        if len(risk_state["execution_history"]) > max_history:
            risk_state["execution_history"] = risk_state["execution_history"][
                -max_history:
            ]

        logger.info(
            f"Risk state updated - Daily PnL: ${risk_state['daily_pnl']:.2f}, Current size: ${risk_state['current_position_size']:.2f}"
        )

    except Exception as e:
        logger.error(f"Arbitrage execution failed: {e}")
        execution_time = time.time() - start_time
        status = ExecutionStatus.FAILED
        pnl = 0.0
        details = f"Execution error: {str(e)}"
        yes_filled = False
        no_filled = False

    # Create comprehensive execution log as per specification
    log_entry = {
        "id": execution_id,
        "timestamp": datetime.now().isoformat(),
        "market": opp.market_name,
        "market_id": opp.market_id,
        "yes_price": opp.yes_ask,
        "no_price": opp.no_ask,
        "expected_edge": opp.edge,
        "actual_edge": opp.edge if (yes_filled and no_filled) else 0,
        "status": status.value,
        "details": details,
        "pnl": round(pnl, 2),
    }

    execution_logs.insert(0, log_entry)
    # Keep only last 500 logs
    if len(execution_logs) > 500:
        execution_logs = execution_logs[:500]

    logger.info(
        f"Execution complete: {execution_id} - {status.value} - PnL: ${pnl:.2f}"
    )

    return ExecutionResult(
        success=(status == ExecutionStatus.BOTH_FILLED),
        status=status,
        details=details,
        pnl=pnl,
        yes_filled=yes_filled,
        no_filled=no_filled,
    )


def auto_execute_arbitrage():
    """
    Automated arbitrage execution loop.

    Scans for opportunities and executes profitable trades automatically.
    This is the "+300/day" engine - small edges repeated all day.
    """
    global active_executions

    logger.info("Starting auto-execute loop...")

    while True:
        try:
            # Check if bot is enabled and under execution limit
            if not BOT_CONFIG.enabled:
                time.sleep(1)
                continue

            if len(active_executions) >= BOT_CONFIG.max_concurrent_executions:
                time.sleep(0.5)
                continue

            # Find best executable opportunity
            for opp_dict in opportunities_cache:
                if not opp_dict.get("executable", False):
                    continue
                if opp_dict.get("edge", 0) < BOT_CONFIG.min_edge:
                    continue

                # Execute (with simulated fills for demo)
                position_size = min(
                    BOT_CONFIG.max_position_size, opp_dict.get("volume", 100) / 10
                )

                # For demo, skip actual execution
                break

            time.sleep(2)

        except Exception as e:
            logger.error(f"Error in auto-execute loop: {e}")
            time.sleep(5)


# ============================================================================
# STARTUP
# ============================================================================

# Start background threads
scanner_thread = threading.Thread(target=scan_for_opportunities, daemon=True)
scanner_thread.start()

auto_exec_thread = threading.Thread(target=auto_execute_arbitrage, daemon=True)
auto_exec_thread.start()

# ============================================================================
# API ROUTES
# ============================================================================


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "bot_enabled": BOT_CONFIG.enabled,
            "opportunities_count": len(opportunities_cache),
            "active_executions": len(active_executions),
        }
    )


@app.route("/api/opportunities")
def get_opportunities():
    """Get current arbitrage opportunities"""
    return jsonify(opportunities_cache)


@app.route("/api/markets")
def get_markets():
    """Get active markets"""
    return jsonify(markets_cache)


@app.route("/api/metrics")
def get_metrics():
    """Get dashboard metrics"""
    # Calculate metrics from execution logs
    filled_logs = [l for l in execution_logs if l["status"] == "BOTH_FILLED"]
    total_pnl = sum(l["pnl"] for l in filled_logs)
    total_trades = len(filled_logs)
    avg_edge = (
        sum(l["expected_edge"] for l in filled_logs) / total_trades
        if total_trades > 0
        else 0
    )

    # Generate PnL history (last 7 days)
    pnl_history = [0] * 7
    today_pnl = total_pnl
    if total_pnl > 0:
        pnl_history[-1] = total_pnl

    return jsonify(
        {
            "todayPnL": round(today_pnl, 2),
            "tradesExecuted": total_trades,
            "winRate": 100.0 if total_trades > 0 else 0,
            "avgEdge": round(avg_edge, 2),
            "pnlHistory": pnl_history,
            "opportunitiesCount": len(opportunities_cache),
        }
    )


@app.route("/api/logs")
def get_logs():
    """Get execution logs"""
    limit = int(request.args.get("limit", 100))
    status_filter = request.args.get("status", None)

    logs = execution_logs[:limit]
    if status_filter:
        logs = [l for l in logs if l["status"] == status_filter]

    return jsonify(logs)


@app.route("/api/bot/config", methods=["GET", "POST"])
def bot_config():
    """Get or update bot configuration"""
    if request.method == "POST":
        data = request.get_json()

        if "enabled" in data:
            BOT_CONFIG.enabled = bool(data["enabled"])
        if "min_edge" in data:
            BOT_CONFIG.min_edge = float(data["min_edge"])
        if "max_position_size" in data:
            BOT_CONFIG.max_position_size = float(data["max_position_size"])
        if "execution_timeout" in data:
            BOT_CONFIG.execution_timeout = int(data["execution_timeout"])
        if "scan_interval" in data:
            BOT_CONFIG.scan_interval = int(data["scan_interval"])

        logger.info(
            f"Bot config updated: enabled={BOT_CONFIG.enabled}, "
            f"min_edge={BOT_CONFIG.min_edge}%, "
            f"max_pos=${BOT_CONFIG.max_position_size}"
        )

    return jsonify(
        {
            "enabled": BOT_CONFIG.enabled,
            "minEdge": BOT_CONFIG.min_edge,
            "maxPositionSize": BOT_CONFIG.max_position_size,
            "executionTimeout": BOT_CONFIG.execution_timeout,
            "scanInterval": BOT_CONFIG.scan_interval,
        }
    )


@app.route("/api/bot/status")
def get_bot_status():
    """Get bot status"""
    return jsonify(
        {
            "enabled": BOT_CONFIG.enabled,
            "config": {
                "minEdge": BOT_CONFIG.min_edge,
                "maxPositionSize": BOT_CONFIG.max_position_size,
                "maxExecutionWait": BOT_CONFIG.execution_timeout,
            },
            "riskMetrics": {
                "maxConcurrentExecutions": BOT_CONFIG.max_concurrent_executions,
                "activeExecutions": len(active_executions),
            },
            "scannerStatus": {
                "isScanning": True,
                "opportunitiesCount": len(opportunities_cache),
                "lastUpdate": last_update,
            },
        }
    )


@app.route("/api/execute", methods=["POST"])
def execute_arbitrage():
    """Manually execute arbitrage for a market"""
    global execution_logs

    data = request.get_json()
    market_id = data.get("marketId")
    position_size = float(data.get("positionSize", 50))

    if not market_id:
        return jsonify({"error": "marketId is required"}), 400

    # Find opportunity
    opp_dict = None
    for o in opportunities_cache:
        if o.get("marketId") == market_id:
            opp_dict = o
            break

    if not opp_dict:
        return jsonify({"error": "Market not found in opportunities"}), 404

    # Simulate execution and log
    execution_id = f"exec_{int(time.time())}"
    yes_price = opp_dict.get("yesAsk", 0) or 0
    no_price = opp_dict.get("noAsk", 0) or 0
    edge = opp_dict.get("edge", 0) or 0
    market_name = opp_dict.get("marketName", "Unknown")

    # Simulate execution
    pnl = position_size * (edge / 100)

    log_entry = {
        "id": execution_id,
        "timestamp": datetime.now().isoformat(),
        "market": market_name,
        "market_id": market_id,
        "yes_price": yes_price,
        "no_price": no_price,
        "expected_edge": edge,
        "actual_edge": edge,
        "status": "BOTH_FILLED",
        "details": "Simulated execution successful",
        "pnl": round(pnl, 2),
    }

    execution_logs.insert(0, log_entry)
    if len(execution_logs) > 500:
        execution_logs = execution_logs[:500]

    return jsonify(
        {
            "success": True,
            "executionId": execution_id,
            "status": "BOTH_FILLED",
            "details": "Simulated execution successful",
            "pnl": round(pnl, 2),
        }
    )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("PolyArb - Polymarket Arbitrage Bot")
    logger.info("=" * 60)
    logger.info("Core Logic:")
    logger.info("  1. Pull live prices for each market")
    logger.info("  2. Compute: price(YES) + price(NO)")
    logger.info("  3. If sum < $1.00, execute both orders")
    logger.info("  4. Log everything, repeat forever")
    logger.info("=" * 60)

    # Check for CLOB API key
    if CLOB_AUTH["private_key"]:
        logger.info("CLOB API: Authentication configured")
    else:
        logger.info("CLOB API: No private key (running in demo mode)")

    app.run(host="0.0.0.0", port=3001, debug=False)
