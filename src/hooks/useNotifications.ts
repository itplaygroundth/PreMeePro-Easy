import { useState, useCallback, useEffect, useRef } from 'react';
import { Notification } from '../components/NotificationBell';
import { inAppNotificationService } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const MAX_NOTIFICATIONS = 50;

// notification_queue table structure
interface ServerNotification {
  id: string;
  type: string;
  title: string;
  body: string; // notification_queue uses 'body' instead of 'message'
  message?: string; // API returns 'message' (mapped from body)
  data: Record<string, any> | null;
  sent: boolean; // notification_queue uses 'sent' as 'read'
  read?: boolean; // API returns 'read' (mapped from sent)
  created_at: string;
}

function mapServerToClient(n: ServerNotification): Notification {
  return {
    id: n.id,
    type: n.type as Notification['type'],
    title: n.title,
    // Handle both API response (message) and realtime payload (body)
    message: n.message || n.body || '',
    // Handle both API response (read) and realtime payload (sent)
    read: n.read ?? n.sent ?? false,
    timestamp: new Date(n.created_at),
    data: n.data || {},
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await inAppNotificationService.getAll(MAX_NOTIFICATIONS);
      if (isMounted.current && response.data) {
        setNotifications(response.data.map(mapServerToClient));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and realtime subscription
  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();

    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;

    if (!userId) {
      console.warn('No user ID for notification subscription');
      return;
    }

    // Subscribe to realtime changes for notification_queue
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<ServerNotification>) => {
          console.log('New notification received:', payload);
          const newNotif = mapServerToClient(payload.new as ServerNotification);
          setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<ServerNotification>) => {
          const updated = mapServerToClient(payload.new as ServerNotification);
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<ServerNotification>) => {
          const deletedId = (payload.old as ServerNotification).id;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await inAppNotificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await inAppNotificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearNotification = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await inAppNotificationService.delete(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearAll = useCallback(async () => {
    // Optimistic update
    setNotifications([]);
    try {
      await inAppNotificationService.deleteAll();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}
