import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Key, HardDrive, Globe } from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../components/Toast';
import { validatePassword } from '../lib/validators';

export default function Settings({ user }: { user?: { username: string, role?: string } }) {
  const { backupPath, setBackupPath, lastBackupDate, setLastBackupDate, setRecoveryCodes } = useStore();
  const [bPath, setBPath] = React.useState(backupPath || '');
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwords, setPasswords] = React.useState({ old: '', new: '', confirm: '' });
  const { employees, updateEmployee, addSystemLog, systemSettings, updateSystemSettings } = useStore();
  const [compName, setCompName] = React.useState(systemSettings?.companyName || '');

  const handleSaveBackup = () => {
    setBackupPath(bPath);
    toast('تم تحديث مسار النسخ الاحتياطي');
  };

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
      a.download = `hr_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLastBackupDate(new Date().toISOString());
      toast('تم استخراج وتنزيل النسخة الاحتياطية بنجاح');
      addSystemLog({ userId: user?.username || 'system', userName: user?.username || 'system', action: 'نسخ احتياطي', details: 'قام المستخدم بإنشاء وتنزيل نسخة احتياطية' });
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
          addSystemLog({ userId: user?.username || 'system', userName: user?.username || 'system', action: 'استعادة النظام', details: 'قام المستخدم باستعادة نسخة احتياطية' });
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
    const passError = validatePassword(passwords.new);
    if (passError) {
      toast(passError);
      return;
    }
    
    // Find current user
    const un = (user?.username || '').toLowerCase();
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
    addSystemLog({ userId: currentUser.id, userName: currentUser.fullName, action: 'تغيير كلمة المرور', details: 'تم تغيير كلمة المرور الخاصة بحساب ' + currentUser.fullName });
    setShowPasswordModal(false);
    setPasswords({ old: '', new: '', confirm: '' });
  };

  const handleGenerateRecoveryCodes = () => {
    const codes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
    setRecoveryCodes(codes);
    
    const text = "رموز الاسترداد الخاصة بمدير النظام (يرجى حفظها في مكان آمن):\n\n" + codes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery_codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('تم إنشاء وتنزيل ملف رموز الاسترداد بنجاح');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="text-blue-600" />
            الإعدادات
          </h2>
          <p className="text-slate-500 mt-1 text-sm">إدارة إعدادات حسابك وتفضيلات النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <HardDrive size={20} className="text-blue-500" />
            النسخ الاحتياطي (للأجهزة المحلية)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">مسار النسخة الاحتياطية (مثل D:\Backup)</label>
              
              <div className="flex gap-2 items-center">
                <input 
                  type="text"
                  dir="ltr"
                  value={bPath}
                  onChange={(e) => setBPath(e.target.value)}
                  readOnly placeholder="اختر مسار الحفظ..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="file" 
                  id="settings-folder-picker"
                  className="hidden"
                  /* @ts-ignore */
                  webkitdirectory="true"
                  directory="true"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const fullPath = file.path || file.webkitRelativePath;
                      if (fullPath) {
                         const dirPath = fullPath.substring(0, Math.max(fullPath.lastIndexOf('\\'), fullPath.lastIndexOf('/')));
                         setBPath(dirPath || fullPath);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('settings-folder-picker')?.click()}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
                >
                  تصفح...
                </button>
                <button 
                  onClick={handleSaveBackup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  حفظ
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">يُستخدم هذا المسار لحفظ نسخة من بيانات البرنامج في حالة تشغيله كبرنامج سطح مكتب مستقل.</p>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">آخر نسخة احتياطية</p>
                  <p className="text-xs text-slate-500 text-right mt-1" dir="ltr">
                    {lastBackupDate ? new Date(lastBackupDate).toLocaleString('ar-SA') : 'لم يتم إجراء أي نسخة احتياطية بعد'}
                  </p>
                </div>
                
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

              </div>
            </div>
          </div>
        </div>

        
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Bell size={20} className="text-blue-500" />
            تفضيلات الإشعارات
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-800">إشعارات الإجازات</p>
                <p className="text-xs text-slate-500">تلقي تنبيه عند طلب إجازة جديدة</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-800">إشعارات الحضور</p>
                <p className="text-xs text-slate-500">تلقي تقرير يومي بحضور وانصراف الموظفين</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Shield size={20} className="text-blue-500" />
            الأمان والخصوصية
          </h3>
          <div className="space-y-4">
            <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg"><Key size={18} className="text-slate-600" /></div>
                <div>
                  <p className="font-medium text-slate-800">تغيير كلمة المرور</p>
                  <p className="text-xs text-slate-500">تحديث كلمة المرور الخاصة بحسابك</p>
                </div>
              </div>
            </button>
            {user?.role === 'admin' && (
              <button onClick={handleGenerateRecoveryCodes} className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right mt-2">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg"><Key size={18} className="text-slate-600" /></div>
                  <div>
                    <p className="font-medium text-slate-800">رموز الاسترداد (الكلمات المفتاحية)</p>
                    <p className="text-xs text-slate-500">تنزيل رموز سرية لاستخدامها في الدخول عند نسيان كلمة المرور</p>
                  </div>
                </div>
              </button>
            )}

          </div>
        </div>
      </div>
      
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
    </div>
  );
}
