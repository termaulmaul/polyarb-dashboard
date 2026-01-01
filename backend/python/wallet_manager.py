"""
WalletManager - Handle wallet authentication and connection for Polymarket
"""

import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class WalletManager:
    """
    Manages wallet authentication for Polymarket trading
    """

    def __init__(self):
        load_dotenv()
        self.host = "https://clob.polymarket.com"
        self.api_key = os.getenv("POLYMARKET_API_KEY")
        self.api_passphrase = os.getenv("POLYMARKET_API_PASSPHRASE")
        self.wallet_private_key = os.getenv("WALLET_PRIVATE_KEY")

        self._validate_credentials()

    def _validate_credentials(self) -> None:
        """Validate that all required credentials are present"""
        missing = []

        if not self.api_key:
            missing.append("POLYMARKET_API_KEY")
        if not self.api_passphrase:
            missing.append("POLYMARKET_API_PASSPHRASE")
        if not self.wallet_private_key:
            missing.append("WALLET_PRIVATE_KEY")

        if missing:
            logger.warning(
                f"Missing required environment variables: {', '.join(missing)}"
            )
            logger.warning("Running in DEMO MODE - no real trading will occur")
            logger.warning("Set credentials in .env file for production trading")
            # Don't raise error - allow demo mode
        else:
            logger.info("Wallet credentials validated successfully")

    def get_credentials(self) -> Dict[str, Optional[str]]:
        """Get wallet credentials for OrderManager"""
        return {
            "host": self.host,
            "key": self.api_key,
            "passphrase": self.api_passphrase,
            "wallet_private_key": self.wallet_private_key,
        }

    def is_demo_mode(self) -> bool:
        """Check if running in demo mode (no real wallet)"""
        return not all([self.api_key, self.api_passphrase, self.wallet_private_key])

    @staticmethod
    def create_env_template() -> str:
        """Create .env template for Polymarket credentials"""
        template = """# Polymarket API Credentials
# Get these from: https://polymarket.com/profile/api-keys
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_PASSPHRASE=your_passphrase_here

# Wallet Private Key (NEVER share this!)
# Get from your wallet (MetaMask, etc.)
WALLET_PRIVATE_KEY=your_private_key_here

# WARNING: Keep this file secure and never commit to git!
"""
        return template
