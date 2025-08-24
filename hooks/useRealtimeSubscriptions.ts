import { useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type TaskRealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

export type NotificationRealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

interface RealtimeSubscriptionCallbacks {
  onTaskUpdate?: (payload: TaskRealtimePayload) => void;
  onTaskInsert?: (payload: TaskRealtimePayload) => void;
  onNotificationInsert?: (payload: NotificationRealtimePayload) => void;
  onActivityFeedInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export const useRealtimeSubscriptions = (callbacks: RealtimeSubscriptionCallbacks) => {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.walletAddress) {
      return;
    }

    // Create a single channel for all subscriptions
    const channel = supabase.channel('proofpay-realtime', {
      config: {
        broadcast: { self: true },
      },
    });

    // Subscribe to tasks table changes
    if (callbacks.onTaskUpdate || callbacks.onTaskInsert) {
      // Listen to tasks where user is payer or worker
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `or(payer.eq.${user.walletAddress},worker.eq.${user.walletAddress})`,
        },
        (payload: TaskRealtimePayload) => {
          console.log('Task updated:', payload);
          callbacks.onTaskUpdate?.(payload);
        }
      );

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `or(payer.eq.${user.walletAddress},worker.eq.${user.walletAddress})`,
        },
        (payload: TaskRealtimePayload) => {
          console.log('Task created:', payload);
          callbacks.onTaskInsert?.(payload);
        }
      );
    }

    // Subscribe to notifications for this user
    if (callbacks.onNotificationInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id.eq.${user.id}`, // Assumes user has an ID
        },
        (payload: NotificationRealtimePayload) => {
          console.log('New notification:', payload);
          callbacks.onNotificationInsert?.(payload);
        }
      );
    }

    // Subscribe to activity feed
    if (callbacks.onActivityFeedInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('New activity:', payload);
          callbacks.onActivityFeedInsert?.(payload);
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscriptions active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime subscription error');
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.walletAddress, user?.id, callbacks]);

  // Return subscription status and manual refresh function
  return {
    isSubscribed: channelRef.current?.state === 'joined',
    refreshSubscriptions: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        // Re-trigger useEffect by updating dependency
      }
    },
  };
};

// Specific hook for task-related subscriptions
export const useTaskSubscriptions = () => {
  const { user } = useAuth();

  return useRealtimeSubscriptions({
    onTaskUpdate: (payload) => {
      // Broadcast task update to other components via event system
      const event = new CustomEvent('taskUpdate', { 
        detail: { task: payload.new, eventType: payload.eventType } 
      });
      window.dispatchEvent?.(event);
    },
    onTaskInsert: (payload) => {
      // Broadcast new task to other components
      const event = new CustomEvent('taskInsert', { 
        detail: { task: payload.new, eventType: payload.eventType } 
      });
      window.dispatchEvent?.(event);
    },
  });
};

// Specific hook for notification subscriptions  
export const useNotificationSubscriptions = () => {
  const { user } = useAuth();

  return useRealtimeSubscriptions({
    onNotificationInsert: (payload) => {
      // Show notification toast or update notification badge
      const event = new CustomEvent('newNotification', { 
        detail: { notification: payload.new } 
      });
      window.dispatchEvent?.(event);
    },
  });
};