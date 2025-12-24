import { useState, useCallback } from 'react';
import { Notification } from '../components/NotificationBell';

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 50;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    return [];
  });

  const saveToStorage = useCallback((items: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveToStorage(updated);
      return updated;
    });

    return newNotification;
  }, [saveToStorage]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}
