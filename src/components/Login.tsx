import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (role: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');

  const customLogo = localStorage.getItem('app_logo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== '1234') {
      setError('كلمة المرور غير صحيحة. استخدم 1234');
      return;
    }
    
    const un = username.toLowerCase().trim();
    let role = '';
    if (un === 'admin') role = 'admin';
    else if (un === 'accountant') role = 'accountant';
    else if (un === 'employee') role = 'employee';
    else if (un === 'developer' || un === 'dev') role = 'developer';
    else {
      setError('المستخدم غير موجود. استخدم: admin, accountant, أو employee');
      return;
    }

    onLogin(role, un);
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
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${customLogo || import.meta.env.BASE_URL + 'logo.png'})`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl overflow-hidden relative z-10 p-2">
            <img src={customLogo || `${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <ShieldCheck size={40} className="text-blue-600 hidden" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">مركز البنيان</h1>
          <p className="text-blue-100 text-sm relative z-10">نظام إدارة الموارد البشرية</p>
        </div>
        
        <div className="p-8">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  dir="ltr"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              تسجيل الدخول
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
