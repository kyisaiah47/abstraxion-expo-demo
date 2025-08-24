import * as OneSignal from 'onesignal-node';
import { ONESIGNAL_APP_ID, ONESIGNAL_API_KEY } from './config';
import { createLogger } from './logger';
import { SupabaseService } from './supabase';
import { 
  NotificationRecord, 
  NotificationType, 
  PushNotificationPayload,
  TaskRecord 
} from './types';

const logger = createLogger('notifications');

export class NotificationService {
  private oneSignalClient: OneSignal.Client | null = null;
  private supabaseService: SupabaseService;
  private oneSignalEnabled: boolean = false;

  constructor(supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
    
    // Only initialize OneSignal if credentials are provided
    if (ONESIGNAL_APP_ID && ONESIGNAL_API_KEY && 
        ONESIGNAL_APP_ID !== 'your-onesignal-app-id' && 
        ONESIGNAL_API_KEY !== 'your-onesignal-api-key') {
      try {
        this.oneSignalClient = new OneSignal.Client(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY);
        this.oneSignalEnabled = true;
        logger.info('OneSignal client initialized', { 
          appId: ONESIGNAL_APP_ID.slice(0, 8) + '...' 
        });
      } catch (error) {
        logger.warn('Failed to initialize OneSignal, notifications disabled', { error });
      }
    } else {
      logger.info('OneSignal credentials not provided, notifications disabled');
    }
  }

  // ===== MAIN NOTIFICATION METHODS =====

  async sendTaskCreatedNotification(task: TaskRecord): Promise<void> {
    if (!task.worker) {
      logger.info('Task created without worker, skipping notification', { taskId: task.id });
      return;
    }

    const title = '🎯 New Task Available!';
    const message = `${task.amount} ${task.denom.toUpperCase()} - ${task.description || 'New task request'}`;

    await this.sendNotification({
      walletAddress: task.worker,
      type: NotificationType.TASK_CREATED,
      taskId: task.id,
      title,
      message,
      data: {
        amount: task.amount,
        denom: task.denom,
        proof_type: task.proof_type,
        payer: task.payer
      }
    });
  }

  async sendProofSubmittedNotification(task: TaskRecord): Promise<void> {
    const title = '📋 Proof Submitted!';
    const message = task.proof_type === 'soft' 
      ? 'Worker submitted proof for your task. Review required.'
      : 'Worker submitted proof for your task. Auto-verification in progress.';

    await this.sendNotification({
      walletAddress: task.payer,
      type: NotificationType.PROOF_SUBMITTED,
      taskId: task.id,
      title,
      message,
      data: {
        amount: task.amount,
        denom: task.denom,
        proof_type: task.proof_type,
        worker: task.worker
      }
    });

    // Also notify worker
    if (task.worker) {
      await this.sendNotification({
        walletAddress: task.worker,
        type: NotificationType.PROOF_SUBMITTED,
        taskId: task.id,
        title: '✅ Proof Submitted!',
        message: 'Your proof has been submitted and is under review.',
        data: {
          amount: task.amount,
          denom: task.denom,
          proof_type: task.proof_type
        }
      });
    }
  }

  async sendPendingReleaseNotification(task: TaskRecord): Promise<void> {
    const title = '⏳ Pending Release Started';
    const message = 'Payment will auto-release unless disputed within review window.';

    // Notify payer
    await this.sendNotification({
      walletAddress: task.payer,
      type: NotificationType.PENDING_RELEASE_STARTED,
      taskId: task.id,
      title,
      message,
      data: {
        amount: task.amount,
        denom: task.denom,
        expires_at: task.pending_release_expires_at,
        review_window_secs: task.review_window_secs
      }
    });

    // Notify worker
    if (task.worker) {
      await this.sendNotification({
        walletAddress: task.worker,
        type: NotificationType.PENDING_RELEASE_STARTED,
        taskId: task.id,
        title: '⏳ Auto-Release Started',
        message: 'Payment is pending release. Auto-release in progress.',
        data: {
          amount: task.amount,
          denom: task.denom,
          expires_at: task.pending_release_expires_at
        }
      });
    }
  }

  async sendTaskReleasedNotification(task: TaskRecord): Promise<void> {
    // Notify payer
    await this.sendNotification({
      walletAddress: task.payer,
      type: NotificationType.TASK_RELEASED,
      taskId: task.id,
      title: '💸 Payment Released',
      message: 'Payment has been released to worker.',
      data: {
        amount: task.amount,
        denom: task.denom,
        worker: task.worker
      }
    });

    // Notify worker
    if (task.worker) {
      await this.sendNotification({
        walletAddress: task.worker,
        type: NotificationType.TASK_RELEASED,
        taskId: task.id,
        title: '💰 Payment Received!',
        message: `You received ${task.amount} ${task.denom.toUpperCase()} for completed task.`,
        data: {
          amount: task.amount,
          denom: task.denom,
          payer: task.payer
        }
      });
    }
  }

