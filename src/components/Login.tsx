import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (role: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');

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
    else {
      setError('المستخدم غير موجود. استخدم: admin, accountant, أو employee');
      return;
    }

    onLogin(role, un);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">نظام إدارة الموارد البشرية</h1>
          <p className="text-blue-100 text-sm">قم بتسجيل الدخول للوصول إلى النظام</p>
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
                  placeholder="admin / accountant / employee"
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
                  placeholder="1234"
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              تسجيل الدخول
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3">حسابات تجريبية (كلمة المرور: 1234)</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setUsername('admin')} className="text-xs py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono">admin</button>
              <button onClick={() => setUsername('accountant')} className="text-xs py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono">accountant</button>
              <button onClick={() => setUsername('employee')} className="text-xs py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono">employee</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
