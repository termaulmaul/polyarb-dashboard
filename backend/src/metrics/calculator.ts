import { DashboardMetrics, ExecutionLog } from '../types/index.js';
import { executionLogs } from '../storage/logs.js';
import { logger } from '../utils/logger.js';

export class MetricsCalculator {
  /**
   * Calculate dashboard metrics
   */
  calculateDashboardMetrics(): DashboardMetrics {
    const logs = executionLogs.getLogs();

    // Calculate today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    const todayPnL = this.calculateTodayPnL(todayLogs);
    const tradesExecuted = todayLogs.length;
    const winRate = this.calculateWinRate(todayLogs);
    const avgEdge = this.calculateAverageEdge(todayLogs);
    const pnlHistory = this.calculatePnLHistory();

    return {
      todayPnL,
      tradesExecuted,
      winRate,
      avgEdge,
      pnlHistory,
    };
  }

  /**
   * Calculate today's PnL
   */
  private calculateTodayPnL(logs: ExecutionLog[]): number {
    return logs
      .filter(log => log.status === 'BOTH_FILLED')
      .reduce((total, log) => {
        // Simplified PnL calculation
        // In reality, this would be based on actual fill prices vs market prices
        const positionSize = 10; // This should come from execution data
        const pnl = positionSize * (log.expectedEdge / 100);
        return total + pnl;
      }, 0);
  }

  /**
   * Calculate win rate (percentage of successful executions)
   */
  private calculateWinRate(logs: ExecutionLog[]): number {
    if (logs.length === 0) return 0;

    const successful = logs.filter(log => log.status === 'BOTH_FILLED').length;
    return (successful / logs.length) * 100;
  }

  /**
   * Calculate average edge of executed trades
   */
  private calculateAverageEdge(logs: ExecutionLog[]): number {
    const executedLogs = logs.filter(log => log.status === 'BOTH_FILLED');

    if (executedLogs.length === 0) return 0;

    const totalEdge = executedLogs.reduce((sum, log) => sum + log.expectedEdge, 0);
    return totalEdge / executedLogs.length;
  }

  /**
   * Calculate 7-day PnL history for sparkline
   */
  private calculatePnLHistory(): number[] {
    const history: number[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayLogs = executionLogs.getLogs().filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime() && log.status === 'BOTH_FILLED';
      });

      const dayPnL = this.calculateTodayPnL(dayLogs);
      history.push(dayPnL);
    }

    return history;
  }

  /**
   * Get detailed performance metrics
   */
  getDetailedMetrics(): {
    totalTrades: number;
    totalPnL: number;
    averageWinRate: number;
    averageEdge: number;
    bestDay: { date: string; pnl: number };
    worstDay: { date: string; pnl: number };
    executionStatusBreakdown: Record<string, number>;
  } {
    const allLogs = executionLogs.getLogs();

    const totalTrades = allLogs.length;
    const totalPnL = this.calculateTotalPnL(allLogs);
    const averageWinRate = this.calculateOverallWinRate(allLogs);
    const averageEdge = this.calculateOverallAverageEdge(allLogs);

    const dailyPnL = this.calculateDailyPnL();
    const bestDay = this.findBestDay(dailyPnL);
    const worstDay = this.findWorstDay(dailyPnL);

    const executionStatusBreakdown = this.calculateStatusBreakdown(allLogs);

    return {
      totalTrades,
      totalPnL,
      averageWinRate,
      averageEdge,
      bestDay,
      worstDay,
      executionStatusBreakdown,
    };
  }

  /**
   * Calculate total PnL across all time
   */
  private calculateTotalPnL(logs: ExecutionLog[]): number {
    return logs
      .filter(log => log.status === 'BOTH_FILLED')
      .reduce((total, log) => {
        const positionSize = 10; // Should come from execution data
        const pnl = positionSize * (log.expectedEdge / 100);
        return total + pnl;
      }, 0);
  }

  /**
   * Calculate overall win rate
   */
  private calculateOverallWinRate(logs: ExecutionLog[]): number {
    if (logs.length === 0) return 0;

    const successful = logs.filter(log => log.status === 'BOTH_FILLED').length;
    return (successful / logs.length) * 100;
  }

  /**
   * Calculate overall average edge
   */
  private calculateOverallAverageEdge(logs: ExecutionLog[]): number {
    const executedLogs = logs.filter(log => log.status === 'BOTH_FILLED');

    if (executedLogs.length === 0) return 0;

    const totalEdge = executedLogs.reduce((sum, log) => sum + log.expectedEdge, 0);
    return totalEdge / executedLogs.length;
  }

  /**
   * Calculate daily PnL for analysis
   */
  private calculateDailyPnL(): Map<string, number> {
    const dailyPnL = new Map<string, number>();

    executionLogs.getLogs().forEach(log => {
      if (log.status !== 'BOTH_FILLED') return;

      const date = new Date(log.timestamp).toDateString();
      const currentPnL = dailyPnL.get(date) || 0;
      const positionSize = 10; // Should come from execution data
      const pnl = positionSize * (log.expectedEdge / 100);

      dailyPnL.set(date, currentPnL + pnl);
    });

    return dailyPnL;
  }

  /**
   * Find best performing day
   */
  private findBestDay(dailyPnL: Map<string, number>): { date: string; pnl: number } {
    let best = { date: '', pnl: -Infinity };

    for (const [date, pnl] of dailyPnL.entries()) {
      if (pnl > best.pnl) {
        best = { date, pnl };
      }
    }

    return best.date ? best : { date: 'N/A', pnl: 0 };
  }

  /**
   * Find worst performing day
   */
  private findWorstDay(dailyPnL: Map<string, number>): { date: string; pnl: number } {
    let worst = { date: '', pnl: Infinity };

    for (const [date, pnl] of dailyPnL.entries()) {
      if (pnl < worst.pnl) {
        worst = { date, pnl };
      }
    }

    return worst.date ? worst : { date: 'N/A', pnl: 0 };
  }

  /**
   * Calculate execution status breakdown
   */
  private calculateStatusBreakdown(logs: ExecutionLog[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    logs.forEach(log => {
      breakdown[log.status] = (breakdown[log.status] || 0) + 1;
    });

    return breakdown;
  }
}

// Singleton instance
