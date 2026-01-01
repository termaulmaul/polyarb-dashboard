import { marketManager } from '../polymarket/markets.js';
import { Opportunity, ArbitrageOpportunity, MarketData } from '../types/index.js';
import { ARB_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class ArbitrageScanner {
  private opportunities: Map<string, ArbitrageOpportunity> = new Map();
  private isScanning = false;

  /**
   * Start continuous scanning for arbitrage opportunities
   */
  async startScanning(): Promise<void> {
    if (this.isScanning) {
      logger.warn('Scanner already running');
      return;
    }

    this.isScanning = true;
    logger.info('Starting arbitrage scanner', { intervalMs: ARB_CONFIG.scanInterval });

    const scanLoop = async () => {
      if (!this.isScanning) return;

      try {
        await this.scanOnce();
      } catch (error) {
        logger.error('Scan iteration failed', { error });
      }

      // Schedule next scan
      setTimeout(scanLoop, ARB_CONFIG.scanInterval);
    };

    // Start first scan
    await this.scanOnce();
    scanLoop();
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    this.isScanning = false;
    logger.info('Arbitrage scanner stopped');
  }

  /**
   * Perform one scan iteration
   * Fetches from Gamma API /markets and calculates arbitrage opportunities
   */
  private async scanOnce(): Promise<void> {
    // Force refresh to get latest prices from Gamma API
    const markets = await marketManager.getActiveMarkets(true);

    for (const market of markets) {
      try {
        await this.scanMarket(market);
      } catch (error) {
        logger.error('Failed to scan market', { marketId: market.id, error });
      }
    }

    logger.debug(`Scan complete. Found ${this.opportunities.size} opportunities`);
  }

  /**
   * Scan a specific market for arbitrage opportunities
   * Uses prices from Gamma API (outcomePrices field)
   * 
   * Arbitrage Logic:
   * - In binary markets, YES + NO should = 1.00 at equilibrium
   * - If YES + NO < 1.00, there's an arbitrage opportunity
   * - Edge = (1.00 - (YES + NO)) * 100%
   */
  private async scanMarket(market: MarketData): Promise<void> {
    // Get current prices from Gamma API outcomePrices
    const yesAsk = market.yesPrice;
    const noAsk = market.noPrice;

    // Skip if prices are invalid
    if (yesAsk <= 0 || noAsk <= 0) {
      return;
    }

    // Calculate sum and edge
    const sum = yesAsk + noAsk;
    const edge = this.calculateEdge(yesAsk, noAsk);

    // Create opportunity object
    const opportunity: ArbitrageOpportunity = {
      id: `arb_${market.id}`,
      marketName: market.question,
      marketId: market.id,
      yesAsk,
      noAsk,
      sum,
      edge,
      executable: edge >= ARB_CONFIG.minEdge,
      updatedAt: new Date().toISOString(),
      yesTokenId: market.yesTokenId,
      noTokenId: market.noTokenId,
      yesOrderBook: [],
      noOrderBook: [],
    };

    // Update or add opportunity
    const existing = this.opportunities.get(`arb_${market.id}`);
    if (!existing || this.hasSignificantChange(existing, opportunity)) {
      this.opportunities.set(`arb_${market.id}`, opportunity);

      if (opportunity.executable) {
        logger.info('Arbitrage opportunity detected', {
          marketId: market.id,
          marketName: market.question,
          yesAsk,
          noAsk,
          sum,
          edge,
        });
      }
    }
  }

  /**
   * Calculate arbitrage edge
   * Edge = 1.00 - (YES + NO), positive means profit opportunity
   * 
   * Example:
   * - YES = 0.52, NO = 0.46
   * - Sum = 0.98
   * - Edge = (1.00 - 0.98) * 100 = 2.0%
   */
  private calculateEdge(yesAsk: number, noAsk: number): number {
    const sum = yesAsk + noAsk;
    if (sum >= 1.0) return 0; // No arbitrage if sum >= 1.00

    return (1.0 - sum) * 100; // Convert to percentage
  }

  /**
   * Check if opportunity has significant price changes
   */
  private hasSignificantChange(existing: ArbitrageOpportunity, updated: ArbitrageOpportunity): boolean {
    const priceThreshold = 0.001; // 0.1% change threshold
    const edgeThreshold = 0.1;    // 0.1% edge change threshold

    const yesChange = Math.abs(existing.yesAsk - updated.yesAsk);
    const noChange = Math.abs(existing.noAsk - updated.noAsk);
    const edgeChange = Math.abs(existing.edge - updated.edge);

    return yesChange > priceThreshold || noChange > priceThreshold || edgeChange > edgeThreshold;
  }

  /**
   * Get all current opportunities
   */
  getOpportunities(): Opportunity[] {
    return Array.from(this.opportunities.values()).map(this.toFrontendOpportunity);
  }

  /**
   * Get executable opportunities only
   */
  getExecutableOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.opportunities.values())
      .filter(opp => opp.executable);
  }

  /**
   * Get opportunity by market ID
   */
  getOpportunity(marketId: string): ArbitrageOpportunity | null {
    return this.opportunities.get(`arb_${marketId}`) || null;
  }

  /**
   * Convert to frontend Opportunity format
   */
  private toFrontendOpportunity(arbOpp: ArbitrageOpportunity): Opportunity {
    return {
      id: arbOpp.id,
      marketName: arbOpp.marketName,
      yesAsk: arbOpp.yesAsk,
      noAsk: arbOpp.noAsk,
      sum: arbOpp.sum,
      edge: arbOpp.edge,
      executable: arbOpp.executable,
      updatedAt: arbOpp.updatedAt,
    };
  }

  /**
   * Get scanner status
   */
  getStatus(): { isScanning: boolean; opportunitiesCount: number } {
    return {
      isScanning: this.isScanning,
      opportunitiesCount: this.opportunities.size,
    };
  }

  /**
   * Clear all opportunities (for testing)
   */
  clearOpportunities(): void {
    this.opportunities.clear();
  }
}

// Singleton instance
export const arbitrageScanner = new ArbitrageScanner();
