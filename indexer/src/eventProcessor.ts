import { createLogger } from './logger';
import { SupabaseService } from './supabase';
import { NotificationService } from './notifications';
import { 
  ParsedEvent,
  TaskRecord,
  TaskStatus,
  ActivityFeedRecord,
  ActivityVerb,
  TaskCreatedEvent,
  ProofSubmittedEvent,
  TaskPendingReleaseEvent,
  TaskReleasedEvent,
  TaskDisputedEvent,
  TaskRefundedEvent
} from './types';

const logger = createLogger('eventProcessor');

export class EventProcessor {
  private supabaseService: SupabaseService;
  private notificationService: NotificationService;

  constructor(supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
    this.notificationService = new NotificationService(supabaseService);
    
    logger.info('Event processor initialized');
  }

  // ===== MAIN EVENT PROCESSING =====

  async processEvent(event: ParsedEvent): Promise<boolean> {
    const { txHash, eventIndex } = event;

    try {
      // Check if event was already processed (idempotency)
      const isProcessed = await this.supabaseService.isEventProcessed(txHash, eventIndex);
      if (isProcessed) {
        logger.info('Event already processed, skipping', { 
          txHash, 
          eventIndex, 
          eventType: event.type 
        });
        return true;
      }

      // Process the event based on type
      const success = await this.handleEventByType(event);
      if (!success) {
        logger.error('Failed to process event', { 
          txHash, 
          eventIndex, 
          eventType: event.type 
        });
        return false;
      }

      // Mark event as processed
      const marked = await this.supabaseService.markEventAsProcessed(txHash, eventIndex);
      if (!marked) {
        logger.error('Failed to mark event as processed', { txHash, eventIndex });
        return false;
      }

      logger.info('Event processed successfully', { 
        txHash, 
        eventIndex, 
        eventType: event.type,
        taskId: (event.data as any).task_id
      });
      return true;

    } catch (error) {
      logger.error('Exception during event processing', { 
        txHash, 
        eventIndex, 
        eventType: event.type, 
        error 
      });
      return false;
    }
  }

  private async handleEventByType(event: ParsedEvent): Promise<boolean> {
    switch (event.type) {
      case 'TaskCreated':
        return await this.handleTaskCreated(event);
      case 'ProofSubmitted':
        return await this.handleProofSubmitted(event);
      case 'TaskPendingRelease':
        return await this.handleTaskPendingRelease(event);
      case 'TaskReleased':
        return await this.handleTaskReleased(event);
      case 'TaskDisputed':
        return await this.handleTaskDisputed(event);
      case 'TaskRefunded':
        return await this.handleTaskRefunded(event);
      default:
        logger.warn('Unknown event type', { eventType: event.type });
        return false;
    }
  }

  // ===== EVENT HANDLERS =====

  private async handleTaskCreated(event: ParsedEvent): Promise<boolean> {
    const data = event.data as TaskCreatedEvent;
    
    try {
      // Create task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        data.payer,
        parseFloat(data.amount),
        data.proof_type,
        TaskStatus.PENDING,
        data.worker,
        data.denom,
        data.description,
        data.endpoint,
        data.deadline_ts,
        data.review_window_secs
      );

      if (!success) {
        logger.error('Failed to create task record', { taskId: data.task_id });
        return false;
      }

      // Get the created task for notifications
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve created task', { taskId: data.task_id });
        return false;
      }

      // Create activity feed entry
      await this.createActivityFeedEntry({
        actor: data.payer,
        verb: ActivityVerb.CREATED_TASK,
        task_id: data.task_id,
        meta: {
          amount: data.amount,
          denom: data.denom,
          proof_type: data.proof_type,
          worker: data.worker
        }
      });

      // Send notification if worker is assigned
      if (data.worker) {
        await this.notificationService.sendTaskCreatedNotification(task);
      }

