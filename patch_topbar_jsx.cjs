const fs = require('fs');
let file = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

const customLogo = `localStorage.getItem('app_logo') || import.meta.env.BASE_URL + 'logo.png'`;

const topbarJsx = `
  const { systemSettings } = useStore();
  const customLogo = localStorage.getItem('app_logo');

  return (
    <header className="h-[76px] sticky top-0 z-50 flex items-center justify-between px-6 shadow-md" style={{ backgroundColor: 'var(--color-primary, #1e40af)', color: 'white' }} dir="rtl">
      
      {/* Right side: Hamburger, Logo, Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleCollapse}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1 w-10 h-10 flex items-center justify-center shrink-0 shadow-sm">
             <img src={customLogo || import.meta.env.BASE_URL + 'logo.png'} alt="Logo" className="w-full h-full object-contain scale-95" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h1 className="font-bold text-base md:text-lg hidden sm:block">{systemSettings?.companyName || 'نظام الأرشيف الإلكتروني'}</h1>
        </div>
      </div>

      {/* Middle: Tab/Breadcrumb (Optional) */}
      <div className="hidden lg:flex items-center">
        <button 
           onClick={() => onNavigate && onNavigate('dashboard')}
           className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          الرئيسية
        </button>
      </div>

      {/* Left side: Icons, User Info */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Real-time Alerts Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="relative text-white hover:bg-white/10 p-2 rounded-lg transition-colors duration-200 focus:outline-none"
            title="التنبيهات والإشعارات"
          >
            <Bell size={22} />
            {generatedNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-transparent animate-pulse">
                {generatedNotifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute left-0 mt-3 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-200 text-slate-800" style={{ transformOrigin: 'top left' }}>
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-blue-600 animate-bounce" size={18} />
                  <h4 className="font-bold text-slate-800 text-sm">التنبيهات والإشعارات النشطة</h4>
                </div>
                {generatedNotifications.length > 0 && (
                  <button 
                    onClick={() => {
                      setDismissedIds([...dismissedIds, ...generatedNotifications.map(n => n.id)]);
                      toast('تم تعيين جميع التنبيهات كمقروءة');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {generatedNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-slate-50/70 transition-colors flex gap-3 relative group">
                    <div className="flex-1 cursor-pointer" onClick={() => { if (onNavigate) { onNavigate(notif.linkMenu, notif.employeeId); setShowNotifications(false); } }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={\`w-2 h-2 rounded-full \${notif.severity === 'high' ? 'bg-red-500 animate-ping' : notif.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}\`} />
                        <h5 className="font-bold text-slate-800 text-xs">{notif.title}</h5>
                        <span className="text-[10px] text-slate-400 mr-auto font-mono">{notif.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{notif.description}</p>
                    </div>                    
                    <button onClick={(e) => { e.stopPropagation(); setDismissedIds([...dismissedIds, notif.id]); toast('تم مسح التنبيه'); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" title="تجاهل">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {generatedNotifications.length === 0 && (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <CheckSquare className="text-emerald-500" size={32} />
                    <p className="text-sm font-semibold text-slate-700">لا توجد تنبيهات نشطة حالياً</p>
                    <p className="text-xs text-slate-400">جميع الأمور تبدو في حالة ممتازة!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 border-r border-white/20 pr-4">
          <div className="text-left hidden md:flex flex-col items-end">
            <p className="text-sm font-bold text-white leading-none mb-1">{user.username}</p>
            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">{getRoleName(user.role)}</span>
          </div>
          <UserCircle size={36} className="text-white/80" />
        </div>
        
      </div>
    </header>
  );
}
`;

file = file.replace(/return \([\s\S]*\}\);?\n\}/, topbarJsx);
fs.writeFileSync('src/components/Topbar.tsx', file);
