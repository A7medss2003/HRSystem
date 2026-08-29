const fs = require('fs');

let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

login = login.replace(
  "import { Lock, User, ShieldCheck } from 'lucide-react';",
  "import { Lock, User, ShieldCheck, AlertCircle, Key, UserPlus } from 'lucide-react';"
);

// Add the First Time Setup State and Logic
login = login.replace(
  "const [error, setError] = useState('');",
  `const [error, setError] = useState('');
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(() => {
    // Check if there are no admin employees at all
    return employees.filter(e => e.defaultRole === 'admin').length === 0;
  });
  const [setupData, setSetupData] = useState({ fullName: '', username: '', password: '', confirmPassword: '' });
  const { addEmployee } = useStore();`
);

// Add handleSetupSubmit
const setupLogic = `
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupData.password !== setupData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    if (setupData.password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
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
    toast('تم إعداد حساب المدير بنجاح');
    setIsFirstTimeSetup(false);
    setUsername(setupData.username);
    setPassword(setupData.password);
  };
`;

login = login.replace(
  "const handleRecoverySubmit = (e: React.FormEvent) => {",
  setupLogic + "\n  const handleRecoverySubmit = (e: React.FormEvent) => {"
);

const setupUI = `
        {isFirstTimeSetup ? (
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
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-6 flex items-center justify-center gap-2">
              <UserPlus size={20} />
              إنشاء حساب المدير
            </button>
          </form>
        ) : isRecoveryMode ? (
`;

login = login.replace(
  "{isRecoveryMode ? (",
  setupUI
);

fs.writeFileSync('src/components/Login.tsx', login);
