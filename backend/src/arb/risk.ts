import { BotConfig } from '../types/index.js';
import { ARB_CONFIG, RISK_CONFIG } from '../config/constants.js';
import { arbitrageExecutor } from './executor.js';
import { logger } from '../utils/logger.js';

export class RiskManager {
  private botConfig: BotConfig = {
    enabled: false,
    minEdge: ARB_CONFIG.minEdge,
    maxPositionSize: ARB_CONFIG.maxPosition,
    maxExecutionWait: ARB_CONFIG.executionTimeout,
  };

  /**
   * Validate bot configuration
   */
  validateConfig(config: Partial<BotConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.minEdge !== undefined && (config.minEdge < 0.1 || config.minEdge > 10)) {
      errors.push('minEdge must be between 0.1 and 10');
    }

    if (config.maxPositionSize !== undefined && (config.maxPositionSize < 1 || config.maxPositionSize > 1000)) {
      errors.push('maxPositionSize must be between 1 and 1000');
    }

    if (config.maxExecutionWait !== undefined && (config.maxExecutionWait < 1000 || config.maxExecutionWait > 10000)) {
      errors.push('maxExecutionWait must be between 1000 and 10000 ms');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update bot configuration
   */
  updateConfig(newConfig: Partial<BotConfig>): { success: boolean; errors?: string[] } {
    const validation = this.validateConfig(newConfig);

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Update configuration
    this.botConfig = { ...this.botConfig, ...newConfig };

    logger.info('Bot configuration updated', this.botConfig);

    return { success: true };
  }

  /**
   * Get current bot configuration
   */
  getConfig(): BotConfig {
    return { ...this.botConfig };
  }

  /**
   * Check if bot is enabled
   */
  isEnabled(): boolean {
    return this.botConfig.enabled;
  }

  /**
   * Enable/disable bot
   */
  setEnabled(enabled: boolean): void {
    this.botConfig.enabled = enabled;
    logger.info(`Bot ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Validate execution request
   */
  validateExecutionRequest(marketId: string): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.botConfig.enabled) {
      return { allowed: false, reason: 'Bot is disabled' };
    }

    if (arbitrageExecutor.getActiveExecutionCount() >= RISK_CONFIG.maxConcurrentExecutions) {
      return {
        allowed: false,
        reason: `Maximum concurrent executions (${RISK_CONFIG.maxConcurrentExecutions}) reached`
      };
    }

    return { allowed: true };
  }

  /**
   * Get execution parameters for current config
   */
  getExecutionParams() {
    return {
      minEdge: this.botConfig.minEdge,
      maxPositionSize: this.botConfig.maxPositionSize,
      maxExecutionWait: this.botConfig.maxExecutionWait,
    };
  }

  /**
   * Emergency stop - cancel all active executions
   */
  emergencyStop(): void {
    logger.warn('Emergency stop activated - cancelling all executions');
    this.setEnabled(false);
    // Note: In a real implementation, you'd want to cancel all active orders
  }

  /**
   * Get risk metrics
   */
  getRiskMetrics(): {
    activeExecutions: number;
    maxConcurrentExecutions: number;
    botEnabled: boolean;
  } {
    return {
      activeExecutions: arbitrageExecutor.getActiveExecutionCount(),
      maxConcurrentExecutions: RISK_CONFIG.maxConcurrentExecutions,
      botEnabled: this.botConfig.enabled,
    };
  }
}

// Singleton instance
