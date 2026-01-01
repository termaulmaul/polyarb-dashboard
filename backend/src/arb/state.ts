import { ExecutionState } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ExecutionStateManager {
  private executions: Map<string, ExecutionState> = new Map();

  /**
   * Add new execution state
   */
  addExecution(state: ExecutionState): void {
    this.executions.set(state.id, state);
    logger.debug('Execution state added', { executionId: state.id, marketId: state.marketId });
  }

  /**
   * Update execution state
   */
  updateExecution(executionId: string, updates: Partial<ExecutionState>): void {
    const existing = this.executions.get(executionId);
    if (!existing) {
      logger.warn('Attempted to update non-existent execution', { executionId });
      return;
    }

    const updated = { ...existing, ...updates };
    this.executions.set(executionId, updated);

    logger.debug('Execution state updated', { executionId, updates });
  }

  /**
   * Remove execution state
   */
  removeExecution(executionId: string): void {
    const removed = this.executions.delete(executionId);
    if (removed) {
      logger.debug('Execution state removed', { executionId });
    }
  }

  /**
   * Get execution state
   */
  getExecution(executionId: string): ExecutionState | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): ExecutionState[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get executions for a specific market
   */
  getExecutionsForMarket(marketId: string): ExecutionState[] {
    return Array.from(this.executions.values())
      .filter(state => state.marketId === marketId);
  }

  /**
   * Check if market has active execution
   */
  hasActiveExecution(marketId: string): boolean {
    return Array.from(this.executions.values())
      .some(state => state.marketId === marketId);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    total: number;
    byMarket: Record<string, number>;
  } {
    const byMarket: Record<string, number> = {};

    for (const execution of this.executions.values()) {
      byMarket[execution.marketId] = (byMarket[execution.marketId] || 0) + 1;
    }

    return {
      total: this.executions.size,
      byMarket,
    };
  }

  /**
   * Clean up old executions (older than specified minutes)
   */
  cleanupOldExecutions(maxAgeMinutes: number = 30): number {
    const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
    let cleaned = 0;

    for (const [id, execution] of this.executions.entries()) {
      if (execution.startedAt.getTime() < cutoffTime) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up old executions', { cleaned, remaining: this.executions.size });
    }

    return cleaned;
  }

  /**
   * Clear all executions (for testing)
   */
  clearAll(): void {
    const count = this.executions.size;
    this.executions.clear();
    logger.info('All executions cleared', { count });
  }
}

// Singleton instance
export const executionStateManager = new ExecutionStateManager();</content>
<parameter name="filePath">/Users/maul/github/polyarb-dashboard/backend/src/arb/state.ts