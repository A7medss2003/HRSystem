const fs = require('fs');

// 1. Fix Settings.tsx to implement Backup/Restore and Change Password
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Imports
if (!settings.includes('Upload')) {
  settings = settings.replace(
    "import { Save, Shield, Bell, Lock, Key, Database, Globe, MapPin, Upload } from 'lucide-react';",
    "import { Save, Shield, Bell, Lock, Key, Database, Globe, MapPin, Upload, Download } from 'lucide-react';"
  );
  settings = settings.replace(
    "import { Save, Shield, Bell, Lock, Key, Database, Globe, MapPin } from 'lucide-react';",
    "import { Save, Shield, Bell, Lock, Key, Database, Globe, MapPin, Upload, Download } from 'lucide-react';"
  );
}

// Add state for Password Modal
if (!settings.includes('showPasswordModal')) {
  settings = settings.replace(
    "const [bPath, setBPath] = useState(backupPath || '');",
    "const [bPath, setBPath] = useState(backupPath || '');\n  const [showPasswordModal, setShowPasswordModal] = useState(false);\n  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });\n  const { employees, updateEmployee } = useStore();"
  );
}

// Add backup/restore logic
const backupRestoreLogic = `
  const handleRunBackup = () => {
    try {
      const data = localStorage.getItem('hr-system-storage-v4');
      if (!data) {
        toast('لا توجد بيانات لنسخها');
        return;
      }
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`hr_backup_\${new Date().toISOString().split('T')[0]}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLastBackupDate(new Date().toISOString());
      toast('تم استخراج وتنزيل النسخة الاحتياطية بنجاح');
    } catch (e) {
      toast('حدث خطأ أثناء استخراج النسخة الاحتياطية');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('تنبيه هام جداً: استعادة النسخة الاحتياطية ستقوم بحذف جميع البيانات الحالية وإحلال بيانات النسخة الاحتياطية مكانها. هل أنت متأكد من رغبتك في الاستمرار؟')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate JSON
          JSON.parse(content);
          localStorage.setItem('hr-system-storage-v4', content);
          toast('تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تشغيل النظام.');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (err) {
          toast('ملف النسخة الاحتياطية غير صالح أو تالف');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwords.new.length < 4) {
      toast('يجب أن تكون كلمة المرور 4 أحرف على الأقل');
      return;
    }
    
    // Find current user
    const un = user.username.toLowerCase();
    const currentUser = employees.find(emp => emp.linkedUser === un || emp.employeeId.toLowerCase() === un || emp.workEmail.toLowerCase() === un);
    
    if (!currentUser) {
      toast('حدث خطأ: لم يتم العثور على حسابك في سجل الموظفين');
      return;
    }
    
    const currentPass = currentUser.password || '1234';
    if (currentPass !== passwords.old) {
      toast('كلمة المرور الحالية غير صحيحة');
      return;
    }
    
    updateEmployee({ ...currentUser, password: passwords.new });
    toast('تم تغيير كلمة المرور بنجاح');
    setShowPasswordModal(false);
    setPasswords({ old: '', new: '', confirm: '' });
  };
`;

settings = settings.replace(
  /const handleRunBackup = \(\) => \{[\s\S]*?toast\('تم إنشاء نسخة احتياطية بنجاح في المسار المحدد'\);\s*\};/,
  backupRestoreLogic.trim()
);

// Add Import Button UI
const importBtnUI = `
                <div className="flex gap-2">
                  <label className="bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center">
                    استعادة نسخة
                    <input type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                  </label>
                  <button 
                    onClick={handleRunBackup}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    إجراء نسخة الآن
                  </button>
                </div>
`;

settings = settings.replace(
  /<button\s*onClick=\{handleRunBackup\}\s*className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"\s*>\s*إجراء نسخة الآن\s*<\/button>/,
  importBtnUI
);

// Add Change Password onClick handler
settings = settings.replace(
  /<button className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right">/,
  '<button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right">'
);

// Add Password Modal UI
const modalUI = `
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">تغيير كلمة المرور</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الحالية</label>
                <input type="password" required value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input type="password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">تأكيد التغيير</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

settings = settings.replace(
  "</div>\n    </div>\n  );\n}",
  `</div>\n    </div>\n${modalUI}\n  );\n}`
);

fs.writeFileSync('src/pages/Settings.tsx', settings);

