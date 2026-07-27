import { Users, LayoutDashboard, Settings, UserPlus, LogOut, DollarSign, Star, UserCircle, Calendar, Clock } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
  user: { role: string, username: string };
  onLogout: () => void;
}

export default function Sidebar({ currentMenu, setCurrentMenu, user, onLogout }: SidebarProps) {
  const allItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'accountant'] },
    { id: 'profile', label: 'ملفي الشخصي', icon: UserCircle, roles: ['employee'] },
    { id: 'employees', label: 'الموظفون', icon: Users, roles: ['admin', 'accountant'] },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, roles: ['admin', 'accountant', 'employee'] },
    { id: 'leaves', label: 'الإجازات', icon: Calendar, roles: ['admin', 'accountant', 'employee'] },
    { id: 'payroll', label: 'الرواتب', icon: DollarSign, roles: ['admin', 'accountant', 'employee'] },
    { id: 'performance', label: 'تقييم الأداء', icon: Star, roles: ['admin', 'accountant', 'employee'] },
    { id: 'recruitment', label: 'التوظيف', icon: UserPlus, roles: ['admin'] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed right-0 top-0 transition-all border-l border-slate-800 rtl z-20" dir="rtl">
      <div className="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950 px-4">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center ml-3">
          <Users size={20} className="text-white" />
        </div>
        <h1 className="text-white font-bold tracking-wider text-xl">HR System</h1>
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentMenu(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                      : 'hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
