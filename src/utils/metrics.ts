// Metrics calculation service
// Calculates metrics from actual execution logs

import { ExecutionLog, DashboardMetrics } from '@/types/arbitrage';

export const calculateMetrics = (executionLogs: ExecutionLog[]): DashboardMetrics => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logs
  const todayLogs = executionLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  // Get successful trades (filled orders)
  const successfulTrades = todayLogs.filter(log =>
    log.status === 'BOTH_FILLED' || log.status === 'PARTIAL_FILL'
  );

  // Calculate total PnL from successful trades
  const totalPnL = successfulTrades.reduce((sum, log) => {
    // Simplified PnL calculation: edge * position size
    // In real implementation, this would factor in actual fill prices and fees
    const positionSize = 10; // Assume $10 position for demo
    const pnl = log.expectedEdge > 0 ? (log.expectedEdge / 100) * positionSize : 0;
    return sum + pnl;
  }, 0);

  // Calculate win rate
  const winRate = todayLogs.length > 0
    ? (successfulTrades.length / todayLogs.length) * 100
    : 0;

  // Calculate average edge
  const avgEdge = todayLogs.length > 0
    ? todayLogs.reduce((sum, log) => sum + log.expectedEdge, 0) / todayLogs.length
    : 0;

  // Calculate 7-day PnL history
  const pnlHistory = calculate7DayPnLHistory(executionLogs);

  return {
    todayPnL: totalPnL,
    tradesExecuted: todayLogs.length,
    winRate,
    avgEdge,
    pnlHistory,
  };
};

/**
 * Calculate 7-day PnL history from execution logs
 */
const calculate7DayPnLHistory = (logs: ExecutionLog[]): number[] => {
  const history: number[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);

    const dayLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === targetDate.getTime();
    });

    const dayPnL = dayLogs
      .filter(log => log.status === 'BOTH_FILLED' || log.status === 'PARTIAL_FILL')
      .reduce((sum, log) => {
        const positionSize = 10; // Assume $10 position
        const pnl = log.expectedEdge > 0 ? (log.expectedEdge / 100) * positionSize : 0;
        return sum + pnl;
      }, 0);

    history.push(dayPnL);
  }

  return history;
};