import { LogOut, Info, ChevronRight, Layers, Users, Bell, MessageCircle, RefreshCw, Smartphone } from 'lucide-react';
import { User as UserType } from '../types';
import { TemplatesView } from './TemplatesView';
import { StaffManager } from './StaffManager';
import { useState, useEffect } from 'react';
import { lineOAService, notificationSettingsService, authService } from '../services/api';
import Swal from 'sweetalert2';

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled, loading }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } ${loading ? 'opacity-50' : ''}`}
      />
    </button>
  );
}

interface SettingsViewProps {
  user: UserType;
  onLogout: () => void;
  onDataChanged?: () => void;
}

interface LineOAStatus {
  configured: boolean;
  usersCount: number;
  users: Array<{
    id: string;
    line_user_id: string;
    display_name: string;
    picture_url?: string;
  }>;
}

interface NotificationSettings {
  line: { enabled: boolean; connected: boolean };
  webPush: { enabled: boolean; hasTokens: boolean };
}

export function SettingsView({ user, onLogout, onDataChanged }: SettingsViewProps) {
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [lineStatus, setLineStatus] = useState<LineOAStatus | null>(null);
  const [lineLoading, setLineLoading] = useState(false);
  const [testingLine, setTestingLine] = useState(false);
  const [notifySettings, setNotifySettings] = useState<NotificationSettings | null>(null);
  const [togglingLine, setTogglingLine] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch LINE OA status and notification settings on mount
  useEffect(() => {
    const fetchLineStatus = async () => {
      try {
        const status = await lineOAService.getStatus();
        setLineStatus(status);
      } catch (error) {
        console.error('Failed to fetch LINE status:', error);
      }
    };
    const fetchNotifySettings = async () => {
      try {
        const settings = await notificationSettingsService.getSettings();
        setNotifySettings(settings);
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      }
    };
    const fetchPendingUsers = async () => {
      if (!isAdmin) return;
      try {
        const pendingUsers = await authService.getPendingLineUsers();
        setPendingUsersCount(pendingUsers.length);
      } catch (error) {
        console.error('Failed to fetch pending users:', error);
      }
    };
    fetchLineStatus();
    fetchNotifySettings();
    fetchPendingUsers();
  }, [isAdmin]);

  // Refresh LINE status
  const refreshLineStatus = async () => {
    setLineLoading(true);
    try {
      const status = await lineOAService.getStatus();
      setLineStatus(status);
    } catch (error) {
      console.error('Failed to refresh LINE status:', error);
    } finally {
      setLineLoading(false);
    }
  };

  // Test LINE notification
  const handleTestLine = async () => {
    setTestingLine(true);
    try {
      const result = await lineOAService.testNotification();
      Swal.fire({
        icon: 'success',
        title: 'ส่งทดสอบแล้ว',
        text: `ส่งไปยัง ${result.sent} คน`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถส่งได้',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setTestingLine(false);
    }
  };

  // Toggle LINE notification
  const handleToggleLine = async (enabled: boolean) => {
    setTogglingLine(true);
    try {
      await notificationSettingsService.updateSetting('line', enabled);
      setNotifySettings((prev) =>
        prev ? { ...prev, line: { ...prev.line, enabled } } : null
      );
    } catch (error: any) {
      console.error('Failed to toggle LINE:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setTogglingLine(false);
    }
  };

  // Toggle Web Push notification
  const handleTogglePush = async (enabled: boolean) => {
    setTogglingPush(true);
    try {
      await notificationSettingsService.updateSetting('webPush', enabled);
      setNotifySettings((prev) =>
        prev ? { ...prev, webPush: { ...prev.webPush, enabled } } : null
      );
    } catch (error: any) {
      console.error('Failed to toggle Web Push:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message,
      });
    } finally {
      setTogglingPush(false);
    }
  };

  // If showing staff manager, render StaffManager
  if (showStaffManager) {
    return <StaffManager onBack={() => setShowStaffManager(false)} />;
  }

  // If showing templates manager, render TemplatesView
  if (showTemplatesManager) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowTemplatesManager(false)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          กลับไปตั้งค่า
        </button>
        <TemplatesView onDataChanged={onDataChanged} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {user?.picture_url ? (
            <img
              src={user.picture_url}
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {userInitial}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{displayName}</h2>
            <p className="text-sm text-gray-500">{user?.email || '-'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {user?.role || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Production Template Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            จัดการการผลิต
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          <button
            onClick={() => setShowTemplatesManager(true)}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">รูปแบบการผลิต</p>
              <p className="text-sm text-gray-400">จัดการ template ขั้นตอนการผลิต</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          {/* Staff Management - Admin only */}
          {isAdmin && (
            <button
              onClick={() => setShowStaffManager(true)}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center relative">
                <Users className="w-5 h-5 text-blue-600" />
                {pendingUsersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {pendingUsersCount}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">จัดการพนักงาน</p>
                <p className="text-sm text-gray-400">
                  {pendingUsersCount > 0
                    ? <span className="text-orange-500 font-medium">{pendingUsersCount} คนรออนุมัติ</span>
                    : 'เพิ่ม แก้ไข หรือลบพนักงาน'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            ตั้งค่าการแจ้งเตือน
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Web Push Toggle */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              notifySettings?.webPush?.enabled ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Smartphone className={`w-5 h-5 ${
                notifySettings?.webPush?.enabled ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Web Push</p>
              <p className="text-sm text-gray-400">
                {notifySettings?.webPush?.hasTokens
                  ? 'แจ้งเตือนผ่าน Browser'
                  : 'ยังไม่มีการลงทะเบียน'}
              </p>
            </div>
            <ToggleSwitch
              enabled={notifySettings?.webPush?.enabled ?? false}
              onChange={handleTogglePush}
              loading={togglingPush}
              disabled={!notifySettings?.webPush?.hasTokens}
            />
          </div>

          {/* LINE Toggle */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              notifySettings?.line?.enabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MessageCircle className={`w-5 h-5 ${
                notifySettings?.line?.enabled ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">LINE</p>
              <p className="text-sm text-gray-400">
                {lineStatus?.usersCount
                  ? `${lineStatus.usersCount} คนรับการแจ้งเตือน`
                  : 'Add friend LINE OA เพื่อรับการแจ้งเตือน'}
              </p>
            </div>
            <ToggleSwitch
              enabled={notifySettings?.line?.enabled ?? false}
              onChange={handleToggleLine}
              loading={togglingLine}
              disabled={!lineStatus?.configured}
            />
          </div>
        </div>
      </div>

      {/* LINE Official Account Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            LINE Official Account
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* LINE OA Status */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              lineStatus?.configured ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MessageCircle className={`w-5 h-5 ${
                lineStatus?.configured ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {lineStatus === null ? 'กำลังโหลด...' :
                 lineStatus.configured ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า'}
              </p>
              <p className="text-sm text-gray-400">
                {lineStatus?.usersCount
                  ? `${lineStatus.usersCount} คนรับการแจ้งเตือน`
                  : 'Add friend LINE OA เพื่อรับการแจ้งเตือน'}
              </p>
            </div>
            {lineStatus?.configured && lineStatus.usersCount > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {lineStatus.usersCount} คน
              </span>
            )}
          </div>

          {/* Registered Users */}
          {lineStatus?.users && lineStatus.users.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 mb-2">ผู้ใช้ที่ลงทะเบียน:</p>
              <div className="flex flex-wrap gap-2">
                {lineStatus.users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                    {u.picture_url && (
                      <img src={u.picture_url} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    <span className="text-xs text-gray-600">{u.display_name}</span>
                  </div>
                ))}
                {lineStatus.users.length > 5 && (
                  <span className="text-xs text-gray-400">+{lineStatus.users.length - 5} คน</span>
                )}
              </div>
            </div>
          )}

          {/* Test LINE Button */}
          {lineStatus?.configured && lineStatus.usersCount > 0 && (
            <button
              onClick={handleTestLine}
              disabled={testingLine}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {testingLine ? 'กำลังส่ง...' : 'ทดสอบ LINE'}
                </p>
                <p className="text-sm text-gray-400">ส่งข้อความทดสอบไปยัง {lineStatus.usersCount} คน</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          )}

          {/* Refresh Status Button */}
          <button
            onClick={refreshLineStatus}
            disabled={lineLoading}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 text-blue-600 ${lineLoading ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {lineLoading ? 'กำลังรีเฟรช...' : 'รีเฟรชสถานะ'}
              </p>
              <p className="text-sm text-gray-400">ตรวจสอบจำนวนผู้ใช้ใหม่</p>
            </div>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            เกี่ยวกับแอป
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">SmartFab</p>
              <p className="text-sm text-gray-400">เวอร์ชัน 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-4 rounded-2xl transition"
      >
        <LogOut className="w-5 h-5" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
}
