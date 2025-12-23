import { LogOut, Info, ChevronRight, Layers, Users } from 'lucide-react';
import { User as UserType } from '../types';
import { TemplatesView } from './TemplatesView';
import { StaffManager } from './StaffManager';
import { useState } from 'react';

interface SettingsViewProps {
  user: UserType;
  onLogout: () => void;
  onDataChanged?: () => void;
}

export function SettingsView({ user, onLogout, onDataChanged }: SettingsViewProps) {
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

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
