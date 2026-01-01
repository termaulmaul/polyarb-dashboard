import { envConfig } from './env.js';

// Polymarket CLOB constants
export const CLOB_CONFIG = {
  host: envConfig.PM_CLOB_HOST,
  chainId: envConfig.PM_CHAIN === 'polygon' ? 137 : 80001,
  privateKey: envConfig.PM_PRIVATE_KEY,
} as const;

// Arbitrage constants
export const ARB_CONFIG = {
  minEdge: envConfig.MIN_EDGE_DEFAULT,
  maxPosition: envConfig.MAX_POSITION_DEFAULT,
  executionTimeout: envConfig.EXECUTION_TIMEOUT_MS,
  scanInterval: envConfig.SCAN_INTERVAL_MS,
} as const;

// API constants
export const API_CONFIG = {
  port: envConfig.PORT,
  corsOrigins: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
} as const;

// Market filtering constants
export const MARKET_FILTERS = {
  minVolume24hr: 1000, // Minimum 24hr volume in USD
  minLiquidity: 100,   // Minimum liquidity score
  maxMarkets: 100,     // Maximum markets to track
} as const;

// Risk management constants
export const RISK_CONFIG = {
  maxConcurrentExecutions: 3,
  maxRetries: 2,
  retryDelayMs: 1000,
  cancelTimeoutMs: 5000,
} as const;

// Logging constants
export const LOG_CONFIG = {
  level: envConfig.LOG_LEVEL,
  maxLogs: 10000,
  retentionDays: 30,
} as const;

// Demo mode - inject mock arbitrage opportunities for UI testing
export const DEMO_CONFIG = {
  enabled: process.env.DEMO_MODE === 'true',
  mockOpportunityCount: 5,
  mockEdgeRange: [0.5, 3.0], // 0.5% to 3.0% edge
} as const;
