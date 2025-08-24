import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config';
import { createLogger } from './logger';
import { 
  TaskRecord, 
  NotificationRecord, 
  ActivityFeedRecord, 
  UserRecord,
  ProcessedEvent,
  TaskStatus,
  ProofType,
  NotificationType,
  ActivityVerb
} from './types';

const logger = createLogger('supabase');

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    logger.info('Supabase client initialized');
  }

  // ===== TASK OPERATIONS =====

  async upsertTask(taskData: Partial<TaskRecord>): Promise<TaskRecord | null> {
    try {
      const { data, error } = await this.client
        .from('tasks')
        .upsert(
          {
            ...taskData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Failed to upsert task', { taskId: taskData.id, error: error.message });
        return null;
      }

      logger.info('Task upserted successfully', { taskId: data.id });
      return data;
    } catch (error) {
      logger.error('Exception during task upsert', { taskId: taskData.id, error });
      return null;
    }
  }

  async getTask(taskId: string): Promise<TaskRecord | null> {
    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Task not found
        }
        logger.error('Failed to get task', { taskId, error: error.message });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Exception during task fetch', { taskId, error });
      return null;
    }
  }

  async getExpiredPendingReleaseTasks(): Promise<TaskRecord[]> {
    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('status', TaskStatus.PENDING_RELEASE)
        .lte('pending_release_expires_at', new Date().toISOString());

      if (error) {
        logger.error('Failed to get expired pending release tasks', { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Exception during expired tasks fetch', { error });
      return [];
    }
  }

  // ===== USER OPERATIONS =====

  async getUserByWalletAddress(walletAddress: string): Promise<UserRecord | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        logger.error('Failed to get user', { walletAddress, error: error.message });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Exception during user fetch', { walletAddress, error });
      return null;
    }
  }

  // ===== NOTIFICATION OPERATIONS =====

  async createNotification(notification: NotificationRecord): Promise<NotificationRecord | null> {
    try {
      // Get user ID from wallet address if not provided
      if (!notification.user_id && notification.payload.wallet_address) {
        const user = await this.getUserByWalletAddress(notification.payload.wallet_address);
        if (user) {
          notification.user_id = user.id;
        }
      }

      if (!notification.user_id) {
        logger.warn('Cannot create notification without user_id', { 
          taskId: notification.task_id,
          walletAddress: notification.payload.wallet_address 
        });
        return null;
      }

      const { data, error } = await this.client
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create notification', { 
          taskId: notification.task_id, 
          error: error.message 
        });
        return null;
      }

      logger.info('Notification created successfully', { 
        notificationId: data.id,
        taskId: notification.task_id,
        type: notification.type 
      });
      return data;
    } catch (error) {
      logger.error('Exception during notification creation', { 
        taskId: notification.task_id, 
        error 
      });
      return null;
    }
  }

  // ===== ACTIVITY FEED OPERATIONS =====

  async createActivityFeedEntry(activity: ActivityFeedRecord): Promise<ActivityFeedRecord | null> {
    try {
      const { data, error } = await this.client
        .from('activity_feed')
        .insert({
          ...activity,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create activity feed entry', { 
          taskId: activity.task_id, 
          error: error.message 
        });
        return null;
      }

      logger.info('Activity feed entry created successfully', { 
        activityId: data.id,
        taskId: activity.task_id,
        verb: activity.verb 
      });
      return data;
    } catch (error) {
      logger.error('Exception during activity feed creation', { 
        taskId: activity.task_id, 
        error 
      });
      return null;
    }
  }

  // ===== IDEMPOTENCY OPERATIONS =====

  async isEventProcessed(txHash: string, eventIndex: number): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('processed_events')
        .select('tx_hash')
        .eq('tx_hash', txHash)
        .eq('event_index', eventIndex)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to check processed event', { txHash, eventIndex, error: error.message });
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Exception during processed event check', { txHash, eventIndex, error });
      return false;
    }
  }

  async markEventAsProcessed(txHash: string, eventIndex: number): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('processed_events')
        .insert({
          tx_hash: txHash,
          event_index: eventIndex,
          processed_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to mark event as processed', { 
          txHash, 
          eventIndex, 
          error: error.message 
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Exception during event processing mark', { txHash, eventIndex, error });
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('count', { count: 'exact', head: true });

      if (error) {
        logger.error('Supabase connection test failed', { error: error.message });
        return false;
      }

      logger.info('Supabase connection test successful');
      return true;
    } catch (error) {
      logger.error('Exception during Supabase connection test', { error });
      return false;
    }
  }

  // Get the underlying client for advanced operations
  getClient(): SupabaseClient {
    return this.client;
  }
}