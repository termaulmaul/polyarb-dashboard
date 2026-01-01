import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Gamma API configuration
const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
}));
app.use(express.json());

// Helper: Fetch markets from Gamma API
async function fetchGammaMarkets() {
  try {
    const response = await fetch(
      `${GAMMA_API_BASE}/markets?` + new URLSearchParams({
        limit: '30',
        active: 'true',
        closed: 'false',
        order: 'volume24hr',
        ascending: 'false'
      })
    );

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from Gamma API:', error);
    return [];
  }
}

// Helper: Parse outcome prices
function parseOutcomePrices(outcomePrices) {
  if (!outcomePrices) return { yes: 0, no: 0 };
  
  try {
    const parsed = typeof outcomePrices === 'string' 
      ? JSON.parse(outcomePrices) 
      : outcomePrices;
    return {
      yes: parseFloat(parsed[0]) || 0,
      no: parseFloat(parsed[1]) || 0
    };
  } catch (e) {
    return { yes: 0, no: 0 };
  }
}

// Helper: Calculate arbitrage edge
function calculateEdge(yesPrice, noPrice) {
  const sum = yesPrice + noPrice;
  if (sum >= 1.0) return 0;
  return (1.0 - sum) * 100; // Percentage
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get arbitrage opportunities (REAL DATA from Gamma API)
app.get('/api/opportunities', async (req, res) => {
  try {
    const markets = await fetchGammaMarkets();
    
    if (!Array.isArray(markets) || markets.length === 0) {
      return res.json([]);
    }

    // Transform Gamma API data to opportunities
    const opportunities = markets
      .map((market) => {
        const { yes, no } = parseOutcomePrices(market.outcomePrices);
        
        // Skip if prices are invalid
        if (yes <= 0 || no <= 0) return null;

        const sum = yes + no;
        const edge = calculateEdge(yes, no);
        const minEdge = 0.1; // Minimum edge threshold

        return {
          id: `arb_${market.id}`,
          marketId: market.id,
          marketName: market.question || market.slug || `Market ${market.id}`,
          yesAsk: yes,
          noAsk: no,
          sum: parseFloat(sum.toFixed(4)),
          edge: parseFloat(edge.toFixed(2)),
          executable: edge >= minEdge,
          volume24hr: market.volume24hr || '0',
          updatedAt: new Date().toISOString(),
        };
      })
      .filter(opp => opp !== null)
      .sort((a, b) => b.edge - a.edge) // Sort by edge descending
      .slice(0, 20); // Top 20 opportunities

    res.json(opportunities);
  } catch (error) {
    console.error('Failed to get opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get single market details
app.get('/api/markets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${GAMMA_API_BASE}/markets/${id}`);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const market = await response.json();
    const { yes, no } = parseOutcomePrices(market.outcomePrices);
    
    res.json({
      id: market.id,
      question: market.question,
      yesPrice: yes,
      noPrice: no,
      volume24hr: market.volume24hr,
      clobTokenIds: market.clobTokenIds,
    });
  } catch (error) {
    console.error('Failed to get market:', error);
    res.status(500).json({ error: 'Failed to fetch market' });
  }
});

// Get dashboard metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const markets = await fetchGammaMarkets();
    
    if (!Array.isArray(markets)) {
      return res.json({
        todayPnL: 0,
        tradesExecuted: 0,
        winRate: 0,
        avgEdge: 0,
        activeMarkets: 0,
        pnlHistory: [],
      });
    }

    // Calculate metrics from real data
    let totalEdge = 0;
    let arbitrageCount = 0;

    markets.forEach(market => {
      const { yes, no } = parseOutcomePrices(market.outcomePrices);
      if (yes > 0 && no > 0) {
        const edge = calculateEdge(yes, no);
        totalEdge += edge;
        if (edge > 0.1) arbitrageCount++;
      }
    });

    const avgEdge = markets.length > 0 ? totalEdge / markets.length : 0;

    res.json({
      todayPnL: 0, // Would track from execution history
      tradesExecuted: 0,
      winRate: 0,
      avgEdge: parseFloat(avgEdge.toFixed(2)),
      activeMarkets: markets.length,
      arbitrageOpportunities: arbitrageCount,
      pnlHistory: [0, 0, 0, 0, 0, 0, 0],
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get execution logs
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  
  // Return mock logs for now
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      market: 'Will BTC hit $100k in 2025?',
      yesPrice: 0.52,
      noPrice: 0.46,
      expectedEdge: 2.0,
      status: 'BOTH_FILLED',
      details: 'Both sides executed successfully',
    },
  ];

  res.json(mockLogs.slice(0, limit));
});

// Execute arbitrage
app.post('/api/execute', express.json(), (req, res) => {
  const { marketId } = req.body;

  if (!marketId) {
    return res.status(400).json({ error: 'marketId is required' });
  }

  const result = {
    success: true,
    executionId: `exec_${Date.now()}`,
    status: 'BOTH_FILLED',
    details: 'Execution simulated - real trading requires CLOB authentication',
    pnl: 0,
  };

  res.json(result);
});

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json({
    enabled: true,
    config: {
      enabled: true,
      minEdge: 1.5,
      maxPositionSize: 500,
      maxExecutionWait: 5,
    },
    riskMetrics: {
      dailyLossLimit: 1000,
      currentDailyLoss: 0,
      maxPositionSize: 500,
    },
    scannerStatus: {
      isScanning: true,
      opportunitiesCount: 0,
      source: 'gamma-api',
    },
  });
});

// Update bot config
app.post('/api/bot/config', express.json(), (req, res) => {
  const configUpdate = req.body;

  res.json({
    success: true,
    config: {
      enabled: true,
      minEdge: configUpdate.minEdge || 1.5,
      maxPositionSize: configUpdate.maxPositionSize || 500,
      maxExecutionWait: configUpdate.maxExecutionWait || 5,
    },
  });
});

// Enable bot
app.post('/api/bot/enable', (req, res) => {
  res.json({ success: true, enabled: true });
});

// Disable bot
app.post('/api/bot/disable', (req, res) => {
  res.json({ success: true, enabled: false });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PolyArb backend server running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/opportunities`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});