import express from 'express';
import { createLogger } from './logger';
import { config, NODE_ENV, HEALTH_CHECK_PORT } from './config';
import { BlockchainListener } from './blockchain';
import { EventProcessor } from './eventProcessor';
import { SupabaseService } from './supabase';
import { TimerWorker } from './timerWorker';
import { NotificationService } from './notifications';

const logger = createLogger('main');

class ProofPayIndexer {
  private app: express.Application;
  private supabaseService: SupabaseService;
  private blockchainListener: BlockchainListener;
  private eventProcessor: EventProcessor;
  private timerWorker: TimerWorker;
  private notificationService: NotificationService;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupExpress();
    
    // Initialize services
    this.supabaseService = new SupabaseService();
    this.eventProcessor = new EventProcessor(this.supabaseService);
    this.blockchainListener = new BlockchainListener();
    this.notificationService = new NotificationService(this.supabaseService);
    this.timerWorker = new TimerWorker(this.supabaseService, this.notificationService);
    
    logger.info('ProofPay Indexer initialized', { 
      nodeEnv: NODE_ENV,
      port: HEALTH_CHECK_PORT
    });
  }

  // ===== EXPRESS SETUP =====

  private setupExpress(): void {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const status = await this.getHealthStatus();
      const httpStatus = status.healthy ? 200 : 503;
      res.status(httpStatus).json(status);
    });

    // Status endpoint with detailed info
    this.app.get('/status', async (req, res) => {
      const status = await this.getDetailedStatus();
      res.json(status);
    });

    // Manual timer check endpoint (for debugging)
    this.app.post('/manual/timer-check', async (req, res) => {
      try {
        const result = await this.timerWorker.runManualCheck();
        res.json({ success: true, result });
      } catch (error) {
        logger.error('Manual timer check failed', { error });
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Test notification endpoint (for debugging)
    this.app.post('/manual/test-notification', async (req, res) => {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          error: 'walletAddress is required' 
        });
      }

      try {
        const result = await this.notificationService.testNotification(walletAddress);
        res.json({ success: result });
      } catch (error) {
        logger.error('Test notification failed', { error, walletAddress });
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Mock event endpoint for development (used by mock verifier)
    this.app.post('/dev/mock-event', async (req, res) => {
      try {
        const mockEvent = req.body;
        
        if (!mockEvent.type || !mockEvent.data || !mockEvent.txHash) {
          return res.status(400).json({
            success: false,
            error: 'Invalid mock event format'
          });
        }

        // Process the mock event
        const success = await this.eventProcessor.processEvent(mockEvent);
        
        res.json({ 
          success, 
          message: `Processed mock event: ${mockEvent.type}`,
          taskId: mockEvent.data.task_id
        });

        logger.info('Processed mock event', { 
          type: mockEvent.type, 
          taskId: mockEvent.data.task_id,
          success 
        });

      } catch (error) {
        logger.error('Failed to process mock event', { error });
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  // ===== LIFECYCLE METHODS =====

  async start(): Promise<void> {
    try {
      logger.info('Starting ProofPay Indexer services...');

      // 1. Test database connection
      const dbConnected = await this.supabaseService.testConnection();
      if (!dbConnected) {
        throw new Error('Failed to connect to Supabase');
      }
      logger.info('✅ Supabase connection established');

      // 2. Set up blockchain event processing
      this.blockchainListener.onEvent(async (event) => {
        try {
          await this.eventProcessor.processEvent(event);
        } catch (error) {
          logger.error('Failed to process blockchain event', { 
            eventType: event.type,
            taskId: (event.data as any).task_id,
            error 
          });
        }
      });

      // 3. Connect to blockchain
      const blockchainConnected = await this.blockchainListener.connect();
      if (!blockchainConnected) {
        throw new Error('Failed to connect to XION blockchain');
      }
      logger.info('✅ XION blockchain connection established');

      // 4. Start timer worker for auto-releases
      this.timerWorker.start();
      logger.info('✅ Timer worker started');

      // 5. Start HTTP server
      this.app.listen(HEALTH_CHECK_PORT, () => {
        logger.info(`✅ Health check server running on port ${HEALTH_CHECK_PORT}`);
      });

      logger.info('🚀 ProofPay Indexer fully operational');

    } catch (error) {
      logger.error('Failed to start ProofPay Indexer', { error });
      await this.shutdown(1);
    }
  }

  async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down ProofPay Indexer...');

    try {
      // Stop timer worker
      this.timerWorker.stop();
      logger.info('Timer worker stopped');

      // Disconnect from blockchain
      await this.blockchainListener.disconnect();
      logger.info('Blockchain connection closed');

      logger.info('ProofPay Indexer shutdown complete');
      process.exit(exitCode);

    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }

  // ===== STATUS METHODS =====

  private async getHealthStatus(): Promise<{
    healthy: boolean;
    timestamp: string;
    services: Record<string, boolean>;
  }> {
    const timestamp = new Date().toISOString();
    
    const services = {
      database: await this.supabaseService.testConnection(),
      blockchain: this.blockchainListener.isWSConnected(),
      timer: this.timerWorker.getStatus().running
    };

    const healthy = Object.values(services).every(status => status);

    return {
      healthy,
      timestamp,
      services
    };
  }

  private async getDetailedStatus(): Promise<any> {
    const health = await this.getHealthStatus();
    const blockchainStatus = this.blockchainListener.getConnectionStatus();
    const timerStatus = this.timerWorker.getStatus();

    // Get upcoming expirations for monitoring
    const upcomingExpirations = await this.timerWorker.getUpcomingExpirations(60);

    return {
      ...health,
      version: process.env.npm_package_version || '1.0.0',
      node_env: NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      blockchain: {
        connected: blockchainStatus.connected,
        reconnectAttempts: blockchainStatus.attempts
      },
      timer: {
        running: timerStatus.running,
        nextRun: timerStatus.nextRun,
        upcomingExpirations: upcomingExpirations.length
      }
    };
  }
}

// ===== MAIN EXECUTION =====

async function main(): Promise<void> {
  logger.info('Starting ProofPay Indexer', { 
    nodeEnv: NODE_ENV,
    config: {
      XION_RPC_WS: config.XION_RPC_WS.replace(/\/\/.*@/, '//***@'),
      CONTRACT_ADDRESS: config.CONTRACT_ADDRESS,
      SUPABASE_URL: config.SUPABASE_URL,
      ONESIGNAL_APP_ID: config.ONESIGNAL_APP_ID.slice(0, 8) + '...'
    }
  });

  const indexer = new ProofPayIndexer();

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, initiating graceful shutdown');
    await indexer.shutdown(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, initiating graceful shutdown');
    await indexer.shutdown(0);
  });

  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception', { error });
    await indexer.shutdown(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    await indexer.shutdown(1);
  });

  // Start the indexer
  await indexer.start();
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(async (error) => {
    logger.error('Failed to start application', { error });
    process.exit(1);
  });
}

export { ProofPayIndexer };