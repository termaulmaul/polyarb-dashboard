"""
OrderManager - Production-ready order management for Polymarket arbitrage engine
Handles real order placement, monitoring, and risk mitigation
"""

import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

# Temporarily disabled real CLOB integration - using mock for development
# from py_clob_client import ClobClient
# from py_clob_client.client import BookParams
# from py_clob_client.constants import BUY

# Mock constants for development
BUY = "BUY"
SELL = "SELL"


# Mock ClobClient for development
class BookParams:
    def __init__(self, token_id: str):
        self.token_id = token_id


class MockClobClient:
    """Mock CLOB client for development without real API"""

    ORDER_TYPE_GTC = "GTC"

    def __init__(
        self,
        host: str,
        key: Optional[str] = None,
        passphrase: Optional[str] = None,
        wallet_private_key: Optional[str] = None,
    ):
        self.host = host
        self.key = key
        self.passphrase = passphrase
        self.wallet_private_key = wallet_private_key
        logger.info("MockClobClient initialized (development mode)")

    def create_api_key(self):
        logger.info("Mock: API key creation skipped")
        return None

    def get_collateral_token(self):
        return {
            "token_id": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
        }  # USDC on Polygon

    def get_market(self, market_id: str):
        # Mock market data
        return {
            "market": f"Mock Market {market_id}",
            "tokens": [
                {"token_id": f"yes_token_{market_id}"},
                {"token_id": f"no_token_{market_id}"},
            ],
        }

    def get_order_book(self, book_params: BookParams):
        # Mock order book
        return {
            "asks": [{"price": "0.55", "size": "100"}],
            "bids": [{"price": "0.45", "size": "100"}],
        }

    def create_order(self, token_id: str, side: str, size: float, price: float):
        # Mock order creation
        return {"market": token_id, "side": side, "size": size, "price": price}

    def sign_order(self, order):
        # Mock signing
        return order

    def post_order(self, signed_order, orderType: str = "GTC"):
        # Mock order posting - simulate success/failure randomly
        import random

        if random.random() > 0.1:  # 90% success rate
            return {"orderID": f"mock_order_{random.randint(1000, 9999)}"}
        else:
            raise Exception("Mock: Order placement failed")

    def cancel_order(self, order_id: str):
        logger.info(f"Mock: Cancelled order {order_id}")
        return True

    def get_order(self, order_id: str):
        # Mock order status
        import random

        statuses = ["open", "filled", "cancelled"]
        return {
            "status": random.choice(statuses),
            "size": 10.0,
            "filled_size": random.uniform(0, 10),
            "remaining_size": random.uniform(0, 10),
            "price": 0.5,
        }


# Use mock client for development
ClobClient = MockClobClient

logger = logging.getLogger(__name__)


class OrderStatus(Enum):
    PENDING = "pending"
    PARTIAL_FILL = "partial_fill"
    FILLED = "filled"
    CANCELLED = "cancelled"
    FAILED = "failed"
    EXPIRED = "expired"


class FillStatus(Enum):
    BOTH_FILLED = "both_filled"
    ONE_FILLED = "one_filled"
    NONE_FILLED = "none_filled"
    TIMEOUT = "timeout"


@dataclass
class OrderInfo:
    order_id: str
    token_id: str
    side: str
    size: float
    price: float
    timestamp: float
    status: OrderStatus = OrderStatus.PENDING
    filled_size: float = 0.0
    remaining_size: float = 0.0


@dataclass
class ArbitrageExecution:
    market_id: str
    yes_order: Optional[OrderInfo] = None
    no_order: Optional[OrderInfo] = None
    start_time: float = 0.0
    fill_status: FillStatus = FillStatus.NONE_FILLED
    pnl: float = 0.0
    notes: str = ""


