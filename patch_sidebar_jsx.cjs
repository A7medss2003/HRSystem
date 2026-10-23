const fs = require('fs');
let file = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const sidebarJsx = `
  const isElectron = typeof window !== 'undefined' && (window as any).require;
  return (
    <aside className={clsx("bg-white text-slate-600 flex flex-col fixed right-0 transition-all duration-300 border-l border-slate-200 shadow-sm rtl z-20 group", isCollapsed ? "w-24" : "w-72", isElectron ? "top-[108px] h-[calc(100vh-108px)]" : "top-[76px] h-[calc(100vh-76px)]")} dir="rtl">
      
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2 px-4">
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
                    isActive ? 'text-white font-semibold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600 font-medium'
                  )}
                  style={isActive ? { backgroundColor: 'var(--color-primary, #1e40af)' } : {}}
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
`;

file = file.replace(/const isElectron = typeof window !== 'undefined'[\s\S]*\}\);?\n\}/, sidebarJsx);
fs.writeFileSync('src/components/Sidebar.tsx', file);
