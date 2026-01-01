import { clobClient } from '../polymarket/clobClient.js';
import { arbitrageScanner } from './scanner.js';
import { ExecutionState, ExecutionResult, ArbitrageOpportunity } from '../types/index.js';
import { ARB_CONFIG, RISK_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { Side } from '@polymarket/clob-client';

export class ArbitrageExecutor {
  private activeExecutions: Map<string, ExecutionState> = new Map();
  private executionCounter = 0;

  /**
   * Execute arbitrage for a market
   */
  async executeArbitrage(
    marketId: string,
    positionSize: number,
    config: { minEdge: number; maxExecutionWait: number }
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();

    try {
      // Validate opportunity still exists
      const opportunity = arbitrageScanner.getOpportunity(marketId);
      if (!opportunity || !opportunity.executable) {
        return {
          success: false,
          status: 'FAILED',
          details: 'Arbitrage opportunity no longer available',
        };
      }

      // Validate edge meets minimum
      if (opportunity.edge < config.minEdge) {
        return {
          success: false,
          status: 'FAILED',
          details: `Edge ${opportunity.edge.toFixed(1)}% below minimum ${config.minEdge}%`,
        };
      }

      // Check concurrent execution limits
      if (this.activeExecutions.size >= RISK_CONFIG.maxConcurrentExecutions) {
        return {
          success: false,
          status: 'FAILED',
          details: 'Maximum concurrent executions reached',
        };
      }

      // Create execution state
      const executionState: ExecutionState = {
        id: executionId,
        marketId,
        yesFilled: false,
        noFilled: false,
        yesPrice: opportunity.yesAsk,
        noPrice: opportunity.noAsk,
        yesTokenId: opportunity.yesTokenId,
        noTokenId: opportunity.noTokenId,
        expectedEdge: opportunity.edge,
        startedAt: new Date(),
        timeoutMs: config.maxExecutionWait,
      };

      this.activeExecutions.set(executionId, executionState);

      logger.info('Starting arbitrage execution', {
        executionId,
        marketId,
        positionSize,
        expectedEdge: opportunity.edge,
      });

      // Execute dual-leg arbitrage
      const result = await this.executeDualLegArbitrage(executionState, positionSize);

      // Clean up
      this.activeExecutions.delete(executionId);

      return result;

    } catch (error) {
      logger.error('Arbitrage execution failed', { executionId, marketId, error });

      // Clean up on error
      this.activeExecutions.delete(executionId);

      return {
        success: false,
        status: 'FAILED',
        details: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute dual-leg arbitrage with timeout and risk management
   */
  private async executeDualLegArbitrage(
    state: ExecutionState,
    positionSize: number
  ): Promise<ExecutionResult> {
    const timeoutPromise = this.createTimeoutPromise(state.timeoutMs);

    try {
      // Start both legs simultaneously
      const [yesResult, noResult] = await Promise.allSettled([
        this.placeOrder(state.marketId, state.yesTokenId!, Side.BUY, state.yesPrice, positionSize),
        this.placeOrder(state.marketId, state.noTokenId!, Side.BUY, state.noPrice, positionSize),
        timeoutPromise,
      ]);

      // Check for timeout
      if (yesResult.status === 'rejected' && noResult.status === 'rejected') {
        await this.cancelPendingOrders(state);
        return {
          success: false,
          status: 'CANCELLED',
          details: 'Execution timeout',
        };
      }

      // Process results
      const yesSuccess = yesResult.status === 'fulfilled';
      const noSuccess = noResult.status === 'fulfilled';

      state.yesFilled = yesSuccess;
      state.noFilled = noSuccess;

      if (yesSuccess && noSuccess) {
        // Both legs filled - perfect arbitrage
        const pnl = this.calculatePnL(state);
        logger.info('Arbitrage executed successfully', {
          executionId: state.id,
          pnl,
          yesPrice: state.yesPrice,
          noPrice: state.noPrice,
        });

        return {
          success: true,
          status: 'BOTH_FILLED',
          details: 'Both legs executed successfully',
          pnl,
        };
      } else if (yesSuccess || noSuccess) {
        // Partial fill - handle risk
        await this.handlePartialFill(state, yesSuccess, noSuccess);
        return {
          success: false,
          status: 'PARTIAL_FILL',
          details: `Partial fill: YES=${yesSuccess}, NO=${noSuccess}`,
        };
      } else {
        // Complete failure
        return {
          success: false,
          status: 'FAILED',
          details: 'Both orders failed to execute',
        };
      }

    } catch (error) {
      logger.error('Dual-leg execution error', { executionId: state.id, error });
      await this.cancelPendingOrders(state);

      return {
        success: false,
        status: 'FAILED',
        details: `Execution error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Place individual order with retry logic
   */
  private async placeOrder(
    marketId: string,
    tokenId: string,
    side: Side,
    price: number,
    size: number,
    retryCount = 0
  ): Promise<string> {
    try {
      const orderId = await clobClient.placeOrder(tokenId, side, price, size, marketId);
      return orderId;
    } catch (error) {
      if (retryCount < RISK_CONFIG.maxRetries) {
        logger.warn('Order placement failed, retrying', {
          marketId,
          tokenId,
          side,
          price,
          size,
          retryCount,
          error,
        });

        await this.delay(RISK_CONFIG.retryDelayMs);
        return this.placeOrder(marketId, tokenId, side, price, size, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Handle partial fill scenarios
   */
  private async handlePartialFill(
    state: ExecutionState,
    yesFilled: boolean,
    noFilled: boolean
  ): Promise<void> {
    logger.warn('Partial fill detected', {
      executionId: state.id,
      yesFilled,
      noFilled,
    });

    // Cancel any pending orders
    await this.cancelPendingOrders(state);

    // TODO: Implement hedging logic if needed
    // For now, we just log and accept the partial fill
  }

  /**
   * Cancel pending orders
   */
  private async cancelPendingOrders(state: ExecutionState): Promise<void> {
    const cancelPromises: Promise<void>[] = [];

    if (state.yesOrderId) {
      cancelPromises.push(
        clobClient.cancelOrder(state.yesOrderId).catch((error) => {
          logger.error('Failed to cancel YES order', { orderId: state.yesOrderId, error });
        })
      );
    }

    if (state.noOrderId) {
      cancelPromises.push(
        clobClient.cancelOrder(state.noOrderId).catch((error) => {
          logger.error('Failed to cancel NO order', { orderId: state.noOrderId, error });
        })
      );
    }

    await Promise.allSettled(cancelPromises);
  }

  /**
   * Calculate PnL for successful arbitrage
   */
  private calculatePnL(state: ExecutionState): number {
    // In a perfect arbitrage, PnL = position_size * edge_percentage
    // This is simplified - real calculation would account for actual fill prices
    const positionSize = ARB_CONFIG.maxPosition; // This should be passed in
    return positionSize * (state.expectedEdge / 100);
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
    });
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${++this.executionCounter}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get active executions count
   */
  getActiveExecutionCount(): number {
    return this.activeExecutions.size;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionState | null {
    return this.activeExecutions.get(executionId) || null;
  }
}

// Singleton instance
