import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { arbitrageScanner } from '../arb/scanner.js';
import { metricsCalculator } from '../metrics/calculator.js';
import { riskManager } from '../arb/risk.js';
import { executionLogs } from '../storage/logs.js';
import { logger } from '../utils/logger.js';

interface WebSocketClient {
  ws: WebSocket;
  subscribedTopics: Set<string>;
}

export class WebSocketHandler {
  private wss: WebSocket.Server;
  private clients: Set<WebSocketClient> = new Set();
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    this.wss = new WebSocket.Server({ server, path: '/stream' });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.startBroadcasting();
    logger.info('WebSocket handler initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const client: WebSocketClient = {
      ws,
      subscribedTopics: new Set(['opportunities', 'metrics', 'logs']), // Default subscriptions
    };

    this.clients.add(client);

    logger.info('WebSocket client connected', {
      ip: request.socket?.remoteAddress,
      totalClients: this.clients.size,
    });

    // Handle client messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error) {
        logger.error('Invalid WebSocket message', { error, data: data.toString() });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(client);
      logger.info('WebSocket client disconnected', {
        totalClients: this.clients.size,
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket client error', { error });
      this.clients.delete(client);
    });

    // Send welcome message
    this.sendToClient(client, {
      type: 'welcome',
      data: {
        message: 'Connected to PolyArb WebSocket',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(client: WebSocketClient, message: any): void {
    switch (message.type) {
      case 'subscribe':
        if (Array.isArray(message.topics)) {
          message.topics.forEach((topic: string) => {
            client.subscribedTopics.add(topic);
          });
        }
        break;

      case 'unsubscribe':
        if (Array.isArray(message.topics)) {
          message.topics.forEach((topic: string) => {
            client.subscribedTopics.delete(topic);
          });
        }
        break;

      case 'ping':
        this.sendToClient(client, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        logger.warn('Unknown WebSocket message type', { type: message.type });
    }
  }

  /**
   * Start periodic broadcasting of updates
   */
  private startBroadcasting(): void {
    this.broadcastInterval = setInterval(() => {
      this.broadcastUpdates();
    }, 1000); // Broadcast every second
  }

  /**
   * Broadcast updates to all subscribed clients
   */
  private broadcastUpdates(): void {
    if (this.clients.size === 0) return;

    try {
      // Get latest data
      const opportunities = arbitrageScanner.getOpportunities();
      const metrics = metricsCalculator.calculateDashboardMetrics();
      const botStatus = {
        enabled: riskManager.isEnabled(),
        config: riskManager.getConfig(),
        riskMetrics: riskManager.getRiskMetrics(),
      };

      // Broadcast to clients
      for (const client of this.clients) {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Send opportunities if subscribed
          if (client.subscribedTopics.has('opportunities')) {
            this.sendToClient(client, {
              type: 'opportunities',
              data: opportunities,
              timestamp: new Date().toISOString(),
            });
          }

          // Send metrics if subscribed
          if (client.subscribedTopics.has('metrics')) {
            this.sendToClient(client, {
              type: 'metrics',
              data: metrics,
              timestamp: new Date().toISOString(),
            });
          }

          // Send bot status if subscribed
          if (client.subscribedTopics.has('bot')) {
            this.sendToClient(client, {
              type: 'bot',
              data: botStatus,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to broadcast updates', { error });
    }
  }

  /**
   * Broadcast execution log to all clients
   */
  broadcastExecutionLog(log: any): void {
    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN && client.subscribedTopics.has('logs')) {
        this.sendToClient(client, {
          type: 'execution_log',
          data: log,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send message to client', { error });
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalClients: number;
    activeConnections: number;
  } {
    let activeConnections = 0;

    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        activeConnections++;
      }
    }

    return {
      totalClients: this.clients.size,
      activeConnections,
    };
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    // Close all client connections
    for (const client of this.clients) {
      client.ws.close(1000, 'Server shutdown');
    }

    this.clients.clear();
    this.wss.close();

    logger.info('WebSocket handler shut down');
  }
}</content>
<parameter name="filePath">/Users/maul/github/polyarb-dashboard/backend/src/api/ws.ts