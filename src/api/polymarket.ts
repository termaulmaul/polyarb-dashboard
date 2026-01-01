// API service to connect frontend with backend
// Fetches real data from Polymarket via our backend

import { Opportunity, ExecutionLog, DashboardMetrics } from '@/types/arbitrage';

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.com' // Replace with your production backend URL
  : 'http://localhost:3001'; // Backend runs on port 3001

// Helper to parse date strings from backend to Date objects
const parseOpportunityDates = (data: any): Opportunity => ({
  ...data,
  updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
});

// Helper to parse execution log dates
const parseExecutionLogDates = (log: any): ExecutionLog => ({
  ...log,
  timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
});

export const fetchLiveOpportunities = async (): Promise<Opportunity[]> => {
  const response = await fetch(`${API_BASE}/api/opportunities`);
  if (!response.ok) throw new Error('Failed to fetch opportunities');
  const data = await response.json();
  // Parse date strings to Date objects
  return Array.isArray(data) ? data.map(parseOpportunityDates) : [];
};

export const fetchExecutionLogs = async (
  limit = 100,
  offset = 0,
  status?: string,
  market?: string
): Promise<ExecutionLog[]> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (status) params.append('status', status);
  if (market) params.append('market', market);

  const response = await fetch(`${API_BASE}/api/logs?${params}`);
  if (!response.ok) throw new Error('Failed to fetch execution logs');
  const data = await response.json();
  // Parse date strings to Date objects
  return Array.isArray(data) ? data.map(parseExecutionLogDates) : [];
};

export const fetchMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch(`${API_BASE}/api/metrics`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
};

export const executeArbitrage = async (marketId: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ marketId }),
  });
  if (!response.ok) throw new Error('Failed to execute arbitrage');
  return response.json();
};

export const getBotStatus = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/bot/status`);
  if (!response.ok) throw new Error('Failed to get bot status');
  return response.json();
};

export const updateBotConfig = async (config: any): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/bot/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Failed to update bot config');
  return response.json();
};

export const enableBot = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/bot/enable`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to enable bot');
  return response.json();
};

export const disableBot = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/api/bot/disable`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to disable bot');
  return response.json();
};