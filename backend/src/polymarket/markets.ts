import { MarketData } from '../types/index.js';
import { MARKET_FILTERS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export class MarketManager {
  private markets: Map<string, MarketData> = new Map();
  private lastUpdate: Date = new Date(0);

  /**
   * Get all active markets with filtering
   * Uses Gamma API /markets endpoint to get outcome prices
   */
  async getActiveMarkets(forceRefresh = false): Promise<MarketData[]> {
    const now = new Date();
    const cacheAge = now.getTime() - this.lastUpdate.getTime();

    // Return cached data if recent (5 minutes)
    if (!forceRefresh && cacheAge < 5 * 60 * 1000 && this.markets.size > 0) {
      return Array.from(this.markets.values());
    }

    try {
      // Use Gamma API /markets endpoint with proper parameters
      const response = await fetch(
        `${GAMMA_API_BASE}/markets?` + new URLSearchParams({
          limit: '50',
          active: 'true',
          closed: 'false',
          order: 'volume24hr',
          ascending: 'false'
        })
      );

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }

      const marketsData = await response.json();

      if (!Array.isArray(marketsData)) {
        logger.warn('Gamma API returned non-array markets');
        return Array.from(this.markets.values());
      }

      // Filter and transform markets
      const filteredMarkets = marketsData
        .filter((market: any) => this.isValidMarket(market))
        .map((market: any) => this.transformMarket(market))
        .slice(0, MARKET_FILTERS.maxMarkets);

      // Update cache
      this.markets.clear();
      filteredMarkets.forEach(market => {
        this.markets.set(market.id, market);
      });

      this.lastUpdate = now;

      logger.info(`Loaded ${filteredMarkets.length} active markets from Gamma API`);
      return filteredMarkets;
    } catch (error) {
      logger.error('Failed to load markets from Gamma API', { error });
      // Return cached data on error
      return Array.from(this.markets.values());
    }
  }

  /**
   * Get specific market by ID with latest prices from Gamma API
   */
  async getMarket(marketId: string): Promise<MarketData | null> {
    // Check cache first (but force refresh to get latest prices)
    if (this.markets.has(marketId)) {
      return this.markets.get(marketId)!;
    }

    try {
      const response = await fetch(`${GAMMA_API_BASE}/markets/${marketId}`);
      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }

      const market = await response.json();
      if (this.isValidMarket(market)) {
        const transformed = this.transformMarket(market);
        this.markets.set(marketId, transformed);
        return transformed;
      }
    } catch (error) {
      logger.error('Failed to get market from Gamma API', { marketId, error });
    }

    return null;
  }

  /**
   * Get YES and NO token IDs for a market
   */
  getTokenIds(marketId: string): { yesTokenId: string; noTokenId: string } | null {
    const market = this.markets.get(marketId);
    if (!market) return null;

    return {
      yesTokenId: market.yesTokenId,
      noTokenId: market.noTokenId,
    };
  }

  /**
   * Check if market is valid for arbitrage
   */
  private isValidMarket(market: any): boolean {
    // Must have outcome prices (YES/NO)
    const outcomePrices = market.outcomePrices;
    if (!outcomePrices || !Array.isArray(outcomePrices) || outcomePrices.length < 2) {
      return false;
    }

    return (
      market.active === true &&
      market.closed !== true &&
      parseFloat(market.volume24hr || '0') >= MARKET_FILTERS.minVolume24hr
    );
  }

  /**
   * Transform Gamma API market data to our format
   * Extract YES/NO prices from outcomePrices array
   */
  private transformMarket(market: any): MarketData {
    // Parse clobTokenIds to get YES/NO token IDs
    let yesTokenId = '';
    let noTokenId = '';

    if (market.clobTokenIds) {
      try {
        const tokenIds = typeof market.clobTokenIds === 'string' 
          ? JSON.parse(market.clobTokenIds) 
          : market.clobTokenIds;
        if (tokenIds.length >= 2) {
          yesTokenId = tokenIds[0];
          noTokenId = tokenIds[1];
        }
      } catch (e) {
        // Handle comma-separated format
        const tokenIds = market.clobTokenIds.split(',');
        if (tokenIds.length >= 2) {
          yesTokenId = tokenIds[0].trim();
          noTokenId = tokenIds[1].trim();
        }
      }
    }

    // Parse outcome prices: ["0.55", "0.45"] -> YES, NO
    let yesPrice = 0;
    let noPrice = 0;
    if (market.outcomePrices && Array.isArray(market.outcomePrices)) {
      yesPrice = parseFloat(market.outcomePrices[0]) || 0;
      noPrice = parseFloat(market.outcomePrices[1]) || 0;
    }

    // Parse best bid/ask for spread calculation
    let bestBid = 0;
    let bestAsk = 0;
    if (market.bestBid) {
      bestBid = parseFloat(market.bestBid) || 0;
    }
    if (market.bestAsk) {
      bestAsk = parseFloat(market.bestAsk) || 0;
    }

    return {
      id: market.id,
      question: market.question || market.slug || `Market ${market.id}`,
      active: market.active,
      closed: market.closed || false,
      marketMakerAddress: market.marketMakerAddress || '',
      yesTokenId,
      noTokenId,
      yesTokenAddress: market.yesTokenAddress || '',
      noTokenAddress: market.noTokenAddress || '',
      volume: market.volume || '0',
      volume24hr: market.volume24hr || '0',
      // Current prices from Gamma API outcomePrices
      yesPrice,
      noPrice,
      // Bid-ask spread data
      bestBid,
      bestAsk,
    };
  }

  /**
   * Get market name by ID
   */
  getMarketName(marketId: string): string {
    const market = this.markets.get(marketId);
    return market?.question || `Market ${marketId}`;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.markets.clear();
    this.lastUpdate = new Date(0);
  }
}

// Singleton instance
export const marketManager = new MarketManager();
