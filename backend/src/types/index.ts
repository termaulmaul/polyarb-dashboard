export interface Opportunity {
  id: string;
  marketName: string;
  yesAsk: number;
  noAsk: number;
  sum: number;
  edge: number;
  executable: boolean;
  updatedAt: string; // ISO timestamp
}

export interface ExecutionLog {
  id: string;
  timestamp: string; // ISO timestamp
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

// Backend-specific types
export interface MarketData {
  id: string;
  question: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  yesTokenId: string;
  noTokenId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
  volume: string;
  volume24hr: string;
  // Current prices from Gamma API outcomePrices
  yesPrice: number;
  noPrice: number;
  // Bid-ask spread data from Gamma API
  bestBid: number;
  bestAsk: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
}

export interface ArbitrageOpportunity extends Opportunity {
  marketId: string;
  yesTokenId: string;
  noTokenId: string;
  yesOrderBook: OrderBookEntry[];
  noOrderBook: OrderBookEntry[];
}

export interface ExecutionState {
  id: string;
  marketId: string;
  yesOrderId?: string;
  noOrderId?: string;
  yesFilled: boolean;
  noFilled: boolean;
  yesPrice: number;
  noPrice: number;
  yesTokenId: string;
  noTokenId: string;
  expectedEdge: number;
  startedAt: Date;
  timeoutMs: number;
}

export interface ExecutionResult {
  success: boolean;
  status: ExecutionLog['status'];
  details: string;
  pnl?: number;
}

