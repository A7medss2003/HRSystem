import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Key, HardDrive, Globe, SlidersHorizontal, RefreshCw, CheckCircle2, Laptop, HelpCircle, X, Usb, ArrowLeft, Database, Sparkles, Cable, Server, Copy, Check, Terminal, ExternalLink, Activity, GitBranch } from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../components/Toast';
import { validatePassword } from '../lib/validators';
import FieldRequirementsModal from '../components/FieldRequirementsModal';
import EthernetServerModal from '../components/EthernetServerModal';
import GitHubUpdate from '../components/GitHubUpdate';
import { getStoredServerConfig, fetchNetworkInterfaces, saveServerConfig } from '../lib/serverSync';
import { executeLiveAutoBackup } from '../lib/autoBackup';
import { APP_VERSION, APP_RELEASE_DATE, APP_BUILD_TYPE } from '../version';

export default function Settings({ user }: { user?: { username: string, role?: string, permissions?: string[] } }) {
  const { backupPath, setBackupPath, lastBackupDate, setLastBackupDate, setRecoveryCodes, requiredFields } = useStore();
  const [bPath, setBPath] = React.useState(backupPath || '');
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showFieldRequirementsModal, setShowFieldRequirementsModal] = React.useState(false);
  const [showPatchGuide, setShowPatchGuide] = React.useState(false);
  const [showEthernetModal, setShowEthernetModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'updates' | 'backup' | 'general'>(() => {
    try {
      const saved = localStorage.getItem('hr_settings_active_tab');
      if (saved === 'updates' || saved === 'backup' || saved === 'general') return saved;
    } catch {}
    return 'updates';
  });

  const handleTabChange = (tab: 'updates' | 'backup' | 'general') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('hr_settings_active_tab', tab);
    } catch {}
  };

  const [serverIp, setServerIp] = React.useState('192.168.1.1');
  const [serverPort, setServerPort] = React.useState('3000');
  const [copiedEthLink, setCopiedEthLink] = React.useState(false);
  const [passwords, setPasswords] = React.useState({ old: '', new: '', confirm: '' });

  const isDevOrAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');

  React.useEffect(() => {
    try {
      const conf = getStoredServerConfig();
      if (conf.customEthernetIp) {
        setServerIp(conf.customEthernetIp);
      } else {
        fetchNetworkInterfaces().then(info => {
          if (info.ethernetIp) setServerIp(info.ethernetIp);
        }).catch(() => {});
      }
      if (conf.port) {
        setServerPort(String(conf.port));
      }
    } catch (e) {}
  }, []);

  const handleSaveServerConfig = () => {
    if (!isDevOrAdmin) {
      toast('عفواً، تعديل إعدادات الخادم متاح لمدير النظام والمطور فقط');
      return;
    }
    const cleanIp = serverIp.trim() || '192.168.1.1';
    const cleanPort = parseInt(serverPort.trim(), 10) || 3000;
    saveServerConfig({
      customEthernetIp: cleanIp,
      port: cleanPort
    });
    toast('تم حفظ وتطبيق إعدادات الخادم السلكي بنجاح');
  };
  const { employees, updateEmployee, addSystemLog, systemSettings, updateSystemSettings } = useStore();
  const [compName, setCompName] = React.useState(systemSettings?.companyName || '');
  const isAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');

  const handleCheckUpdates = () => {
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('check-for-updates');
        toast('جاري فحص الأقراص المحمولة (USB) للبحث عن تحديثات...');
      } catch (e) {
        toast('تعذر فحص التحديثات');
      }
    } else {
      toast(`أنت تعمل حالياً بأحدث إصدار من المنظومة (${APP_VERSION})`);
    }
  };


  const handleSaveBackup = () => {
    const finalPath = bPath.trim() || 'D:\\HR_Backup';
    setBackupPath(finalPath);
    setBPath(finalPath);
    executeLiveAutoBackup(useStore);
    toast('تم اعتماد مسار النسخة الاحتياطية وحفظ نسخة متزامنة فوراً بنجاح');
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
          <p className="text-slate-500 mt-1 text-sm">إدارة تحديثات النظام، النسخ الاحتياطي، والتفضيلات العامة</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">إصدار المنظومة:</span>
          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      {/* Organized Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('updates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'updates'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <RefreshCw size={15} className={activeTab === 'updates' ? 'text-blue-400' : 'text-slate-500'} />
          <span>تحديث المنظومة</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <HardDrive size={15} className={activeTab === 'backup' ? 'text-blue-400' : 'text-slate-500'} />
          <span>النسخ الاحتياطي والشبكة السلكية</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <SlidersHorizontal size={15} className={activeTab === 'general' ? 'text-blue-400' : 'text-slate-500'} />
          <span>الإعدادات العامة والأمان</span>
        </button>
      </div>

      {/* Tab 1: Updates & In-Place Upgrades */}
      {activeTab === 'updates' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* In-Place Upgrade Status & Quick Overview Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ترقية مباشرة في نفس المسار (In-Place Upgrade)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    حفظ كامل لقواعد البيانات
                  </span>
                </div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <RefreshCw className="text-blue-400" size={22} />
                  تحديث المنظومة
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  يمكنك تحديث المنظومة عبر الإنترنت أو الفلاش ميموري (USB) بكل سهولة، مع الحفاظ التام على جميع بياناتك وسجلاتك.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPatchGuide(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/15"
                >
                  <Usb size={15} />
                  دليل الترقية عبر فلاشة (USB)
                </button>
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/40"
                >
                  <RefreshCw size={15} />
                  فحص تحديثات أوفلاين (USB)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">الإصدار المثبت:</span>
                <span className="font-mono font-bold text-white text-sm">v{APP_VERSION}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">تاريخ الإصدار:</span>
                <span className="font-bold text-slate-200">{APP_RELEASE_DATE}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">نوع البناء:</span>
                <span className="font-bold text-slate-200">{APP_BUILD_TYPE}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">معرف الحزمة:</span>
                <span className="font-mono text-slate-300 text-[11px]">com.hrsystem.app</span>
              </div>
            </div>
          </div>

          {/* Integrated GitHub Update Engine */}
          <GitHubUpdate />
        </div>
      )}

      {/* Tab 2: Backup & Ethernet LAN Server */}
      {activeTab === 'backup' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <HardDrive size={20} className="text-blue-600" />
                  النسخ الاحتياطي التلقائي والمزدوج
                </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 size={13} />
                تخزين متزامن فوري دائم
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              تقوم المنظومة تلقائياً وبشكل فوري بحفظ البيانات في قاعدة بياناتها الأساسية، وتكرار حفظها في مسار النسخة الاحتياطية المعتمد أدناه مع كل عملية (إضافة، تعديل، حذف)، دون الحاجة لطلب نسخة يدوية من المستخدم أو المدير كل مرة.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مسار النسخة الاحتياطية المعتمد (مثل D:\HR_Backup أو قرص خارجي USB):
                </label>
                
                <div className="flex gap-2 items-center">
                  <input 
                    type="text"
                    dir="ltr"
                    value={bPath}
                    onChange={(e) => setBPath(e.target.value)}
                    placeholder="D:\HR_Backup"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                        const fullPath = (file as any).path || file.webkitRelativePath;
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
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                  >
                    تصفح...
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveBackup}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-blue-200"
                  >
                    حفظ وتحديث
                  </button>
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">حالة الحفظ المتزامن:</p>
                      <p className="text-[11px] text-slate-500">
                        {lastBackupDate ? `آخر حفظ وتحديث بالنسخة: ${new Date(lastBackupDate).toLocaleTimeString('ar-LY')} (${new Date(lastBackupDate).toLocaleDateString('ar-LY')})` : 'يعمل تلقائياً عند أي تعديل'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center">
                      استعادة نسخة
                      <input type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                    </label>
                    <button 
                      type="button"
                      onClick={handleRunBackup}
                      className="bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 text-xs font-medium transition-colors cursor-pointer"
                      title="تنزيل نسخة يدوية بتنسيق JSON لجهازك"
                    >
                      تنزيل ملف نسخة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Ethernet LAN Server Inline Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <Cable size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    الخادم السلكي المباشر (كابل إيثرنت فقط)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يعمل الخادم تلقائياً في الخلفية لمشاركة المنظومة مع الجهاز الآخر دون الحاجة لشبكة واي فاي أو إنترنت
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  يعمل تلقائياً (Auto-Running)
                </span>
                {!isDevOrAdmin && (
                  <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                    🔒 التعديل متاح للمدير والمطور فقط
                  </span>
                )}
              </div>
            </div>

            {/* Editable Fields: IP and Port */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              {/* Field 1: IP Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  عنوان الآي بي لمدخل كابل الإيثرنت (Ethernet IP):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    disabled={!isDevOrAdmin}
                    placeholder="192.168.1.1"
                    className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm border outline-none transition-all ${
                      isDevOrAdmin 
                        ? 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                  {!isDevOrAdmin && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      🔒 للقراءة فقط
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  الآي بي الخاص بكرت كابل الشبكة في هذا الجهاز (المستضيف).
                </p>
              </div>

              {/* Field 2: Port */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  منفذ الاتصال (Port):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={serverPort}
                  onChange={(e) => setServerPort(e.target.value)}
                  disabled={!isDevOrAdmin}
                  placeholder="3000"
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm border text-center outline-none transition-all ${
                    isDevOrAdmin 
                      ? 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
                <p className="text-[11px] text-slate-500">
                  المنفذ الافتراضي هو 3000.
                </p>
              </div>
            </div>

            {/* Direct Access Link Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Terminal size={14} className="text-emerald-600" />
                  رابط الدخول المباشر للجهاز الثاني (عبر كابل الإيثرنت):
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  يُكتب في متصفح الجهاز الثاني (Chrome / Edge)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-emerald-900 font-mono font-bold text-sm" dir="ltr">
                  http://{serverIp.trim() || '192.168.1.1'}:{serverPort.trim() || '3000'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = `http://${serverIp.trim() || '192.168.1.1'}:${serverPort.trim() || '3000'}`;
                    navigator.clipboard.writeText(url);
                    setCopiedEthLink(true);
                    toast('تم نسخ الرابط المباشر للجهاز الثاني بنجاح');
                    setTimeout(() => setCopiedEthLink(false), 2500);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copiedEthLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedEthLink ? 'تم النسخ!' : 'نسخ الرابط للجهاز الثاني'}
                </button>

                {isDevOrAdmin && (
                  <button
                    type="button"
                    onClick={handleSaveServerConfig}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    حفظ التعديلات
                  </button>
                )}
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed">
                💡 بمجرد توصيل الكابل بين الجهازين، افتح متصفح الجهاز الثاني واكتب الرابط أعلاه لتفتح المنظومة فوراً وتتزامن البيانات تلقائياً.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              * الخادم يبث المنظومة حصرياً عبر مدخل كابل الإيثرنت لضمان السرعة الفائقة والأمان التام.
            </span>
            <button
              type="button"
              onClick={() => setShowEthernetModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={14} />
              دليل ضبط الآي بي في ويندوز (إرشادات تفصيلية)
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Tab 3: General Settings, Notifications, Security */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center justify-between gap-2 mb-4">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-blue-500" />
                تخصيص حقول الموظفين (إجباري / اختياري)
              </span>
              <button
                type="button"
                onClick={() => setShowFieldRequirementsModal(true)}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                تعديل الحقول
              </button>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يمكن لمدير النظام تحديد الحقول الإلزامية التي يفرض على المستخدم تعبئتها قبل حفظ الموظف. افتراضياً، جميع البيانات اختيارية عدا <strong>الاسم الكامل</strong>.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">عدد الحقول الإلزامية حالياً:</span>
              <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                {Object.values(requiredFields || {}).filter(Boolean).length} حقول
              </span>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Globe size={20} className="text-blue-500" />
            إعدادات المؤسسة
          </h3>
          <div className="space-y-4">
            {isAdmin && (
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
            )}
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
      )}
      
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

      {/* Field Requirements Modal */}
      <FieldRequirementsModal
        isOpen={showFieldRequirementsModal}
        onClose={() => setShowFieldRequirementsModal(false)}
      />

      {/* Patch Guide Modal */}
      {showPatchGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Usb size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">دليل الترقية التشطيبية عن طريق الفلاش (USB)</h2>
                  <p className="text-xs text-blue-100">كيف تُحدث النسخة القديمة فقط في مكانها دون مساس بالبيانات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatchGuide(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Core Guarantee Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">الضمانة البرمجية: تحديث مباشر في نفس المسار (In-Place Upgrade)</p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    النظام مُبرمج بمعرف موحد <code className="bg-emerald-100/70 px-1.5 py-0.5 rounded font-mono text-[11px]">com.hrsystem.app</code>. عند تشغيل أي تحديث جديد، لن يُنشئ نسخة جديدة أو مساراً منفصلاً، بل سيستبدل ملفات النسخة القديمة مباشرة ويحافظ على جميع الموظفين والبيانات المخزنة بنسبة 100%.
                  </p>
                </div>
              </div>

              {/* Method 1 */}
              <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
                  الطريقة الأولى: التثبيت المباشر بالنقرة الواحدة من الفلاشة (الأسهل والأسرع)
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 mr-2 leading-relaxed">
                  <li>انسخ ملف التحديث <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700 font-bold">HR-System-Update-{APP_VERSION}.exe</code> إلى الفلاش ميموري.</li>
                  <li>صِل الفلاشة بالجهاز القديم.</li>
                  <li>افتح الفلاشة واضغط نقرة مزدوجة على الملف.</li>
                  <li>سيقوم المثبت تلقائياً بالتعرف على النسخة السابقة، واستبدال ملفاتها القديمة بالجديدة في ثوانٍ، ثم تشغيل المنظومة تلقائياً بكامل بياناتك السابقة.</li>
                </ol>
              </div>

              {/* Method 2 */}
              <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">2</span>
                  الطريقة الثانية: التحديث التلقائي الصامت من داخل المنظومة
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 mr-2 leading-relaxed">
                  <li>انسخ مجلد التحديثات <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-700 font-bold">HR_Update</code> بالكامل إلى الفلاش ميموري (يحتوي بداخله على ملف التحديث وملف <code className="font-mono">latest.yml</code>).</li>
                  <li>صِل الفلاشة بجهاز الكمبيوتر.</li>
                  <li>عند فتح المنظومة أو الضغط على زر <strong className="text-slate-800">«فحص التحديثات من الفلاشة»</strong>، سيكتشف النظام التحديث فوراً ويظهر لك رسالة: <span className="text-blue-600 font-semibold">"تم اكتشاف إصدار جديد ({APP_VERSION})، هل تريد التحديث الآن؟"</span>.</li>
                  <li>اضغط <strong className="text-emerald-700">«نعم، حدّث الآن»</strong> وسيقوم النظام بتحديث نفسه وإعادة التشغيل ذاتياً.</li>
                </ol>
              </div>

              {/* Guarantees List */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <h4 className="font-bold text-xs text-blue-900 mb-2 flex items-center gap-1.5">
                  <Database size={15} className="text-blue-600" />
                  ماذا يحدث لبياناتك القديمة أثناء التحديث؟
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>سجلات الموظفين: محفوظة بالكامل.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>الرواتب والإجازات: تظل كما هي.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>أيقونة واحدة فقط على سطح المكتب وقائمة ابدأ.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>لا حاجة لإعادة إدخال أو استيراد البيانات يدوياً.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                الإصدار الحالي: <strong className="text-blue-600 font-mono">{APP_VERSION}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowPatchGuide(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ethernet Server Modal */}
      <EthernetServerModal
        isOpen={showEthernetModal}
        onClose={() => setShowEthernetModal(false)}
      />
    </div>
  );
}
