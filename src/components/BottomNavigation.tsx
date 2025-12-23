import { Package, BarChart3, Settings, LucideIcon } from 'lucide-react';

export type TabId = 'dashboard' | 'reports' | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'งาน', icon: Package },
  { id: 'reports', label: 'รายงาน', icon: BarChart3 },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

interface BottomNavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, setActiveTab }: BottomNavigationProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;

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
                className={`p-1.5 rounded-xl transition-all ${
                  active ? 'bg-blue-100' : ''
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
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
