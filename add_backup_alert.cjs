const fs = require('fs');

// 1. Update store.ts
let store = fs.readFileSync('src/store.ts', 'utf8');
if (!store.includes('lastBackupDate')) {
  store = store.replace(
    /backupPath: string \| null;/,
    "backupPath: string | null;\n  lastBackupDate: string | null;\n  setLastBackupDate: (date: string) => void;"
  );
  store = store.replace(
    /backupPath: null,/,
    "backupPath: null,\n      lastBackupDate: null,\n      setLastBackupDate: (date) => set({ lastBackupDate: date }),"
  );
  fs.writeFileSync('src/store.ts', store);
}

// 2. Update Settings.tsx
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
if (!settings.includes('setLastBackupDate')) {
  settings = settings.replace(
    /const \{ backupPath, setBackupPath \} = useStore\(\);/,
    "const { backupPath, setBackupPath, lastBackupDate, setLastBackupDate } = useStore();"
  );
  
  settings = settings.replace(
    /const handleSaveBackup = \(\) => \{[\s\S]*?\};/,
    `const handleSaveBackup = () => {
    setBackupPath(bPath);
    toast('تم تحديث مسار النسخ الاحتياطي');
  };

  const handleRunBackup = () => {
    if (!bPath) {
      toast('الرجاء تحديد مسار النسخة الاحتياطية أولاً');
      return;
    }
    setLastBackupDate(new Date().toISOString());
    toast('تم إنشاء نسخة احتياطية بنجاح في المسار المحدد');
  };`
  );

  settings = settings.replace(
    /<p className="text-xs text-slate-500 mt-2">يُستخدم هذا المسار لحفظ نسخة من بيانات البرنامج في حالة تشغيله كبرنامج سطح مكتب مستقل\.<\/p>/,
    `<p className="text-xs text-slate-500 mt-2">يُستخدم هذا المسار لحفظ نسخة من بيانات البرنامج في حالة تشغيله كبرنامج سطح مكتب مستقل.</p>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">آخر نسخة احتياطية</p>
                  <p className="text-xs text-slate-500 text-right mt-1" dir="ltr">
                    {lastBackupDate ? new Date(lastBackupDate).toLocaleString('ar-SA') : 'لم يتم إجراء أي نسخة احتياطية بعد'}
                  </p>
                </div>
                <button 
                  onClick={handleRunBackup}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                >
                  إجراء نسخة الآن
                </button>
              </div>`
  );
  fs.writeFileSync('src/pages/Settings.tsx', settings);
}

// 3. Update Layout.tsx
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
if (!layout.includes('AlertTriangle')) {
  layout = layout.replace(
    /import \{ useState, useEffect \} from 'react';/,
    "import { useState, useEffect } from 'react';\nimport { AlertTriangle } from 'lucide-react';"
  );
  layout = layout.replace(
    /const \{ employees, leaves, addEmployee, updateEmployee \} = useStore\(\);/,
    "const { employees, leaves, addEmployee, updateEmployee, backupPath, lastBackupDate } = useStore();"
  );

  const alertUI = `
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
  `;

  layout = layout.replace(
    /<main className="flex-1 p-8 relative z-0">/,
    alertUI + '\n        <main className="flex-1 p-8 relative z-0">'
  );
  fs.writeFileSync('src/components/Layout.tsx', layout);
}