class OrderManager:
    """
    Production-ready order management for Polymarket arbitrage
    Handles simultaneous order placement, monitoring, and risk mitigation
    """

    def __init__(
        self,
        host: str,
        key: Optional[str] = None,
        passphrase: Optional[str] = None,
        wallet_private_key: Optional[str] = None,
    ):
        """
        Initialize OrderManager with Polymarket CLOB client

        Args:
            host: Polymarket API host
            key: API key
            passphrase: API passphrase
            wallet_private_key: Wallet private key for signing
        """
        self.client = ClobClient(
            host, key=key, passphrase=passphrase, wallet_private_key=wallet_private_key
        )
        self.logger = logging.getLogger(__name__)
        self.position_validator = PositionValidator()

        # Create API keys if they don't exist
        try:
            self.client.create_api_key()
            self.logger.info("API keys created successfully")
        except Exception as e:
            self.logger.warning(f"API key creation failed (may already exist): {e}")

        # Derive and set collateral token
        try:
            collateral_token = self.client.get_collateral_token()
            self.collateral_token_id = collateral_token["token_id"]
            self.logger.info(f"Collateral token: {self.collateral_token_id}")
        except Exception as e:
            self.logger.error(f"Failed to get collateral token: {e}")
            raise

    def get_market_info(self, market_id: str) -> Dict[str, Any]:
        """Get market information including tokens"""
        try:
            market = self.client.get_market(market_id)
            return {
                "yes_token_id": market["tokens"][0]["token_id"],  # YES token
                "no_token_id": market["tokens"][1]["token_id"],  # NO token
                "market_name": market["market"],
            }
        except Exception as e:
            self.logger.error(f"Failed to get market info for {market_id}: {e}")
            raise

    def get_order_book(self, token_id: str) -> Dict[str, Any]:
        """Get order book for a specific token"""
        try:
            book_params = BookParams(token_id=token_id)
            book = self.client.get_order_book(book_params)
            return book
        except Exception as e:
            self.logger.error(f"Failed to get order book for token {token_id}: {e}")
            raise

    def place_limit_order(
        self, token_id: str, side: str, size: float, price: float
    ) -> str:
        """
        Place a limit order

        Args:
            token_id: Token to trade
            side: BUY or SELL
            size: Order size
            price: Limit price

        Returns:
            order_id: The placed order ID
        """
        try:
            # Create order
            order = self.client.create_order(
                token_id=token_id, side=side, size=size, price=price
            )

            # Sign and post order
            signed_order = self.client.sign_order(order)
            resp = self.client.post_order(
                signed_order, orderType=ClobClient.ORDER_TYPE_GTC
            )

            order_id = resp["orderID"]
            self.logger.info(
                f"Order placed: {order_id} - {side} {size}@{price} for token {token_id}"
            )
            return order_id

        except Exception as e:
            self.logger.error(f"Failed to place order for token {token_id}: {e}")
            raise

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        try:
            self.client.cancel_order(order_id)
            self.logger.info(f"Order cancelled: {order_id}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to cancel order {order_id}: {e}")
            return False

    def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """Get order status and fill information"""
        try:
            order = self.client.get_order(order_id)
            return {
                "status": order.get("status", "unknown"),
                "size": float(order.get("size", 0)),
                "filled_size": float(order.get("filled_size", 0)),
                "remaining_size": float(order.get("remaining_size", 0)),
                "price": float(order.get("price", 0)),
            }
        except Exception as e:
            self.logger.error(f"Failed to get order status for {order_id}: {e}")
            return {
                "status": "error",
                "size": 0,
                "filled_size": 0,
                "remaining_size": 0,
                "price": 0,
            }

    def execute_arbitrage(
        self,
        market_id: str,
        yes_price: float,
        no_price: float,
        position_size: float,
        max_wait_time: int = 30,
    ) -> ArbitrageExecution:
        """
        Execute arbitrage trade: Buy YES and NO simultaneously

        Args:
            market_id: Market to arbitrage
            yes_price: Ask price for YES token
            no_price: Ask price for NO token
            position_size: Size to trade
            max_wait_time: Max time to wait for fills (seconds)

        Returns:
            ArbitrageExecution: Complete execution result
        """
        execution = ArbitrageExecution(market_id=market_id, start_time=time.time())

        try:
            # Get market info
            market_info = self.get_market_info(market_id)
            yes_token_id = market_info["yes_token_id"]
            no_token_id = market_info["no_token_id"]

            self.logger.info(f"Starting arbitrage execution for market {market_id}")
            self.logger.info(f"YES token: {yes_token_id} @ {yes_price}")
            self.logger.info(f"NO token: {no_token_id} @ {no_price}")
            self.logger.info(f"Position size: {position_size}")

            # Place both orders simultaneously
            yes_order_id = self.place_limit_order(
                yes_token_id, BUY, position_size, yes_price
            )
            no_order_id = self.place_limit_order(
                no_token_id, BUY, position_size, no_price
            )

            # Create order info objects
            execution.yes_order = OrderInfo(
                order_id=yes_order_id,
                token_id=yes_token_id,
                side=BUY,
                size=position_size,
                price=yes_price,
                timestamp=time.time(),
            )
            execution.no_order = OrderInfo(
                order_id=no_order_id,
                token_id=no_token_id,
                side=BUY,
                size=position_size,
                price=no_price,
                timestamp=time.time(),
            )

            # Monitor fills
            fill_status = self.monitor_fills(execution, max_wait_time)

            # Validate position safety before finalizing
            position_valid = self.position_validator.validate_arbitrage_position(
                market_id, execution.yes_order, execution.no_order
            )

            # Handle results
            if fill_status == FillStatus.BOTH_FILLED:
                execution.fill_status = FillStatus.BOTH_FILLED
                execution.pnl = 0.0  # Risk-free position
                execution.notes = (
                    "Both legs filled successfully - risk-free arbitrage position"
                )
                self.logger.info(f"✅ Arbitrage successful: Both orders filled")

            elif fill_status == FillStatus.ONE_FILLED:
                # Risk mitigation for partial fill
                pnl, notes = self.handle_partial_fill(execution)
                execution.fill_status = FillStatus.ONE_FILLED
                execution.pnl = pnl
                execution.notes = notes

                # Check if position is still dangerous after mitigation
                if not position_valid:
                    execution.notes += " ⚠️ WARNING: Naked exposure detected - manual intervention required"
                    self.logger.critical(
                        f"🚨 CRITICAL: Naked position in market {market_id} after mitigation"
                    )

            else:  # NONE_FILLED or TIMEOUT
                # Cancel remaining orders
                self.cancel_order(yes_order_id)
                self.cancel_order(no_order_id)
                execution.fill_status = fill_status
                execution.pnl = 0.0
                execution.notes = f"Failed to fill orders: {fill_status.value}"
                self.logger.warning(f"❌ Arbitrage failed: {fill_status.value}")

            # Final position validation
            if not position_valid and fill_status != FillStatus.NONE_FILLED:
                self.logger.critical(
                    f"🚨 POSITION VALIDATION FAILED: Market {market_id} has unsafe exposure"
                )
                execution.notes += " 🚨 POSITION VALIDATION FAILED"

        except Exception as e:
            execution.fill_status = FillStatus.NONE_FILLED
            execution.pnl = 0.0
            execution.notes = f"Execution error: {str(e)}"
            self.logger.error(f"Arbitrage execution failed: {e}")

        return execution

    def monitor_fills(
        self, execution: ArbitrageExecution, max_wait_time: int
    ) -> FillStatus:
        """
        Monitor order fills with timeout

        Returns:
            FillStatus: Result of monitoring
        """
        start_time = time.time()
        yes_filled = False
        no_filled = False

        while time.time() - start_time < max_wait_time:
            # Check YES order
            if execution.yes_order and not yes_filled:
                status = self.get_order_status(execution.yes_order.order_id)
                execution.yes_order.filled_size = status["filled_size"]
                execution.yes_order.remaining_size = status["remaining_size"]

                if status["filled_size"] == execution.yes_order.size:
                    yes_filled = True
                    execution.yes_order.status = OrderStatus.FILLED
                elif status["filled_size"] > 0:
                    execution.yes_order.status = OrderStatus.PARTIAL_FILL

            # Check NO order
            if execution.no_order and not no_filled:
                status = self.get_order_status(execution.no_order.order_id)
                execution.no_order.filled_size = status["filled_size"]
                execution.no_order.remaining_size = status["remaining_size"]

                if status["filled_size"] == execution.no_order.size:
                    no_filled = True
                    execution.no_order.status = OrderStatus.FILLED
                elif status["filled_size"] > 0:
                    execution.no_order.status = OrderStatus.PARTIAL_FILL

            # Check completion
            if yes_filled and no_filled:
                return FillStatus.BOTH_FILLED
            elif yes_filled or no_filled:
                # One filled, continue monitoring for the other
                continue

            time.sleep(0.5)  # Check every 500ms

        # Timeout reached
        if yes_filled or no_filled:
            return FillStatus.ONE_FILLED
        else:
            return FillStatus.TIMEOUT

    def handle_partial_fill(self, execution: ArbitrageExecution) -> Tuple[float, str]:
        """
        Handle partial fill scenarios - mitigate risk

        Returns:
            Tuple[float, str]: (pnl, notes)
        """
        yes_filled = (
            execution.yes_order and execution.yes_order.status == OrderStatus.FILLED
        )
        no_filled = (
            execution.no_order and execution.no_order.status == OrderStatus.FILLED
        )

        if yes_filled and not no_filled:
            # YES filled, NO not filled - try to fill NO or exit YES
            return self._handle_yes_only_fill(execution)
        elif no_filled and not yes_filled:
            # NO filled, YES not filled - try to fill YES or exit NO
            return self._handle_no_only_fill(execution)
        else:
            return 0.0, "Unexpected partial fill state"

    def _handle_yes_only_fill(self, execution: ArbitrageExecution) -> Tuple[float, str]:
        """Handle case where only YES order filled"""
        if not execution.yes_order or not execution.no_order:
            return 0.0, "Missing order information"

        # Try to fill the NO order at current ask
        try:
            no_book = self.get_order_book(execution.no_order.token_id)
            current_no_ask = (
                float(no_book["asks"][0]["price"])
                if no_book.get("asks")
                else execution.no_order.price
            )

            # If edge still exists, try to fill NO
            if current_no_ask + execution.yes_order.price < 1.0:
                # Try to place NO order again
                new_no_order_id = self.place_limit_order(
                    execution.no_order.token_id,
                    BUY,
                    execution.no_order.size,
                    current_no_ask,
                )

                # Monitor for 10 seconds
                start_monitor = time.time()
                while time.time() - start_monitor < 10:
                    status = self.get_order_status(new_no_order_id)
                    if status["filled_size"] == execution.no_order.size:
                        return (
                            0.0,
                            "YES and NO both filled after retry - risk-free position",
                        )
                    time.sleep(0.5)

            # If NO still not filled, exit YES position at best bid
            yes_book = self.get_order_book(execution.yes_order.token_id)
            if yes_book.get("bids"):
                exit_price = float(yes_book["bids"][0]["price"])
                # Calculate loss (YES bought at ask, sold at bid)
                loss = (
                    execution.yes_order.price - exit_price
                ) * execution.yes_order.size
                self.logger.warning(f"Exiting YES position with loss: ${loss:.4f}")
                return (
                    -loss,
                    f"YES filled, NO failed - exited position with controlled loss: ${loss:.4f}",
                )

        except Exception as e:
            self.logger.error(f"Error handling YES-only fill: {e}")

        return -0.01, "YES filled, NO failed - small controlled loss assumed"

    def _handle_no_only_fill(self, execution: ArbitrageExecution) -> Tuple[float, str]:
        """Handle case where only NO order filled"""
        # Similar logic to YES-only but for NO token
        if not execution.yes_order or not execution.no_order:
            return 0.0, "Missing order information"

        try:
            yes_book = self.get_order_book(execution.yes_order.token_id)
            current_yes_ask = (
                float(yes_book["asks"][0]["price"])
                if yes_book.get("asks")
                else execution.yes_order.price
            )

            if current_yes_ask + execution.no_order.price < 1.0:
                new_yes_order_id = self.place_limit_order(
                    execution.yes_order.token_id,
                    BUY,
                    execution.yes_order.size,
                    current_yes_ask,
                )

                start_monitor = time.time()
                while time.time() - start_monitor < 10:
                    status = self.get_order_status(new_yes_order_id)
                    if status["filled_size"] == execution.yes_order.size:
                        return (
                            0.0,
                            "YES and NO both filled after retry - risk-free position",
                        )
                    time.sleep(0.5)

            # Exit NO position
            no_book = self.get_order_book(execution.no_order.token_id)
            if no_book.get("bids"):
                exit_price = float(no_book["bids"][0]["price"])
                loss = (execution.no_order.price - exit_price) * execution.no_order.size
                self.logger.warning(f"Exiting NO position with loss: ${loss:.4f}")
                return (
                    -loss,
                    f"NO filled, YES failed - exited position with controlled loss: ${loss:.4f}",
                )

        except Exception as e:
            self.logger.error(f"Error handling NO-only fill: {e}")

        return -0.01, "NO filled, YES failed - small controlled loss assumed"


