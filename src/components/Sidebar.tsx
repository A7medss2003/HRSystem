import { useStore } from '../store';
import { Users, LayoutDashboard, Settings, UserPlus, LogOut, DollarSign, Star, UserCircle, Calendar, Clock, Shield, Monitor, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
  user: { role: string, username: string, permissions: string[] };
  onLogout: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export default function Sidebar({ currentMenu, setCurrentMenu, user, onLogout, isCollapsed, toggleCollapse }: SidebarProps) {
  const { systemSettings } = useStore();
  const allItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'accountant', 'developer'], perm: 'view_dashboard' },
    { id: 'employees', label: 'الموظفون', icon: Users, roles: ['admin', 'accountant', 'developer'], perm: 'manage_employees' },
    { id: 'attendance', label: 'الحضور والانصراف', icon: Clock, roles: ['admin', 'accountant', 'employee', 'developer'], perm: 'manage_attendance' },
    { id: 'leaves', label: 'الإجازات', icon: Calendar, roles: ['admin', 'accountant', 'employee', 'developer'], perm: 'manage_leaves' },
    { id: 'recruitment', label: 'التوظيف', icon: UserPlus, roles: ['admin', 'developer'], perm: 'all' },
    { id: 'roles', label: 'الصلاحيات', icon: Shield, roles: ['admin', 'developer'], perm: 'all' },
    
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'developer'], perm: 'manage_settings' },
    { id: 'dev_settings', label: 'إعدادات المطور', icon: Monitor, roles: ['developer'], perm: 'all' },
  ];

  const menuItems = allItems.filter(item => {
    if (item.id === 'dev_settings' && user.role !== 'developer') return false;
    // Admins and full-permission users have access to everything (except dev_settings if not dev)
    if (user.role === 'admin' || user.role === 'developer' || user.permissions?.includes('all')) return true;
    
    // Explicit permission granted for this section
    if (item.perm && user.permissions?.includes(item.perm)) return true;
    if (item.id === 'employees' && user.permissions?.includes('add_employee')) return true;

    // Standard roles for regular items (Settings and Dashboard require explicit permission or admin)
    if (item.id !== 'settings' && item.id !== 'dashboard' && item.roles.includes(user.role)) return true;
    
    return false;
  });

  const customLogo = localStorage.getItem('app_logo');
  const isElectron = typeof window !== 'undefined' && (window as any).require;


  return (
    <aside className={clsx("bg-white text-slate-600 flex flex-col fixed right-0 transition-all duration-300 border-l border-slate-200 shadow-sm rtl z-20 group", isCollapsed ? "w-24" : "w-72", isElectron ? "top-8 h-[calc(100vh-2rem)]" : "top-0 h-screen")} dir="rtl">
      
      {/* Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute -left-3.5 top-5 bg-white text-slate-600 border border-slate-200 rounded-full p-1.5 z-30 shadow-md hover:bg-blue-50 transition-all cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={clsx("h-[76px] flex items-center border-b border-slate-200 bg-white transition-all duration-300 overflow-hidden", isCollapsed ? "px-2 justify-center" : "px-5")}>
        <div className={clsx("bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden p-1 shrink-0 transition-all duration-300", isCollapsed ? "w-12 h-12 ml-0" : "w-12 h-12 ml-3")}>
          <img src={customLogo || `${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain drop-shadow-md scale-95" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <Users size={24} className="text-slate-600 hidden" />
        </div>
        {!isCollapsed && <h1 className="text-slate-800 font-bold text-base md:text-lg leading-snug line-clamp-2">{systemSettings?.companyName || 'مركز البنيان للتقنية و الصناعات الهندسية'}</h1>}
      </div>
      
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-3 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;
            return (
              <li key={item.id} title={isCollapsed ? item.label : undefined}>
                <button
                  onClick={() => setCurrentMenu(item.id)}
                  className={clsx(
                    'w-full flex items-center rounded-lg transition-all duration-200',
                    isCollapsed ? 'justify-center p-4' : 'gap-4 px-5 py-4',
                    isActive ? 'text-white font-semibold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm text-slate-600 font-medium'
                  )}
                  style={isActive ? { backgroundColor: 'var(--color-primary, #243f63)' } : {}}
                >
                  <Icon size={isCollapsed ? 28 : 24} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 shrink-0'} />
                  {!isCollapsed && <span className="whitespace-nowrap text-[15px]">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={clsx("p-5 border-t border-slate-200", isCollapsed ? "flex justify-center" : "")}>
        <button 
          onClick={onLogout} 
          title={isCollapsed ? 'تسجيل الخروج' : undefined}
          className={clsx(
            "flex items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors",
            isCollapsed ? "justify-center p-4" : "w-full gap-4 px-5 py-4 text-[15px]"
          )}
        >
          <LogOut size={isCollapsed ? 28 : 24} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
