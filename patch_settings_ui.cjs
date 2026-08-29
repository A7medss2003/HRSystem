const fs = require('fs');
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!settings.includes('systemSettings')) {
  settings = settings.replace(
    "  const { employees, updateEmployee, addSystemLog } = useStore();",
    "  const { employees, updateEmployee, addSystemLog, systemSettings, updateSystemSettings } = useStore();\n  const [compName, setCompName] = React.useState(systemSettings?.companyName || '');"
  );
  
  const compSettingsUI = `
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Globe size={20} className="text-blue-500" />
            إعدادات المؤسسة
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المؤسسة</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="أدخل اسم المؤسسة"
                />
                <button 
                  onClick={() => {
                    updateSystemSettings({ ...systemSettings, companyName: compName });
                    toast('تم تحديث اسم المؤسسة بنجاح');
                    addSystemLog({ userId: user?.username || 'system', userName: user?.username || 'system', action: 'تحديث الإعدادات', details: 'تم تغيير اسم المؤسسة إلى: ' + compName });
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  حفظ
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اللغة الافتراضية</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                disabled
              >
                <option value="ar">العربية (Arabic)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">لا يمكن تغيير لغة النظام الأساسية حالياً</p>
            </div>
          </div>
        </div>
`;

  // Insert before the notifications section if it exists, or just after the first card
  settings = settings.replace(
    /(\<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"\>\s*\<h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4"\>\s*\<Bell size=\{20\} className="text-blue-500" \/\>\s*تفضيلات الإشعارات\s*\<\/h3>)/,
    compSettingsUI + "\n        $1"
  );

  fs.writeFileSync('src/pages/Settings.tsx', settings);
}