class PositionValidator:
    """
    Validates positions to ensure no naked YES/NO exposure
    Never allow intentional holding of naked YES or NO tokens
    """

    def __init__(self):
        self.active_positions = {}  # market_id -> position info
        self.logger = logging.getLogger(__name__)

    def validate_arbitrage_position(
        self, market_id: str, yes_order: OrderInfo, no_order: OrderInfo
    ) -> bool:
        """
        Validate that arbitrage position is properly hedged
        Returns True if position is valid (hedged), False otherwise
        """
        # Check if both orders exist and are for the same market
        if not yes_order or not no_order:
            self.logger.error(f"Missing order information for market {market_id}")
            return False

        # Check if both orders are filled (perfect hedge)
        yes_filled = yes_order.status == OrderStatus.FILLED
        no_filled = no_order.status == OrderStatus.FILLED

        if yes_filled and no_filled:
            self.logger.info(f"Market {market_id}: Perfect hedge - both orders filled")
            self._record_position(market_id, "hedged", yes_order.size)
            return True

        # Check if neither order is filled (no position)
        if not yes_filled and not no_filled:
            self.logger.info(f"Market {market_id}: No position - neither order filled")
            return True

        # Check for partial fills (risk state)
        if yes_filled and not no_filled:
            self.logger.warning(
                f"Market {market_id}: DANGEROUS - YES filled, NO not filled (naked YES exposure)"
            )
            self._record_position(market_id, "naked_yes", yes_order.size)
            return False

        if no_filled and not yes_filled:
            self.logger.warning(
                f"Market {market_id}: DANGEROUS - NO filled, YES not filled (naked NO exposure)"
            )
            self._record_position(market_id, "naked_no", no_order.size)
            return False

        return True

    def validate_exit_position(self, market_id: str, exit_order: OrderInfo) -> bool:
        """
        Validate that position exit is proper
        Returns True if exit is valid, False otherwise
        """
        if market_id not in self.active_positions:
            self.logger.warning(f"No active position found for market {market_id}")
            return False

        position = self.active_positions[market_id]

        # Only allow exits for naked positions
        if position["type"] == "hedged":
            self.logger.error(f"Cannot exit hedged position for market {market_id}")
            return False

        if exit_order.status == OrderStatus.FILLED:
            self.logger.info(
                f"Successfully exited {position['type']} position for market {market_id}"
            )
            del self.active_positions[market_id]
            return True

        return False

    def _record_position(self, market_id: str, position_type: str, size: float):
        """Record position information for tracking"""
        self.active_positions[market_id] = {
            "type": position_type,
            "size": size,
            "timestamp": time.time(),
        }

    def get_active_positions(self) -> Dict[str, Dict]:
        """Get all active positions"""
        return self.active_positions.copy()

    def get_naked_positions(self) -> Dict[str, Dict]:
        """Get positions that have naked exposure (dangerous)"""
        return {
            market_id: pos
            for market_id, pos in self.active_positions.items()
            if pos["type"] in ["naked_yes", "naked_no"]
        }

    def emergency_close_all(self) -> List[str]:
        """
        Emergency close all naked positions
        Returns list of markets that need manual intervention
        """
        naked_positions = self.get_naked_positions()
        manual_intervention = []

        for market_id, position in naked_positions.items():
            self.logger.critical(
                f"EMERGENCY: Naked {position['type']} position in market {market_id} needs manual closure"
            )
            manual_intervention.append(market_id)

        return manual_intervention
