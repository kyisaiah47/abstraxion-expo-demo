import cron from 'node-cron';
import { createLogger } from './logger';
import { SupabaseService } from './supabase';
import { NotificationService } from './notifications';
import { TaskRecord, TaskStatus, CronJobResult } from './types';

const logger = createLogger('timerWorker');

export class TimerWorker {
  private supabaseService: SupabaseService;
  private notificationService: NotificationService;
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(supabaseService: SupabaseService, notificationService: NotificationService) {
    this.supabaseService = supabaseService;
    this.notificationService = notificationService;
    
    logger.info('Timer worker initialized');
  }

  // ===== CRON JOB MANAGEMENT =====

  start(): void {
    if (this.isRunning) {
      logger.warn('Timer worker is already running');
      return;
    }

    // Run every minute to check for expired pending release tasks
    this.cronJob = cron.schedule('*/1 * * * *', async () => {
      await this.processExpiredTasks();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.isRunning = true;
    logger.info('Timer worker started - checking for expired tasks every minute');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
    }
    
    this.isRunning = false;
    logger.info('Timer worker stopped');
  }

  getStatus(): { running: boolean; nextRun?: string } {
    const status = { running: this.isRunning };
    
    if (this.cronJob && this.isRunning) {
      return {
        ...status,
        nextRun: new Date(Date.now() + 60000).toISOString() // Next minute
      };
    }
    
    return status;
  }

  // ===== TASK PROCESSING =====

  async processExpiredTasks(): Promise<CronJobResult> {
    const startTime = Date.now();
    const result: CronJobResult = {
      processed: 0,
      errors: 0,
      details: []
    };

    try {
      logger.info('Starting expired tasks processing');

      // Get all expired pending release tasks
      const expiredTasks = await this.supabaseService.getExpiredPendingReleaseTasks();
      
      if (expiredTasks.length === 0) {
        logger.debug('No expired pending release tasks found');
        return result;
      }

      logger.info(`Found ${expiredTasks.length} expired pending release tasks`);

      // Process each expired task
      for (const task of expiredTasks) {
        try {
          const success = await this.processExpiredTask(task);
          
          result.details.push({
            task_id: task.id,
            success,
            error: success ? undefined : 'Failed to trigger auto-release'
          });

          if (success) {
            result.processed++;
          } else {
            result.errors++;
          }

        } catch (error) {
          logger.error('Exception processing expired task', { taskId: task.id, error });
          
          result.errors++;
          result.details.push({
            task_id: task.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.logCronJob('processExpiredTasks', result.processed, {
        errors: result.errors,
        duration: `${duration}ms`,
        totalTasks: expiredTasks.length
      });

      return result;

    } catch (error) {
      logger.error('Exception during expired tasks processing', { error });
      result.errors = 1;
      result.details.push({
        task_id: 'SYSTEM',
        success: false,
        error: error instanceof Error ? error.message : 'System error'
      });
      return result;
    }
  }

  private async processExpiredTask(task: TaskRecord): Promise<boolean> {
    const { id: taskId, payer, worker, amount, denom } = task;

    try {
      logger.info('Processing expired pending release task', { 
        taskId,
        expiresAt: task.pending_release_expires_at,
        currentTime: new Date().toISOString()
      });

      // Update task status to released
      const updateData: Partial<TaskRecord> = {
        id: taskId,
        status: TaskStatus.RELEASED,
        updated_at: new Date().toISOString()
      };

      const updatedTask = await this.supabaseService.upsertTask(updateData);
      if (!updatedTask) {
        logger.error('Failed to update expired task to released status', { taskId });
        return false;
      }

      // Send notifications about auto-release
      await this.sendAutoReleaseNotifications(updatedTask);

      logger.info('Successfully auto-released expired task', { 
        taskId,
        payer: payer.slice(0, 8) + '...',
        worker: worker?.slice(0, 8) + '...',
        amount,
        denom
      });

      return true;

    } catch (error) {
      logger.error('Failed to process expired task', { taskId, error });
      return false;
    }
  }

  // ===== NOTIFICATION METHODS =====

  private async sendAutoReleaseNotifications(task: TaskRecord): Promise<void> {
    try {
      // Use the existing task released notification method
      // but add a note that this was an auto-release
      await this.notificationService.sendTaskReleasedNotification(task);

      logger.info('Auto-release notifications sent', { 
        taskId: task.id,
        payer: task.payer.slice(0, 8) + '...',
        worker: task.worker?.slice(0, 8) + '...'
      });

    } catch (error) {
      logger.error('Failed to send auto-release notifications', { 
        taskId: task.id, 
        error 
      });
    }
  }

  // ===== MANUAL OPERATIONS =====

  async runManualCheck(): Promise<CronJobResult> {
    logger.info('Running manual expired tasks check');
    return await this.processExpiredTasks();
  }

  async checkSpecificTask(taskId: string): Promise<boolean> {
    try {
      const task = await this.supabaseService.getTask(taskId);
      if (!task) {
        logger.warn('Task not found for manual check', { taskId });
        return false;
      }

      if (task.status !== TaskStatus.PENDING_RELEASE) {
        logger.info('Task is not in pending release status', { taskId, status: task.status });
        return false;
      }

      if (!task.pending_release_expires_at) {
        logger.warn('Task has no expiration time set', { taskId });
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(task.pending_release_expires_at);

      if (now <= expiresAt) {
        logger.info('Task has not expired yet', { 
          taskId,
          expiresAt: expiresAt.toISOString(),
          currentTime: now.toISOString()
        });
        return false;
      }

      logger.info('Processing manually checked expired task', { taskId });
      return await this.processExpiredTask(task);

    } catch (error) {
      logger.error('Exception during manual task check', { taskId, error });
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  async getUpcomingExpirations(withinMinutes: number = 60): Promise<TaskRecord[]> {
    try {
      const futureTime = new Date(Date.now() + (withinMinutes * 60 * 1000));
      
      const { data, error } = await this.supabaseService.getClient()
        .from('tasks')
        .select('*')
        .eq('status', TaskStatus.PENDING_RELEASE)
        .lte('pending_release_expires_at', futureTime.toISOString())
        .gt('pending_release_expires_at', new Date().toISOString());

      if (error) {
        logger.error('Failed to get upcoming expirations', { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Exception getting upcoming expirations', { error });
      return [];
    }
  }
}