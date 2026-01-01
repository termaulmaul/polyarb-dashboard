import { clobClient } from './clobClient.js';
import { OrderBookEntry } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class OrderBookManager {
  private orderBookCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION_MS = 2000; // 2 seconds

  /**
   * Get best ask prices for YES and NO tokens
   */
  async getBestAsks(marketId: string): Promise<{ yesAsk: number; noAsk: number } | null> {
    try {
      const orderBook = await this.getOrderBook(marketId);
      if (!orderBook) return null;

      const yesAsk = this.getBestAsk(orderBook.yes);
      const noAsk = this.getBestAsk(orderBook.no);

      if (yesAsk === null || noAsk === null) {
        logger.warn('Incomplete order book data', { marketId, yesAsk, noAsk });
        return null;
      }

      return { yesAsk, noAsk };
    } catch (error) {
      logger.error('Failed to get best asks', { marketId, error });
      return null;
    }
  }

  /**
   * Get full order book for a market
   */
  private async getOrderBook(marketId: string): Promise<any | null> {
    // Check cache first
    const cached = this.orderBookCache.get(marketId);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const orderBook = await clobClient.getOrderBook(marketId);

      // Cache the result
      this.orderBookCache.set(marketId, {
        data: orderBook,
        timestamp: new Date(),
      });

      return orderBook;
    } catch (error) {
      logger.error('Failed to fetch order book', { marketId, error });
      return null;
    }
  }

  /**
   * Extract best ask price from order book side
   */
  private getBestAsk(orderBookSide: any): number | null {
    if (!orderBookSide || !Array.isArray(orderBookSide) || orderBookSide.length === 0) {
      return null;
    }

    // Find the lowest ask price (best ask)
    const asks = orderBookSide.filter((entry: any) => entry.side === 'ask');
    if (asks.length === 0) return null;

    const bestAsk = asks.reduce((best: any, current: any) =>
      parseFloat(current.price) < parseFloat(best.price) ? current : best
    );

    return parseFloat(bestAsk.price);
  }

  /**
   * Get full order book entries for analysis
   */
  async getOrderBookEntries(marketId: string): Promise<{
    yes: OrderBookEntry[];
    no: OrderBookEntry[];
  } | null> {
    try {
      const orderBook = await this.getOrderBook(marketId);
      if (!orderBook) return null;

      return {
        yes: this.transformOrderBook(orderBook.yes),
        no: this.transformOrderBook(orderBook.no),
      };
    } catch (error) {
      logger.error('Failed to get order book entries', { marketId, error });
      return null;
    }
  }

  /**
   * Transform raw order book to our format
   */
  private transformOrderBook(rawBook: any[]): OrderBookEntry[] {
    if (!Array.isArray(rawBook)) return [];

    return rawBook
      .filter((entry: any) => entry.side === 'ask')
      .map((entry: any) => ({
        price: parseFloat(entry.price),
        size: parseFloat(entry.size),
      }))
      .sort((a, b) => a.price - b.price); // Sort by price ascending
  }

  /**
   * Calculate arbitrage edge
   */
  calculateEdge(yesAsk: number, noAsk: number): number {
    const sum = yesAsk + noAsk;
    if (sum >= 1.0) return 0;

    return (1.0 - sum) * 100; // Convert to percentage
  }

  /**
   * Check if arbitrage opportunity exists
   */
  hasArbitrageOpportunity(yesAsk: number, noAsk: number, minEdge: number): boolean {
    const edge = this.calculateEdge(yesAsk, noAsk);
    return edge >= minEdge;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.orderBookCache.clear();
  }
}

// Singleton instance
