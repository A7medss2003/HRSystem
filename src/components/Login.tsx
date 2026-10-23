import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, Key, UserPlus, RefreshCw } from 'lucide-react';
import { toast } from '../components/Toast';
import { useStore } from '../store';
import { validatePassword } from '../lib/validators';
import { fetchCentralDataFromHost, applySyncableState, pushCentralDataToHost, extractSyncableState } from '../lib/serverSync';

export default function Login({ onLogin }: { onLogin: (role: string, username: string, permissions?: string[]) => void }) {
  const { systemSettings, employees, useRecoveryCode, addEmployee } = useStore();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('rememberedUser') || '');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedUser'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Track synchronization state with central host
  const [isSyncing, setIsSyncing] = useState(() => {
    // If local store has no admin yet, try syncing from host first
    return employees.filter(e => e.defaultRole === 'admin').length === 0;
  });

  const [setupData, setSetupData] = useState({ fullName: '', username: '', password: '', confirmPassword: '' });

  const customLogo = localStorage.getItem('app_logo');

  // Sync data from host on component mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const serverData = await fetchCentralDataFromHost();
        if (serverData && isMounted) {
          applySyncableState(useStore, serverData);
        }
      } catch (err) {
        // host unreachable or standalone mode
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const serverData = await fetchCentralDataFromHost();
      if (serverData) {
        const applied = applySyncableState(useStore, serverData);
        if (applied) {
          toast('تم تحديث ومزامنة بيانات الموظفين والمسؤولين من الخادم المضيف بنجاح');
        } else {
          toast('البيانات محدثة بالفعل ومتطابقة مع الخادم المضيف');
        }
      } else {
        toast('البيانات محدثة ومتزامنة محلياً');
      }
    } catch (e) {
      toast('تعذر الوصول إلى الخادم المضيف؛ تأكد من اتصال الكابل');
    } finally {
      setIsSyncing(false);
    }
  };

  // Check if there is an admin employee in the database
  const hasAdmin = employees.some(e => e.defaultRole === 'admin');
  const isFirstTimeSetup = !hasAdmin && !isSyncing;

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupData.password !== setupData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    const passError = validatePassword(setupData.password);
    if (passError) {
      setError(passError);
      return;
    }
    if (!setupData.username || !setupData.fullName) {
      setError('الرجاء إدخال جميع الحقول');
      return;
    }
    
    const newAdmin = {
      id: 'admin-' + Date.now(),
      employeeId: 'ADMIN-001',
      fullName: setupData.fullName,
      jobTitle: 'مدير النظام',
      department: 'الإدارة العليا',
      workEmail: setupData.username + '@system.local',
      company: 'الشركة',
      tags: [],
      workPhone: '',
      workMobile: '',
      management: '',
      directManager: '',
      coach: '',
      workAddress: '',
      workLocation: '',
      timeOffApprover: '',
      expensesApprover: '',
      timesheetApprover: '',
      workingHours: '',
      timezone: '',
      defaultRole: 'admin',
      additionalRoles: [],
      remoteWorkType: 'مكتب',
      workSchedule: '',
      homeAddress: '',
      personalPhone: '',
      personalEmail: '',
      language: 'Arabic',
      gender: 'ذكر',
      maritalStatus: 'أعزب',
      dob: '',
      placeOfBirth: '',
      nationality: '',
      childrenCount: 0,
      nationalId: '',
      passportNo: '',
      visaNo: '',
      visaExpiry: '',
      workPermitNo: '',
      permitExpiry: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      educations: [],
      experiences: [],
      skills: [],
      contracts: [],
      certifications: [],
      equipments: [],
      documents: [],
      auditLogs: [],
      status: 'نشط',
      linkedUser: setupData.username,
      password: setupData.password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };
    
    // @ts-ignore
    addEmployee(newAdmin);

    // Push new admin to central host database immediately
    setTimeout(async () => {
      const payload = extractSyncableState(useStore.getState());
      await pushCentralDataToHost(payload);
    }, 100);

    toast('تم إعداد حساب المدير بنجاح وحفظه في قاعدة البيانات المركزية');
    setUsername(setupData.username);
    setPassword(setupData.password);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useRecoveryCode(recoveryCode.trim())) {
      toast('تم تسجيل الدخول بنجاح باستخدام رمز الاسترداد');
      onLogin('admin', 'admin');
    } else {
      setError('رمز الاسترداد غير صحيح أو تم استخدامه مسبقاً');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const un = username.toLowerCase().trim();
    let role = '';
    
    // 1. Developer Account
    if (un === 'dev' && password === '1234') {
      onLogin('developer', 'dev', ['all']);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', 'dev');
      } else {
        localStorage.removeItem('rememberedUser');
      }
      return;
    }

    // 2. Default Admin Account Fallback
    if (un === 'admin' && (password === '1234' || password === 'admin123')) {
      onLogin('admin', 'admin', ['all']);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', 'admin');
      } else {
        localStorage.removeItem('rememberedUser');
      }
      return;
    }
    
    // 2. Find employee in central database (Admin, Accountant, Employee)
    const emp = employees.find(e => 
      e.linkedUser?.toLowerCase() === un || 
      e.employeeId?.toLowerCase() === un || 
      e.workEmail?.toLowerCase() === un
    );

    if (!emp) {
      setError('المستخدم غير موجود في قاعدة البيانات المركزية. الرجاء التحقق من اسم المستخدم.');
      return;
    }
    
    // If employee has a password, check it, else default to 1234
    const empPassword = emp.password || '1234';
    if (password !== empPassword) {
      setError('كلمة المرور غير صحيحة');
      return;
    }
    
    // Determine role from employee record
    role = emp.defaultRole || 'employee';
    if (un === 'admin' || role === 'admin') role = 'admin';

    if (rememberMe) {
      localStorage.setItem('rememberedUser', un);
    } else {
      localStorage.removeItem('rememberedUser');
    }

    onLogin(role, un, emp.customPermissions || (role === 'admin' ? ['all'] : []));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
      {/* Background Watermark */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url(${customLogo || import.meta.env.BASE_URL + 'logo.png'})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '50% auto'
        }}
      />
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10">
        <div className="p-8 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary, #243f63)' }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${customLogo || import.meta.env.BASE_URL + 'logo.png'})`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden relative z-10 p-2">
            <img src={customLogo || `${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <ShieldCheck size={40} className="text-blue-600 hidden" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">{systemSettings?.companyName || 'مركز البنيان للتقنية و الصناعات الهندسية'}</h1>
          <p className="text-white/90 text-sm relative z-10">نظام إدارة الموارد البشرية</p>
        </div>
        
        <div className="p-8">
          
        {isSyncing && !hasAdmin ? (
          <div className="py-10 text-center space-y-3.5">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="font-bold text-slate-800 text-sm">جاري الاتصال بالخادم المضيف ومزامنة البيانات...</p>
              <p className="text-xs text-slate-500 mt-1">يتم استرداد بيانات الموظفين والمسؤولين المسجلة بالجهاز الرئيسي</p>
            </div>
          </div>
        ) : isFirstTimeSetup ? (
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 border border-blue-100 flex items-start gap-3">
              <UserPlus className="shrink-0 mt-1" size={20} />
              <div className="text-sm">
                <strong className="block mb-1 text-base">إعداد النظام للمرة الأولى</strong>
                مرحباً بك! يبدو أن هذه هي المرة الأولى لتشغيل النظام. الرجاء إنشاء حساب المدير الرئيسي للبدء.
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل للمدير</label>
              <input type="text" required value={setupData.fullName} onChange={e => setSetupData({...setupData, fullName: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثال: أحمد محمد" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم المستخدم للدخول</label>
              <input type="text" required value={setupData.username} onChange={e => setSetupData({...setupData, username: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" placeholder="admin" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
              <input type="password" required value={setupData.password} onChange={e => setSetupData({...setupData, password: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تأكيد كلمة المرور</label>
              <input type="password" required value={setupData.confirmPassword} onChange={e => setSetupData({...setupData, confirmPassword: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" />
            </div>
            <button type="submit" className="w-full text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-6 flex items-center justify-center gap-2 cursor-pointer" style={{ backgroundColor: 'var(--color-primary, #243f63)' }}>
              <UserPlus size={20} />
              إنشاء حساب المدير
            </button>
          </form>
        ) : isRecoveryMode ? (
          <form onSubmit={handleRecoverySubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">رمز الاسترداد (الكلمة المفتاحية)</label>
              <input 
                type="text" 
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center tracking-widest font-mono font-bold"
                placeholder="أدخل رمز الاسترداد هنا"
                required
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2 text-center">قم بإدخال أحد رموز الاسترداد التي قمت بتنزيلها مسبقاً من الإعدادات</p>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button type="submit" className="w-full text-white font-bold py-3 rounded-lg transition-colors shadow-sm cursor-pointer" style={{ backgroundColor: 'var(--color-primary, #243f63)' }}>
              الدخول بالرمز
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setIsRecoveryMode(false); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
              >
                العودة لتسجيل الدخول العادي
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                />
                <span className="text-sm text-slate-600 font-medium">تذكرني</span>
              </label>
            </div>

            <button type="submit" className="w-full text-white font-bold py-3 rounded-lg transition-colors shadow-sm cursor-pointer hover:opacity-95" style={{ backgroundColor: 'var(--color-primary, #243f63)' }}>
              تسجيل الدخول
            </button>

            <div className="mt-4 text-center">
               <button 
                 type="button" 
                 onClick={() => { setIsRecoveryMode(true); setError(''); }}
                 className="text-xs font-medium transition-colors hover:opacity-80 cursor-pointer" style={{ color: 'var(--color-primary, #243f63)' }}
               >
                 هل نسيت كلمة المرور؟ (استخدام رمز الاسترداد)
               </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
