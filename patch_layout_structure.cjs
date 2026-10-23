const fs = require('fs');
let file = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const layoutStructure = `
    <div 
      className="min-h-screen bg-[#f4f7f9] font-sans relative flex flex-col" 
      dir="rtl"
      style={customBg ? { backgroundImage: \`url(\${customBg})\`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}
    >
      {customBg && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0 pointer-events-none"></div>}
      
      <Topbar 
          user={user} 
          onNavigate={handleNavigate}
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      <div className="flex flex-1 relative z-10">
        <Sidebar 
          currentMenu={currentMenu} 
          setCurrentMenu={(menu) => {
            setCurrentMenu(menu);
            setSelectedEmployeeId(null);
            setIsAdding(false);
          }} 
          user={user}
          onLogout={onLogout}
          isCollapsed={isCollapsed}
        />
        
        <div className={\`transition-all duration-300 flex-1 flex flex-col min-h-screen relative \${isCollapsed ? 'mr-24' : 'mr-72'}\`}>
          {/* Backup Alert Banner */}
          {user.role === 'admin' && backupPath && (!lastBackupDate || (new Date().getTime() - new Date(lastBackupDate).getTime()) / (1000 * 3600 * 24) > 7) && (
            <div className="bg-red-50 border-b border-red-200 p-3 px-8 flex flex-col sm:flex-row items-center justify-between z-10 relative gap-3">
              <div className="flex items-center gap-3 text-red-700">
                <AlertTriangle size={20} className="animate-pulse shrink-0" />
                <p className="text-sm font-medium">تحذير: لم يتم إجراء نسخة احتياطية للبيانات منذ أكثر من 7 أيام. يرجى إنشاء نسخة احتياطية الآن لضمان أمان البيانات.</p>
              </div>
              <button 
                onClick={() => handleNavigate('settings')}
                className="text-xs bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium shadow-sm shrink-0 whitespace-nowrap"
              >
                الذهاب للإعدادات
              </button>
            </div>
          )}
          
          <main className="flex-1 p-8 relative z-0">
            {renderContent()}
          </main>
        </div>
      </div>
      <BackupModal userRole={user.role} />
    </div>
  );
}`;

file = file.replace(/<div \n      className="min-h-screen[\s\S]*?\}\);?\n\}/, layoutStructure);
fs.writeFileSync('src/components/Layout.tsx', file);
