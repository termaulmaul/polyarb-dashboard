export interface Opportunity {
  id: string;
  marketName: string;
  yesAsk: number;
  noAsk: number;
  sum: number;
  edge: number;
  executable: boolean;
  updatedAt: Date;
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  market: string;
  yesPrice: number;
  noPrice: number;
  expectedEdge: number;
  status: 'BOTH_FILLED' | 'PARTIAL_FILL' | 'FAILED' | 'CANCELLED';
  details?: string;
}

export interface BotConfig {
  enabled: boolean;
  minEdge: number;
  maxPositionSize: number;
  maxExecutionWait: number;
}

export interface DashboardMetrics {
  todayPnL: number;
  tradesExecuted: number;
  winRate: number;
  avgEdge: number;
  pnlHistory: number[];
}