      return true;

    } catch (error) {
      logger.error('Failed to handle TaskCreated event', { taskId: data.task_id, error });
      return false;
    }
  }

  private async handleProofSubmitted(event: ParsedEvent): Promise<boolean> {
    const data = event.data as ProofSubmittedEvent;
    
    try {
      // Get existing task first
      const existingTask = await this.supabaseService.getTask(data.task_id);
      if (!existingTask) {
        logger.error('Task not found for proof submission', { taskId: data.task_id });
        return false;
      }

      // Update task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        existingTask.payer,
        existingTask.amount,
        existingTask.proof_type,
        TaskStatus.PROOF_SUBMITTED,
        data.worker,
        existingTask.denom,
        existingTask.description,
        existingTask.endpoint,
        existingTask.deadline_ts,
        existingTask.review_window_secs
      );

      if (!success) {
        logger.error('Failed to update task for proof submission', { taskId: data.task_id });
        return false;
      }

      // Get updated task
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve updated task', { taskId: data.task_id });
        return false;
      }

      // Create activity feed entry
      await this.createActivityFeedEntry({
        actor: data.worker,
        verb: ActivityVerb.SUBMITTED_PROOF,
        task_id: data.task_id,
        meta: {
          proof_hash: data.proof_hash,
          proof_url: data.proof_url,
          zk_proof_hash: data.zk_proof_hash
        }
      });

      // Send notifications
      await this.notificationService.sendProofSubmittedNotification(task);

      return true;

    } catch (error) {
      logger.error('Failed to handle ProofSubmitted event', { taskId: data.task_id, error });
      return false;
    }
  }

  private async handleTaskPendingRelease(event: ParsedEvent): Promise<boolean> {
    const data = event.data as TaskPendingReleaseEvent;
    
    try {
      // Get existing task first
      const existingTask = await this.supabaseService.getTask(data.task_id);
      if (!existingTask) {
        logger.error('Task not found for pending release', { taskId: data.task_id });
        return false;
      }

      // Update task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        existingTask.payer,
        existingTask.amount,
        existingTask.proof_type,
        TaskStatus.PENDING_RELEASE,
        existingTask.worker,
        existingTask.denom,
        existingTask.description,
        existingTask.endpoint,
        existingTask.deadline_ts,
        existingTask.review_window_secs
      );

      if (!success) {
        logger.error('Failed to update task for pending release', { taskId: data.task_id });
        return false;
      }

      // Get updated task
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve updated task', { taskId: data.task_id });
        return false;
      }

      // Send notifications
      await this.notificationService.sendPendingReleaseNotification(task);

      return true;

    } catch (error) {
      logger.error('Failed to handle TaskPendingRelease event', { taskId: data.task_id, error });
      return false;
    }
  }

  private async handleTaskReleased(event: ParsedEvent): Promise<boolean> {
    const data = event.data as TaskReleasedEvent;
    
    try {
      // Get existing task first
      const existingTask = await this.supabaseService.getTask(data.task_id);
      if (!existingTask) {
        logger.error('Task not found for release', { taskId: data.task_id });
        return false;
      }

      // Update task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        existingTask.payer,
        existingTask.amount,
        existingTask.proof_type,
        TaskStatus.RELEASED,
        data.worker,
        existingTask.denom,
        existingTask.description,
        existingTask.endpoint,
        existingTask.deadline_ts,
        existingTask.review_window_secs
      );

      if (!success) {
        logger.error('Failed to update task for release', { taskId: data.task_id });
        return false;
      }

      // Get updated task
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve updated task', { taskId: data.task_id });
        return false;
      }

      // Create activity feed entry
      await this.createActivityFeedEntry({
        actor: task.payer,
        verb: ActivityVerb.RELEASED_PAYMENT,
        task_id: data.task_id,
        meta: {
          worker: data.worker,
          amount: data.amount
        }
      });

      // Send notifications
      await this.notificationService.sendTaskReleasedNotification(task);

      return true;

    } catch (error) {
      logger.error('Failed to handle TaskReleased event', { taskId: data.task_id, error });
      return false;
    }
  }

  private async handleTaskDisputed(event: ParsedEvent): Promise<boolean> {
    const data = event.data as TaskDisputedEvent;
    
    try {
      // Get existing task first
      const existingTask = await this.supabaseService.getTask(data.task_id);
      if (!existingTask) {
        logger.error('Task not found for dispute', { taskId: data.task_id });
        return false;
      }

      // Update task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        existingTask.payer,
        existingTask.amount,
        existingTask.proof_type,
        TaskStatus.DISPUTED,
        existingTask.worker,
        existingTask.denom,
        existingTask.description,
        existingTask.endpoint,
        existingTask.deadline_ts,
        existingTask.review_window_secs
      );

      if (!success) {
        logger.error('Failed to update task for dispute', { taskId: data.task_id });
        return false;
      }

      // Get updated task
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve updated task', { taskId: data.task_id });
        return false;
      }

      // Create activity feed entry
      await this.createActivityFeedEntry({
        actor: data.disputer,
        verb: ActivityVerb.DISPUTED_TASK,
        task_id: data.task_id,
        meta: {
          reason: data.reason
        }
      });

      // Send notifications
      await this.notificationService.sendTaskDisputedNotification(task);

      return true;

    } catch (error) {
      logger.error('Failed to handle TaskDisputed event', { taskId: data.task_id, error });
      return false;
    }
  }

  private async handleTaskRefunded(event: ParsedEvent): Promise<boolean> {
    const data = event.data as TaskRefundedEvent;
    
    try {
      // Get existing task first
      const existingTask = await this.supabaseService.getTask(data.task_id);
      if (!existingTask) {
        logger.error('Task not found for refund', { taskId: data.task_id });
        return false;
      }

      // Update task record using SQL function
      const success = await this.supabaseService.upsertTaskFromEvent(
        data.task_id,
        data.payer,
        parseFloat(data.amount),
        existingTask.proof_type,
        TaskStatus.REFUNDED,
        existingTask.worker,
        existingTask.denom,
        existingTask.description,
        existingTask.endpoint,
        existingTask.deadline_ts,
        existingTask.review_window_secs
      );

      if (!success) {
        logger.error('Failed to update task for refund', { taskId: data.task_id });
        return false;
      }

      // Get updated task
      const task = await this.supabaseService.getTask(data.task_id);
      if (!task) {
        logger.error('Failed to retrieve updated task', { taskId: data.task_id });
        return false;
      }

      // Send notifications
      await this.notificationService.sendTaskRefundedNotification(task);

      return true;

    } catch (error) {
      logger.error('Failed to handle TaskRefunded event', { taskId: data.task_id, error });
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  private async createActivityFeedEntry(activity: Omit<ActivityFeedRecord, 'id' | 'created_at'>): Promise<void> {
    try {
      await this.supabaseService.createActivityFeedEntry(activity);
    } catch (error) {
      logger.error('Failed to create activity feed entry', { 
        taskId: activity.task_id, 
        verb: activity.verb, 
        error 
      });
    }
  }

  // ===== PUBLIC METHODS =====

  async getNotificationService(): Promise<NotificationService> {
    return this.notificationService;
  }
}