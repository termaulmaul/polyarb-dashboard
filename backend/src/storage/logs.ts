import Database from 'better-sqlite3';
import path from 'path';
import { ExecutionLog } from '../types/index.js';
import { LOG_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class ExecutionLogsStorage {
  private db: Database.Database;

  constructor(dbPath: string = './data/polymarket.db') {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    require('fs').mkdirSync(dbDir, { recursive: true });

    this.db = new Database(dbPath);

    this.initializeTables();
    this.setupCleanupJob();

    logger.info('Execution logs storage initialized', { dbPath });
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        market TEXT NOT NULL,
        yesPrice REAL NOT NULL,
        noPrice REAL NOT NULL,
        expectedEdge REAL NOT NULL,
        status TEXT NOT NULL,
        details TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON execution_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_market ON execution_logs(market);
      CREATE INDEX IF NOT EXISTS idx_status ON execution_logs(status);
    `;

    this.db.exec(createTableSQL);
  }

  /**
   * Add execution log
   */
  addLog(log: ExecutionLog): void {
    const insertSQL = `
      INSERT INTO execution_logs (id, timestamp, market, yesPrice, noPrice, expectedEdge, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const stmt = this.db.prepare(insertSQL);
      stmt.run(
        log.id,
        log.timestamp,
        log.market,
        log.yesPrice,
        log.noPrice,
        log.expectedEdge,
        log.status,
        log.details || null
      );

      logger.debug('Execution log added', { logId: log.id, status: log.status });
    } catch (error) {
      logger.error('Failed to add execution log', { logId: log.id, error });
      throw error;
    }
  }

  /**
   * Get all logs with optional filtering
   */
  getLogs(options: {
    limit?: number;
    offset?: number;
    status?: string;
    market?: string;
    since?: string;
  } = {}): ExecutionLog[] {
    let query = 'SELECT * FROM execution_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.market) {
      conditions.push('market = ?');
      params.push(options.market);
    }

    if (options.since) {
      conditions.push('timestamp >= ?');
      params.push(options.since);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params);

      return rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        market: row.market,
        yesPrice: row.yesPrice,
        noPrice: row.noPrice,
        expectedEdge: row.expectedEdge,
        status: row.status,
        details: row.details,
      }));
    } catch (error) {
      logger.error('Failed to get execution logs', { error });
      return [];
    }
  }

  /**
   * Get log by ID
   */
  getLogById(id: string): ExecutionLog | null {
    const query = 'SELECT * FROM execution_logs WHERE id = ?';

    try {
      const stmt = this.db.prepare(query);
      const row = stmt.get(id);

      if (!row) return null;

      return {
        id: row.id,
        timestamp: row.timestamp,
        market: row.market,
        yesPrice: row.yesPrice,
        noPrice: row.noPrice,
        expectedEdge: row.expectedEdge,
        status: row.status,
        details: row.details,
      };
    } catch (error) {
      logger.error('Failed to get log by ID', { id, error });
      return null;
    }
  }

  /**
   * Get logs count
   */
  getLogsCount(): number {
    const query = 'SELECT COUNT(*) as count FROM execution_logs';

    try {
      const stmt = this.db.prepare(query);
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      logger.error('Failed to get logs count', { error });
      return 0;
    }
  }

  /**
   * Clean up old logs
   */
  cleanupOldLogs(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_CONFIG.retentionDays);

    const deleteSQL = 'DELETE FROM execution_logs WHERE timestamp < ?';

    try {
      const stmt = this.db.prepare(deleteSQL);
      const result = stmt.run(cutoffDate.toISOString());

      const deletedCount = result.changes;
      if (deletedCount > 0) {
        logger.info('Cleaned up old execution logs', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old logs', { error });
      throw error;
    }
  }

  /**
   * Setup periodic cleanup job
   */
  private setupCleanupJob(): void {
    // Run cleanup daily
    setInterval(() => {
      try {
        this.cleanupOldLogs();
      } catch (error) {
        logger.error('Cleanup job failed', { error });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Execution logs storage closed');
  }
}

// Singleton instance
