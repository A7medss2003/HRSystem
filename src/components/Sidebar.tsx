import { Users, LayoutDashboard, Settings, UserPlus, LogOut, DollarSign, Star, UserCircle, Calendar, Clock, Shield, Monitor, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
  user: { role: string, username: string };
  onLogout: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function Sidebar({ currentMenu, setCurrentMenu, user, onLogout, isCollapsed, toggleCollapse }: SidebarProps) {
  const allItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'accountant', 'developer'] },
    { id: 'employees', label: 'الموظفون', icon: Users, roles: ['admin', 'accountant', 'developer'] },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, roles: ['admin', 'accountant', 'employee', 'developer'] },
    { id: 'leaves', label: 'الإجازات', icon: Calendar, roles: ['admin', 'accountant', 'employee', 'developer'] },
    { id: 'recruitment', label: 'التوظيف', icon: UserPlus, roles: ['admin', 'developer'] },
    { id: 'roles', label: 'الصلاحيات', icon: Shield, roles: ['admin', 'developer'] },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'accountant', 'employee', 'developer'] },
    { id: 'dev_settings', label: 'إعدادات المطور', icon: Monitor, roles: ['developer'] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(user.role));
  const customLogo = localStorage.getItem('app_logo');

  return (
    <aside className={clsx("bg-slate-900 text-slate-300 flex flex-col h-screen fixed right-0 top-0 transition-all duration-300 border-l border-slate-800 rtl z-20 group", isCollapsed ? "w-20" : "w-64")} dir="rtl">
      
      {/* Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -left-3 top-6 bg-blue-600 text-white rounded-full p-1 z-30 shadow-lg hover:bg-blue-500 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={clsx("h-16 flex items-center border-b border-slate-800 bg-slate-950 transition-all duration-300 overflow-hidden", isCollapsed ? "px-2 justify-center" : "px-4")}>
        <div className={clsx("bg-white/10 rounded-lg flex items-center justify-center overflow-hidden p-1 shrink-0 transition-all duration-300", isCollapsed ? "w-10 h-10 ml-0" : "w-10 h-10 ml-3")}>
          <img src={customLogo || `${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <Users size={20} className="text-white hidden" />
        </div>
        {!isCollapsed && <h1 className="text-white font-bold tracking-wider text-xl leading-tight whitespace-nowrap overflow-hidden">مركز البنيان</h1>}
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            return (
              <li key={item.id} title={isCollapsed ? item.label : undefined}>
                <button
                  onClick={() => setCurrentMenu(item.id)}
                  className={clsx(
                    'w-full flex items-center rounded-lg transition-all duration-200',
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                      : 'hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon size={isCollapsed ? 24 : 20} className={isActive ? 'text-blue-500' : 'text-slate-400 shrink-0'} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={clsx("p-4 border-t border-slate-800", isCollapsed ? "flex justify-center" : "")}>
        <button 
          onClick={onLogout} 
          title={isCollapsed ? 'تسجيل الخروج' : undefined}
          className={clsx(
            "flex items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors",
            isCollapsed ? "justify-center p-3" : "w-full gap-3 px-4 py-3"
          )}
        >
          <LogOut size={isCollapsed ? 24 : 20} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
