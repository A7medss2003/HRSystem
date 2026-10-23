import React, { useState } from 'react';
import { HardDrive, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { useStore } from '../store';
import { toast } from './Toast';

export default function BackupModal({ userRole }: { userRole: string }) {
  const { backupPath, setBackupPath } = useStore();
  const [inputPath, setInputPath] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  if (userRole !== 'admin' || backupPath !== null || isDismissed) {
    return null;
  }

  const handleSave = () => {
    if (!inputPath.trim()) {
      toast('الرجاء إدخال مسار صحيح', 'warning');
      return;
    }
    
    // Convert backslashes for JS if needed, though raw is fine
    setBackupPath(inputPath.trim());
    toast('تم إعداد مسار النسخة الاحتياطية بنجاح!', 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-amber-500 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors z-20 cursor-pointer"
            title="إغلاق وتخطي"
          >
            <X size={18} />
          </button>
          <div className="absolute -right-4 -top-4 text-amber-600 opacity-20">
            <ShieldAlert size={120} />
          </div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg relative z-10 text-amber-500">
            <HardDrive size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">إعداد النسخة الاحتياطية</h2>
          <p className="text-amber-50 text-sm relative z-10">
            لحماية بياناتك من الضياع في حال تعطل القرص الأساسي (C:)، نرجو منك تحديد مسار لحفظ النسخ الاحتياطية.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 block">
              مسار النسخ الاحتياطي (مثال: D:\HR_Backup)
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                dir="ltr"
                value={inputPath}
                onChange={e => setInputPath(e.target.value)}
                placeholder="D:\HR_Backup"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-500">
              يُفضل وضع المسار في قرص آخر مثل D أو قرص خارجي USB لضمان الأمان.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsDismissed(true)}
              className="flex-1 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer text-center text-sm"
            >
              تخطي حالياً
            </button>
            <button 
              onClick={handleSave}
              className="flex-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <CheckCircle size={18} />
              حفظ المسار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
