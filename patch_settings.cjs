const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!content.includes('backupPath')) {
  content = content.replace(
    /import \{ Settings as SettingsIcon, Bell, Shield, Key \} from 'lucide-react';/,
    "import { Settings as SettingsIcon, Bell, Shield, Key, HardDrive } from 'lucide-react';\nimport { useStore } from '../store';\nimport { toast } from '../components/Toast';"
  );

  content = content.replace(
    /export default function Settings\(\) \{/,
    "export default function Settings() {\n  const { backupPath, setBackupPath } = useStore();\n  const [bPath, setBPath] = React.useState(backupPath || '');\n\n  const handleSaveBackup = () => {\n    setBackupPath(bPath);\n    toast('تم تحديث مسار النسخ الاحتياطي');\n  };\n"
  );

  const backupSection = `
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <HardDrive size={20} className="text-blue-500" />
            النسخ الاحتياطي (للأجهزة المحلية)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">مسار النسخة الاحتياطية (مثل D:\\Backup)</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  dir="ltr"
                  value={bPath}
                  onChange={(e) => setBPath(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleSaveBackup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  حفظ
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">يُستخدم هذا المسار لحفظ نسخة من بيانات البرنامج في حالة تشغيله كبرنامج سطح مكتب مستقل.</p>
            </div>
          </div>
        </div>
`;

  content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-2 gap-6">/,
    '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n' + backupSection
  );
  
  fs.writeFileSync('src/pages/Settings.tsx', content);
}
