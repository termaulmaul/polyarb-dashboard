import { ClobClient, Side } from '@polymarket/clob-client';
import { CLOB_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class PolymarketClobClient {
  private client: ClobClient;

  constructor() {
    // Initialize with correct parameters for v5+
    this.client = new ClobClient(CLOB_CONFIG.privateKey, {
      chainId: CLOB_CONFIG.chainId,
      endpoint: CLOB_CONFIG.host,
    });

    logger.info('Polymarket CLOB client initialized', {
      host: CLOB_CONFIG.host,
      chainId: CLOB_CONFIG.chainId,
    });
  }

  /**
   * Initialize the client with authentication
   */
  async initialize(): Promise<void> {
    try {
      await this.client.onboarding.recoverKeys();
      logger.info('CLOB client authenticated successfully');
    } catch (error) {
      logger.error('Failed to initialize CLOB client', { error });
      throw error;
    }
  }

  /**
   * Get client instance for direct access
   */
  getClient(): ClobClient {
    return this.client;
  }

  /**
   * Check if client is ready
   */
  isReady(): boolean {
    return this.client !== undefined;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<string> {
    try {
      const balance = await this.client.getBalance();
      return balance;
    } catch (error) {
      logger.error('Failed to get balance', { error });
      throw error;
    }
  }

  /**
   * Place a limit order
   */
  async placeOrder(
    tokenId: string,
    side: Side,
    price: number,
    size: number,
    marketId: string
  ): Promise<string> {
    try {
      const order = await this.client.createOrder({
        tokenID: tokenId,
        side,
        price,
        size,
        market: marketId,
      });

      logger.info('Order placed successfully', {
        orderId: order.order_id,
        tokenId,
        side,
        price,
        size,
        marketId,
      });

      return order.order_id;
    } catch (error) {
      logger.error('Failed to place order', {
        tokenId,
        side,
        price,
        size,
        marketId,
        error,
      });
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.client.cancelOrder(orderId);
      logger.info('Order cancelled successfully', { orderId });
    } catch (error) {
      logger.error('Failed to cancel order', { orderId, error });
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const status = await this.client.getOrder(orderId);
      return status;
    } catch (error) {
      logger.error('Failed to get order status', { orderId, error });
      throw error;
    }
  }

  /**
   * Get market order book
   */
  async getOrderBook(marketId: string): Promise<any> {
    try {
      const orderBook = await this.client.getOrderBook(marketId);
      return orderBook;
    } catch (error) {
      logger.error('Failed to get order book', { marketId, error });
      throw error;
    }
  }

  /**
   * Get market info
   */
  async getMarket(marketId: string): Promise<any> {
    try {
      const market = await this.client.getMarket(marketId);
      return market;
    } catch (error) {
      logger.error('Failed to get market', { marketId, error });
      throw error;
    }
  }

  /**
   * Get active markets
   */
  async getMarkets(): Promise<any[]> {
    try {
      const markets = await this.client.getMarkets();
      return markets;
    } catch (error) {
      logger.error('Failed to get markets', { error });
      throw error;
    }
  }
}

// Singleton instance
