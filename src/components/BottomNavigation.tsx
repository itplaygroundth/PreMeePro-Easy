import { Package, BarChart3, Settings, Boxes, LucideIcon } from 'lucide-react';

export type TabId = 'dashboard' | 'stock' | 'reports' | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'งาน', icon: Package },
  { id: 'stock', label: 'สต๊อก', icon: Boxes },
  { id: 'reports', label: 'รายงาน', icon: BarChart3 },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

interface BottomNavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  pendingApprovalCount?: number;
}

export function BottomNavigation({ activeTab, setActiveTab, pendingApprovalCount = 0 }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-around px-2 py-2 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const showBadge = item.id === 'settings' && pendingApprovalCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-lg transition-all ${
                active
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  active ? 'bg-blue-100' : ''
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {pendingApprovalCount > 9 ? '9+' : pendingApprovalCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  active ? 'text-blue-700' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
