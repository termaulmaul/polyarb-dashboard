export interface Opportunity {
  id: string;
  marketName: string;
  yesAsk: number;
  noAsk: number;
  sum: number;
  edge: number;
  executable: boolean;
  updatedAt: string; // ISO date string from backend
  marketId?: string;
  isMock?: boolean; // Mark if this is mock data
  isSimulated?: boolean; // Mark if this is simulated for demo
  volume?: number; // Market volume
  category?: string; // Market category
}

export interface ExecutionLog {
  id: string;
  timestamp: string; // ISO date string from backend
  market: string;
  yesPrice: number;
  noPrice: number;
  expectedEdge: number;
  status: 'BOTH_FILLED' | 'PARTIAL_FILL' | 'FAILED' | 'CANCELLED' | 'PENDING';
  details?: string;
  pnl?: number; // PnL from execution
  actualEdge?: number; // Actual edge achieved
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
