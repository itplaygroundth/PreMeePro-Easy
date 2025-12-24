import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'job_new' | 'job_update' | 'job_completed' | 'job_cancelled' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    jobId?: string;
    orderNumber?: string;
    stepName?: string;
  };
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
  onClearAll,
  onNotificationClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job_new':
        return '🎉';
      case 'job_update':
        return '🔔';
      case 'job_completed':
        return '✅';
      case 'job_cancelled':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'job_new':
        return 'bg-green-50 border-l-green-500';
      case 'job_update':
        return 'bg-blue-50 border-l-blue-500';
      case 'job_completed':
        return 'bg-emerald-50 border-l-emerald-500';
      case 'job_cancelled':
        return 'bg-red-50 border-l-red-500';
      default:
        return 'bg-gray-50 border-l-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition active:scale-95"
        title="การแจ้งเตือน"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-500'}`} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-800">การแจ้งเตือน</span>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
                  title="อ่านทั้งหมด"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-500"
                  title="ล้างทั้งหมด"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative flex items-start gap-3 p-3 cursor-pointer transition hover:bg-gray-50 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <span className="text-lg shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                    )}

                    {/* Clear button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClear(notification.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