  async sendTaskDisputedNotification(task: TaskRecord): Promise<void> {
    const title = '⚠️ Task Disputed';

    // Notify payer
    await this.sendNotification({
      walletAddress: task.payer,
      type: NotificationType.TASK_DISPUTED,
      taskId: task.id,
      title,
      message: 'Your dispute has been submitted for review.',
      data: {
        amount: task.amount,
        denom: task.denom,
        worker: task.worker
      }
    });

    // Notify worker
    if (task.worker) {
      await this.sendNotification({
        walletAddress: task.worker,
        type: NotificationType.TASK_DISPUTED,
        taskId: task.id,
        title,
        message: 'Your task has been disputed. Review required.',
        data: {
          amount: task.amount,
          denom: task.denom,
          payer: task.payer
        }
      });
    }
  }

  async sendTaskRefundedNotification(task: TaskRecord): Promise<void> {
    // Notify payer
    await this.sendNotification({
      walletAddress: task.payer,
      type: NotificationType.TASK_REFUNDED,
      taskId: task.id,
      title: '💰 Payment Refunded',
      message: `Your payment of ${task.amount} ${task.denom.toUpperCase()} has been refunded.`,
      data: {
        amount: task.amount,
        denom: task.denom,
        worker: task.worker
      }
    });

    // Notify worker
    if (task.worker) {
      await this.sendNotification({
        walletAddress: task.worker,
        type: NotificationType.TASK_REFUNDED,
        taskId: task.id,
        title: '📋 Task Refunded',
        message: 'Task payment was refunded to payer.',
        data: {
          amount: task.amount,
          denom: task.denom,
          payer: task.payer
        }
      });
    }
  }

  // ===== CORE NOTIFICATION LOGIC =====

  private async sendNotification(params: {
    walletAddress: string;
    type: NotificationType;
    taskId: string;
    title: string;
    message: string;
    data: Record<string, any>;
  }): Promise<void> {
    const { walletAddress, type, taskId, title, message, data } = params;

    try {
      // 1. Create notification record in Supabase
      const notification: NotificationRecord = {
        type,
        task_id: taskId,
        title,
        message,
        payload: {
          wallet_address: walletAddress,
          ...data
        }
      };

      const createdNotification = await this.supabaseService.createNotification(notification);
      if (!createdNotification) {
        logger.error('Failed to create notification record', { walletAddress, taskId, type });
        return;
      }

      // 2. Send push notification via OneSignal
      await this.sendPushNotification({
        walletAddress,
        title,
        message,
        data: {
          type,
          task_id: taskId,
          notification_id: createdNotification.id!,
          ...data
        }
      });

      logger.info('Notification sent successfully', { 
        walletAddress: walletAddress.slice(0, 8) + '...',
        taskId,
        type,
        title 
      });

    } catch (error) {
      logger.error('Failed to send notification', { 
        walletAddress, 
        taskId, 
        type, 
        error 
      });
    }
  }

  private async sendPushNotification(params: {
    walletAddress: string;
    title: string;
    message: string;
    data: Record<string, any>;
  }): Promise<void> {
    const { walletAddress, title, message, data } = params;

    // Skip if OneSignal is not enabled
    if (!this.oneSignalEnabled || !this.oneSignalClient) {
      logger.debug('Push notification skipped (OneSignal not configured)', { 
        walletAddress: walletAddress.slice(0, 8) + '...',
        title 
      });
      return;
    }

    try {
      // Use wallet address as external user ID
      const payload: PushNotificationPayload = {
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [walletAddress],
        headings: { en: title },
        contents: { en: message },
        data
      };

      const response = await this.oneSignalClient.createNotification(payload);
      
      if (response.body.errors && response.body.errors.length > 0) {
        logger.error('OneSignal API errors', { 
          walletAddress: walletAddress.slice(0, 8) + '...',
          errors: response.body.errors 
        });
        return;
      }

      logger.debug('Push notification sent via OneSignal', { 
        walletAddress: walletAddress.slice(0, 8) + '...',
        notificationId: response.body.id,
        recipients: response.body.recipients 
      });

    } catch (error) {
      logger.error('Failed to send push notification', { 
        walletAddress: walletAddress.slice(0, 8) + '...',
        error 
      });
    }
  }

  // ===== UTILITY METHODS =====

  async testNotification(walletAddress: string): Promise<boolean> {
    if (!this.oneSignalEnabled) {
      logger.info('Test notification skipped (OneSignal not configured)', { 
        walletAddress: walletAddress.slice(0, 8) + '...' 
      });
      return true; // Return true for development purposes
    }

    try {
      await this.sendPushNotification({
        walletAddress,
        title: '🧪 Test Notification',
        message: 'ProofPay indexer is working correctly!',
        data: {
          type: 'test',
          task_id: 'test_task_001',
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Test notification sent', { walletAddress: walletAddress.slice(0, 8) + '...' });
      return true;
    } catch (error) {
      logger.error('Failed to send test notification', { walletAddress, error });
      return false;
    }
  }
}