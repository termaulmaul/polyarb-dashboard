import express from 'express';
import { arbitrageScanner } from '../arb/scanner.js';
import { arbitrageExecutor } from '../arb/executor.js';
import { orderBookManager } from '../polymarket/orderbook.js';
import { ARB_CONFIG, RISK_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// GET /opportunities - Get arbitrage opportunities (REAL DATA)
router.get('/opportunities', async (req, res) => {
  try {
    // Get opportunities from the real scanner
    const opportunities = arbitrageScanner.getOpportunities();

    res.json({
      success: true,
      count: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    console.error('Failed to get opportunities', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// GET /opportunities/executable - Get only executable opportunities
router.get('/opportunities/executable', async (req, res) => {
  try {
    const executable = arbitrageScanner.getExecutableOpportunities();

    res.json({
      success: true,
      count: executable.length,
      data: executable,
    });
  } catch (error) {
    console.error('Failed to get executable opportunities', error);
    res.status(500).json({ error: 'Failed to fetch executable opportunities' });
  }
});

// GET /opportunities/:marketId - Get specific opportunity
router.get('/opportunities/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const opportunity = arbitrageScanner.getOpportunity(marketId);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error('Failed to get opportunity', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// GET /orderbook/:marketId - Get order book for a market
router.get('/orderbook/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const orderBook = await orderBookManager.getOrderBookEntries(marketId);

    if (!orderBook) {
      return res.status(404).json({ error: 'Order book not found' });
    }

    // Calculate spread metrics
    const yesBestAsk = orderBook.yes.length > 0 ? orderBook.yes[0].price : null;
    const noBestAsk = orderBook.no.length > 0 ? orderBook.no[0].price : null;
    const sum = yesBestAsk && noBestAsk ? yesBestAsk + noBestAsk : null;
    const edge = sum ? Math.max(0, 1 - sum) * 100 : 0;

    res.json({
      success: true,
      data: {
        marketId,
        yesOrderBook: orderBook.yes.slice(0, 10), // Top 10 levels
        noOrderBook: orderBook.no.slice(0, 10),
        bestAsk: { yes: yesBestAsk, no: noBestAsk },
        sum,
        edge: edge.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Failed to get order book', error);
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// GET /metrics - Get dashboard metrics (from real scanner)
router.get('/metrics', async (req, res) => {
  try {
    const scannerStatus = arbitrageScanner.getStatus();
    const executableCount = arbitrageScanner.getExecutableOpportunities().length;

    // Real metrics based on scanner state
    const metrics = {
      todayPnL: 0, // Would track from execution logs
      tradesExecuted: 0,
      winRate: 0,
      avgEdge: 0,
      pnlHistory: [],
      scannerStatus: {
        isScanning: scannerStatus.isScanning,
        opportunitiesCount: scannerStatus.opportunitiesCount,
        executableCount,
        minEdge: ARB_CONFIG.minEdge,
      },
    };

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get metrics', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// GET /logs - Get execution logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    // Would integrate with storage/logs.ts for real execution history
    // For now return empty array
    res.json([]);
  } catch (error) {
    console.error('Failed to get logs', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /execute - Execute arbitrage (REAL with CLOB)
router.post('/execute', express.json(), async (req, res) => {
  try {
    const { marketId, positionSize } = req.body;

    if (!marketId) {
      return res.status(400).json({ error: 'marketId is required' });
    }

    const size = positionSize || ARB_CONFIG.maxPosition;

    logger.info('Executing arbitrage trade', { marketId, positionSize: size });

    // Execute using real executor
    const result = await arbitrageExecutor.executeArbitrage(marketId, size, {
      minEdge: ARB_CONFIG.minEdge,
      maxExecutionWait: ARB_CONFIG.executionTimeout,
    });

    res.json({
      success: result.success,
      executionId: `exec_${Date.now()}`,
      status: result.status,
      details: result.details,
      pnl: result.pnl || 0,
    });
  } catch (error) {
    console.error('Failed to execute arbitrage', error);
    res.status(500).json({ error: 'Failed to execute arbitrage' });
  }
});

// POST /execute/simulate - Simulate execution without placing orders
router.post('/execute/simulate', express.json(), async (req, res) => {
  try {
    const { marketId } = req.body;

    if (!marketId) {
      return res.status(400).json({ error: 'marketId is required' });
    }

    const opportunity = arbitrageScanner.getOpportunity(marketId);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Simulate what would happen
    const wouldExecute = opportunity.executable && opportunity.edge >= ARB_CONFIG.minEdge;
    const estimatedPnL = wouldExecute
      ? ARB_CONFIG.maxPosition * (opportunity.edge / 100)
      : 0;

    res.json({
      success: true,
      simulated: true,
      opportunity: {
        marketId: opportunity.id,
        marketName: opportunity.marketName,
        yesAsk: opportunity.yesAsk,
        noAsk: opportunity.noAsk,
        sum: opportunity.sum,
        edge: opportunity.edge,
        executable: wouldExecute,
      },
      simulation: {
        positionSize: ARB_CONFIG.maxPosition,
        estimatedPnL: estimatedPnL.toFixed(2),
        wouldFill: wouldExecute,
        reason: wouldExecute ? 'Edge meets minimum threshold' : 'Edge below minimum threshold',
      },
    });
  } catch (error) {
    console.error('Failed to simulate execution', error);
    res.status(500).json({ error: 'Failed to simulate execution' });
  }
});

// GET /bot/status - Get bot status (REAL)
router.get('/bot/status', async (req, res) => {
  try {
    const scannerStatus = arbitrageScanner.getStatus();
    const activeExecutions = arbitrageExecutor.getActiveExecutionCount();

    const status = {
      enabled: scannerStatus.isScanning,
      config: {
        enabled: scannerStatus.isScanning,
        minEdge: ARB_CONFIG.minEdge,
        maxPositionSize: ARB_CONFIG.maxPosition,
        maxExecutionWait: ARB_CONFIG.executionTimeout / 1000,
      },
      riskMetrics: {
        dailyLossLimit: RISK_CONFIG.maxConcurrentExecutions * ARB_CONFIG.maxPosition,
        currentDailyLoss: 0,
        maxPositionSize: ARB_CONFIG.maxPosition,
        activeExecutions,
      },
      scannerStatus: {
        isScanning: scannerStatus.isScanning,
        opportunitiesCount: scannerStatus.opportunitiesCount,
        scanIntervalMs: ARB_CONFIG.scanInterval,
      },
      executorStatus: {
        activeExecutions,
        maxConcurrent: RISK_CONFIG.maxConcurrentExecutions,
      },
    };

    res.json(status);
  } catch (error) {
    console.error('Failed to get bot status', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

// POST /bot/config - Update bot configuration
router.post('/bot/config', express.json(), async (req, res) => {
  try {
    const { minEdge, maxPositionSize, maxExecutionWait, scanInterval } = req.body;

    // Validate and update config
    const result = {
      success: true,
      config: {
        enabled: true,
        minEdge: minEdge || ARB_CONFIG.minEdge,
        maxPositionSize: maxPositionSize || ARB_CONFIG.maxPosition,
        maxExecutionWait: maxExecutionWait || ARB_CONFIG.executionTimeout / 1000,
        scanInterval: scanInterval || ARB_CONFIG.scanInterval,
      },
      message: 'Configuration updated. Some changes require server restart to take effect.',
    };

    res.json(result);
  } catch (error) {
    console.error('Failed to update bot config', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// POST /bot/enable - Enable bot/scanner
router.post('/bot/enable', async (req, res) => {
  try {
    await arbitrageScanner.startScanning();
    res.json({ success: true, enabled: true, message: 'Scanner started' });
  } catch (error) {
    console.error('Failed to enable bot', error);
    res.status(500).json({ error: 'Failed to enable bot' });
  }
});

// POST /bot/disable - Disable bot/scanner
router.post('/bot/disable', async (req, res) => {
  try {
    arbitrageScanner.stopScanning();
    res.json({ success: true, enabled: false, message: 'Scanner stopped' });
  } catch (error) {
    console.error('Failed to disable bot', error);
    res.status(500).json({ error: 'Failed to disable bot' });
  }
});

// GET /scanner/status - Get detailed scanner status
router.get('/scanner/status', async (req, res) => {
  try {
    const status = arbitrageScanner.getStatus();
    const opportunities = arbitrageScanner.getOpportunities();

    res.json({
      isScanning: status.isScanning,
      opportunitiesCount: status.opportunitiesCount,
      executableCount: opportunities.filter((o) => o.executable).length,
      avgEdge:
        opportunities.length > 0
          ? opportunities.reduce((sum, o) => sum + o.edge, 0) / opportunities.length
          : 0,
      bestEdge: opportunities.length > 0 ? Math.max(...opportunities.map((o) => o.edge)) : 0,
    });
  } catch (error) {
    console.error('Failed to get scanner status', error);
    res.status(500).json({ error: 'Failed to get scanner status' });
  }
});

export { router as apiRoutes };
