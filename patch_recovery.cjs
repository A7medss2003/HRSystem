const fs = require('fs');

// 1. Update store.ts
let store = fs.readFileSync('src/store.ts', 'utf8');

if (!store.includes('recoveryCodes')) {
  store = store.replace(
    /globalSearchQuery: string;/,
    "globalSearchQuery: string;\n  recoveryCodes: string[];\n  setRecoveryCodes: (codes: string[]) => void;\n  useRecoveryCode: (code: string) => boolean;"
  );

  store = store.replace(
    /globalSearchQuery: '',/,
    "globalSearchQuery: '',\n      recoveryCodes: [],"
  );

  store = store.replace(
    /setGlobalSearchQuery: \(query\) => set\(\{ globalSearchQuery: query \}\),/,
    `setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
      setRecoveryCodes: (codes) => set({ recoveryCodes: codes }),
      useRecoveryCode: (code) => {
        const state = get();
        if (state.recoveryCodes.includes(code)) {
          set({ recoveryCodes: state.recoveryCodes.filter(c => c !== code) });
          return true;
        }
        return false;
      },`
  );

  fs.writeFileSync('src/store.ts', store);
}


// 2. Update Settings.tsx
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

if (!settings.includes('handleGenerateRecoveryCodes')) {
  settings = settings.replace(
    /const \{ backupPath, setBackupPath, lastBackupDate, setLastBackupDate \} = useStore\(\);/,
    "const { backupPath, setBackupPath, lastBackupDate, setLastBackupDate, setRecoveryCodes } = useStore();"
  );

  settings = settings.replace(
    /const handleRunBackup = \(\) => \{[\s\S]*?\};/,
    `const handleRunBackup = () => {
    if (!bPath) {
      toast('الرجاء تحديد مسار النسخة الاحتياطية أولاً');
      return;
    }
    setLastBackupDate(new Date().toISOString());
    toast('تم إنشاء نسخة احتياطية بنجاح في المسار المحدد');
  };

  const handleGenerateRecoveryCodes = () => {
    const codes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
    setRecoveryCodes(codes);
    
    const text = "رموز الاسترداد الخاصة بمدير النظام (يرجى حفظها في مكان آمن):\\n\\n" + codes.join("\\n");
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
  };`
  );

  settings = settings.replace(
    /<div>\s*<p className="font-medium text-slate-800">تغيير كلمة المرور<\/p>\s*<p className="text-xs text-slate-500">تحديث كلمة المرور الخاصة بحسابك<\/p>\s*<\/div>\s*<\/div>\s*<\/button>/,
    `<div>
                  <p className="font-medium text-slate-800">تغيير كلمة المرور</p>
                  <p className="text-xs text-slate-500">تحديث كلمة المرور الخاصة بحسابك</p>
                </div>
              </div>
            </button>
            <button onClick={handleGenerateRecoveryCodes} className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right mt-2">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg"><Key size={18} className="text-slate-600" /></div>
                <div>
                  <p className="font-medium text-slate-800">رموز الاسترداد (الكلمات المفتاحية)</p>
                  <p className="text-xs text-slate-500">تنزيل رموز سرية لاستخدامها في الدخول عند نسيان كلمة المرور</p>
                </div>
              </div>
            </button>`
  );

  fs.writeFileSync('src/pages/Settings.tsx', settings);
}

// 3. Update Login.tsx
let login = fs.readFileSync('src/components/Login.tsx', 'utf8');

if (!login.includes('useRecoveryCode')) {
  login = login.replace(
    /const \{ employees \} = useStore\(\);/,
    "const { employees, useRecoveryCode } = useStore();\n  const [isRecoveryMode, setIsRecoveryMode] = useState(false);\n  const [recoveryCode, setRecoveryCode] = useState('');"
  );

  const recoverySubmit = `
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useRecoveryCode(recoveryCode.trim())) {
      toast('تم تسجيل الدخول بنجاح باستخدام رمز الاسترداد');
      onLogin('admin', 'admin');
    } else {
      setError('رمز الاسترداد غير صحيح أو تم استخدامه مسبقاً');
    }
  };
`;

  login = login.replace(
    /const handleSubmit = \(e: React\.FormEvent\) => \{/,
    `${recoverySubmit}\n  const handleSubmit = (e: React.FormEvent) => {`
  );

  login = login.replace(
    /<button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">\s*تسجيل الدخول\s*<\/button>\s*<\/form>/,
    `<button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              تسجيل الدخول
            </button>
            <div className="mt-4 text-center">
               <button 
                 type="button" 
                 onClick={() => { setIsRecoveryMode(true); setError(''); }}
                 className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
               >
                 هل نسيت كلمة المرور؟ (استخدام رمز الاسترداد)
               </button>
            </div>
          </form>`
  );

  const recoveryUI = `
        {isRecoveryMode ? (
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
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              الدخول بالرمز
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => { setIsRecoveryMode(false); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                العودة لتسجيل الدخول العادي
              </button>
            </div>
          </form>
        ) : (`;

  login = login.replace(
    /<form onSubmit=\{handleSubmit\} className="space-y-6">/,
    recoveryUI + `\n          <form onSubmit={handleSubmit} className="space-y-6">`
  );

  login = login.replace(
    /<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/,
    `</form>\n        )}\n        </div>\n      </div>\n    </div>\n  );\n}`
  );

  fs.writeFileSync('src/components/Login.tsx', login);
}
