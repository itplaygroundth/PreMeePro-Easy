import { LogOut, Info, ChevronRight, Layers, Users, Bell, Smartphone } from 'lucide-react';
import { User as UserType } from '../types';
import { TemplatesView } from './TemplatesView';
import { StaffManager } from './StaffManager';
import { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import Swal from 'sweetalert2';

interface SettingsViewProps {
  user: UserType;
  onLogout: () => void;
  onDataChanged?: () => void;
}

interface TokenInfo {
  id: string;
  platform: string;
  type: string;
  endpoint: string;
  created_at: string;
  last_used: string;
}

export function SettingsView({ user, onLogout, onDataChanged }: SettingsViewProps) {
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [tokensInfo, setTokensInfo] = useState<{ tokensCount: number; tokens: TokenInfo[] } | null>(null);
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch push tokens info on mount
  useEffect(() => {
    const fetchTokensInfo = async () => {
      try {
        const info = await notificationService.getPushTokensInfo();
        setTokensInfo(info);
      } catch (error) {
        console.error('Failed to fetch tokens info:', error);
      }
    };
    fetchTokensInfo();
  }, []);

  // Test push notification
  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const result = await notificationService.testPushNotification();
      Swal.fire({
        icon: 'success',
        title: 'ส่งทดสอบแล้ว',
        text: `ส่งไปยัง ${result.tokensCount} อุปกรณ์`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Test push failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถส่งได้',
        text: error.response?.data?.error || error.response?.data?.hint || error.message,
      });
    } finally {
      setTestingPush(false);
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {userInitial}
          </div>
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">จัดการพนักงาน</p>
                <p className="text-sm text-gray-400">เพิ่ม แก้ไข หรือลบพนักงาน</p>
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
            การแจ้งเตือน
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Registered devices info */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">อุปกรณ์ที่ลงทะเบียน</p>
              <p className="text-sm text-gray-400">
                {tokensInfo ? `${tokensInfo.tokensCount} อุปกรณ์` : 'กำลังโหลด...'}
              </p>
              {tokensInfo && tokensInfo.tokens.length > 0 && (
                <div className="mt-2 space-y-1">
                  {tokensInfo.tokens.map((t) => (
                    <div key={t.id} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.type === 'WebPush' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {t.type}
                      </span>
                      <span>{t.platform}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleTestPush}
            disabled={testingPush}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {testingPush ? 'กำลังส่ง...' : 'ทดสอบ Push Notification'}
              </p>
              <p className="text-sm text-gray-400">
                ส่งไปยังทุกอุปกรณ์ ({tokensInfo?.tokensCount || 0} อุปกรณ์)
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
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
              <p className="font-medium text-gray-800">PreMeePro Easy</p>
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
