import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRoutes } from './api/routes.js';
import { arbitrageScanner } from './arb/scanner.js';
import { marketManager } from './polymarket/markets.js';
import { clobClient } from './polymarket/clobClient.js';
import { logger } from './utils/logger.js';
import { envConfig } from './config/env.js';

// Create Express app
const app = express();
const PORT = envConfig.PORT;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    scanner: arbitrageScanner.getStatus(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Initialize backend services
 */
async function initializeServices(): Promise<void> {
  logger.info('Initializing PolyArb backend services...');

  try {
    // Test market data connection
    logger.info('Fetching initial market data...');
    const markets = await marketManager.getActiveMarkets();
    logger.info(`Loaded ${markets.length} markets from Gamma API`);

    // Optionally initialize CLOB client (requires PM_PRIVATE_KEY)
    if (envConfig.PM_PRIVATE_KEY && envConfig.PM_PRIVATE_KEY !== 'your_private_key_here') {
      try {
        logger.info('Initializing CLOB client...');
        await clobClient.initialize();
        logger.info('CLOB client initialized successfully');
      } catch (error) {
        logger.warn('Failed to initialize CLOB client (auth required for real trading)', { error });
      }
    } else {
      logger.info('CLOB client skipped - no private key configured (using mock data)');
    }

    // Start the arbitrage scanner
    logger.info('Starting arbitrage scanner...');
    await arbitrageScanner.startScanning();
    logger.info('Arbitrage scanner started');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    // Don't exit - let the server run with limited functionality
  }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize services first
    await initializeServices();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 PolyArb backend server running`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiBase: `http://localhost:${PORT}/api`,
        healthCheck: `http://localhost:${PORT}/health`,
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  arbitrageScanner.stopScanning();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  arbitrageScanner.stopScanning();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start the server
startServer().catch((error) => {
  logger.error('💥 Critical startup error', { error });
  process.exit(1);
});
