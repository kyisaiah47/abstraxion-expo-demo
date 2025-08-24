import { WebsocketClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { fromBase64, fromUtf8 } from '@cosmjs/encoding';
import { XION_RPC_WS, CONTRACT_ADDRESS } from './config';
import { createLogger } from './logger';
import { 
  ContractEventType, 
  ParsedEvent, 
  TaskCreatedEvent,
  ProofSubmittedEvent,
  TaskPendingReleaseEvent,
  TaskReleasedEvent,
  TaskDisputedEvent,
  TaskRefundedEvent,
  ProofType
} from './types';

const logger = createLogger('blockchain');

export class BlockchainListener {
  private wsClient: WebsocketClient | null = null;
  private tmClient: Tendermint34Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds
  private isConnected = false;
  private eventHandlers: Array<(event: ParsedEvent) => Promise<void>> = [];

  constructor() {
    logger.info('Blockchain listener initialized', { 
      rpcUrl: XION_RPC_WS,
      contractAddress: CONTRACT_ADDRESS 
    });
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(): Promise<boolean> {
    try {
      logger.info('Connecting to XION WebSocket...', { url: XION_RPC_WS });
      
      this.wsClient = new WebsocketClient(XION_RPC_WS, (error) => {
        logger.error('WebSocket error', { error });
        this.isConnected = false;
        this.scheduleReconnect();
      });
      
      this.tmClient = await Tendermint34Client.create(this.wsClient);
      
      // Subscribe to new blocks and transactions
      await this.subscribeToEvents();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Successfully connected to XION WebSocket');
      return true;
      
    } catch (error) {
      logger.error('Failed to connect to XION WebSocket', { error });
      this.isConnected = false;
      await this.scheduleReconnect();
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.wsClient) {
      try {
        this.wsClient.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from XION WebSocket');
      } catch (error) {
        logger.error('Error during WebSocket disconnect', { error });
      }
    }
  }


  private async scheduleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`, { 
      delay: `${delay}ms` 
    });
    
    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  // ===== EVENT SUBSCRIPTION =====

  private async subscribeToEvents(): Promise<void> {
    if (!this.tmClient) {
      throw new Error('Tendermint client not initialized');
    }

    // Subscribe to new blocks to catch contract events
    const query = "tm.event='NewBlock'";
    
    try {
      const stream = this.tmClient.subscribeTx(query);
      
      logger.info('Subscribed to new blocks', { query });
      
      // Process the stream in the background
      this.processEventStream(stream);
    } catch (error) {
      logger.error('Failed to subscribe to events', { error });
      throw error;
    }
  }

  private async processEventStream(stream: any): Promise<void> {
    try {
      for await (const event of stream) {
        try {
          await this.processNewBlock(event);
        } catch (error) {
          logger.error('Error processing new block', { error });
        }
      }
    } catch (error) {
      logger.error('Event stream error', { error });
      this.isConnected = false;
      await this.scheduleReconnect();
    }
  }

  private async processNewBlock(blockEvent: any): Promise<void> {
    const blockHeight = blockEvent.data?.value?.block?.header?.height;
    if (!blockHeight) return;

    logger.debug('Processing new block', { blockHeight });

    // Get block results to access transaction results
    try {
      const blockResults = await this.tmClient?.blockResults(parseInt(blockHeight));
      if (!blockResults?.results) return;

      // Process each transaction in the block
      for (let txIndex = 0; txIndex < blockResults.results.length; txIndex++) {
        const txResult = blockResults.results[txIndex];
        if (txResult.code !== 0) continue; // Skip failed transactions

        await this.processTxEvents(txResult, blockHeight, txIndex);
      }
    } catch (error) {
      logger.error('Failed to get block results', { blockHeight, error });
    }
  }

  private async processTxEvents(txResult: any, blockHeight: string, txIndex: number): Promise<void> {
    if (!txResult.events) return;

    const txHash = `${blockHeight}-${txIndex}`; // Simple tx hash for indexing

    for (let eventIndex = 0; eventIndex < txResult.events.length; eventIndex++) {
      const event = txResult.events[eventIndex];
      
      // Only process events from our contract
      if (!this.isContractEvent(event)) continue;

      try {
        const parsedEvent = await this.parseContractEvent(event, txHash, eventIndex, parseInt(blockHeight));
        if (parsedEvent) {
          await this.handleParsedEvent(parsedEvent);
        }
      } catch (error) {
        logger.error('Failed to parse contract event', { 
          txHash, 
          eventIndex, 
          error 
        });
      }
    }
  }

  private isContractEvent(event: any): boolean {
    // Check if event is from our contract
    const contractAttribute = event.attributes?.find((attr: any) => 
      attr.key === 'contract_address' || attr.key === '_contract_address'
    );
    
    if (!contractAttribute) return false;
    
    let contractAddress: string;
    try {
      if (typeof contractAttribute.value === 'string') {
        contractAddress = fromUtf8(fromBase64(contractAttribute.value));
      } else {
        // Assume it's already decoded bytes
        contractAddress = fromUtf8(contractAttribute.value);
      }
    } catch {
      return false;
    }
    return contractAddress === CONTRACT_ADDRESS;
  }

  // ===== EVENT PARSING =====

  private async parseContractEvent(
    event: any, 
    txHash: string, 
    eventIndex: number, 
    blockHeight: number
  ): Promise<ParsedEvent | null> {
    if (!event.attributes) return null;

    // Convert attributes to key-value pairs
    const attributes: Record<string, string> = {};
    for (const attr of event.attributes) {
      let key: string;
      try {
        if (typeof attr.key === 'string') {
          key = fromUtf8(fromBase64(attr.key));
        } else {
          key = fromUtf8(attr.key);
        }
      } catch {
        continue; // Skip invalid keys
      }

      let value: string;
      try {
        if (typeof attr.value === 'string') {
          value = fromUtf8(fromBase64(attr.value));
        } else {
          value = fromUtf8(attr.value);
        }
      } catch {
        continue; // Skip invalid values
      }

      attributes[key] = value;
    }

    // Determine event type
    const eventType = this.getEventType(event.type, attributes);
    if (!eventType) return null;

    // Parse event data based on type
    const eventData = this.parseEventData(eventType, attributes);
    if (!eventData) return null;

    return {
      type: eventType,
      data: eventData,
      txHash,
      eventIndex,
      blockHeight,
      timestamp: new Date()
    };
  }

  private getEventType(cosmosEventType: string, attributes: Record<string, string>): ContractEventType | null {
    // Map Cosmos event types to our contract event types
    switch (cosmosEventType) {
      case 'wasm':
        // Check action attribute to determine specific event type
        const action = attributes.action || attributes._action;
        switch (action) {
          case 'task_created':
            return 'TaskCreated';
          case 'proof_submitted':
            return 'ProofSubmitted';
          case 'task_pending_release':
            return 'TaskPendingRelease';
          case 'task_released':
            return 'TaskReleased';
          case 'task_disputed':
            return 'TaskDisputed';
          case 'task_refunded':
            return 'TaskRefunded';
          default:
            return null;
        }
      default:
        return null;
    }
  }

  private parseEventData(eventType: ContractEventType, attributes: Record<string, string>): any {
    switch (eventType) {
      case 'TaskCreated':
        return this.parseTaskCreatedEvent(attributes);
      case 'ProofSubmitted':
        return this.parseProofSubmittedEvent(attributes);
      case 'TaskPendingRelease':
        return this.parseTaskPendingReleaseEvent(attributes);
      case 'TaskReleased':
        return this.parseTaskReleasedEvent(attributes);
      case 'TaskDisputed':
        return this.parseTaskDisputedEvent(attributes);
      case 'TaskRefunded':
        return this.parseTaskRefundedEvent(attributes);
      default:
        return null;
    }
  }

  private parseTaskCreatedEvent(attributes: Record<string, string>): TaskCreatedEvent | null {
    const taskId = attributes.task_id;
    const payer = attributes.payer;
    const amount = attributes.amount;
    const denom = attributes.denom || 'uxion';
    const proofType = attributes.proof_type as ProofType;

    if (!taskId || !payer || !amount || !proofType) {
      logger.warn('Missing required attributes for TaskCreated event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      payer,
      worker: attributes.worker,
      amount,
      denom,
      proof_type: proofType,
      description: attributes.description,
      endpoint: attributes.endpoint,
      review_window_secs: attributes.review_window_secs ? parseInt(attributes.review_window_secs) : undefined,
      deadline_ts: attributes.deadline_ts
    };
  }

  private parseProofSubmittedEvent(attributes: Record<string, string>): ProofSubmittedEvent | null {
    const taskId = attributes.task_id;
    const worker = attributes.worker;

    if (!taskId || !worker) {
      logger.warn('Missing required attributes for ProofSubmitted event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      worker,
      proof_hash: attributes.proof_hash,
      proof_url: attributes.proof_url,
      zk_proof_hash: attributes.zk_proof_hash
    };
  }

  private parseTaskPendingReleaseEvent(attributes: Record<string, string>): TaskPendingReleaseEvent | null {
    const taskId = attributes.task_id;
    const verifiedAt = attributes.verified_at;
    const expiresAt = attributes.expires_at;

    if (!taskId || !verifiedAt || !expiresAt) {
      logger.warn('Missing required attributes for TaskPendingRelease event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      verified_at: verifiedAt,
      expires_at: expiresAt
    };
  }

  private parseTaskReleasedEvent(attributes: Record<string, string>): TaskReleasedEvent | null {
    const taskId = attributes.task_id;
    const worker = attributes.worker;
    const amount = attributes.amount;

    if (!taskId || !worker || !amount) {
      logger.warn('Missing required attributes for TaskReleased event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      worker,
      amount
    };
  }

  private parseTaskDisputedEvent(attributes: Record<string, string>): TaskDisputedEvent | null {
    const taskId = attributes.task_id;
    const disputer = attributes.disputer;

    if (!taskId || !disputer) {
      logger.warn('Missing required attributes for TaskDisputed event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      disputer,
      reason: attributes.reason
    };
  }

  private parseTaskRefundedEvent(attributes: Record<string, string>): TaskRefundedEvent | null {
    const taskId = attributes.task_id;
    const payer = attributes.payer;
    const amount = attributes.amount;

    if (!taskId || !payer || !amount) {
      logger.warn('Missing required attributes for TaskRefunded event', { attributes });
      return null;
    }

    return {
      task_id: taskId,
      payer,
      amount
    };
  }

  // ===== EVENT HANDLING =====

  private async handleParsedEvent(event: ParsedEvent): Promise<void> {
    logger.logEvent(event.type, event.data.task_id, event.txHash);

    // Call all registered event handlers
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Event handler failed', { 
          eventType: event.type,
          taskId: event.data.task_id,
          error 
        });
      }
    }
  }

  // ===== PUBLIC METHODS =====

  onEvent(handler: (event: ParsedEvent) => Promise<void>): void {
    this.eventHandlers.push(handler);
    logger.info('Event handler registered', { totalHandlers: this.eventHandlers.length });
  }

  isWSConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts
    };
  }
}