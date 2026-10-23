import React, { useState, useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, ChevronLeft, PackageCheck, X } from 'lucide-react';
import { useStore } from '../store';
import { APP_VERSION } from '../version';

export default function UpdateNotification() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const { addSystemLog } = useStore();

  const handleDismiss = () => {
    localStorage.setItem('hr-app-version', APP_VERSION);
    setShow(false);
  };

  useEffect(() => {
    // Check if the user is running a setup installation
    const storedVersion = localStorage.getItem('hr-app-version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      setShow(true);
      
      const timer = setTimeout(() => {
        setStep(2);
        localStorage.setItem('hr-app-version', APP_VERSION);
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!storedVersion) {
      // First visit - mark as current version without blocking user
      localStorage.setItem('hr-app-version', APP_VERSION);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute left-4 top-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors z-20 cursor-pointer"
          title="إغلاق التنبيه"
        >
          <X size={18} />
        </button>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          
          <div className="relative z-10">
            {step === 1 ? (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Download size={40} className="text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 animate-in zoom-in spin-in-180 duration-500">
                <PackageCheck size={40} className="text-white" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-2">
              {step === 1 ? 'جاري تثبيت التحديثات الجديدة...' : 'تم التحديث بنجاح!'}
            </h2>
            <p className="text-blue-100 opacity-90">
              الإصدار {APP_VERSION}
            </p>
          </div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <p className="text-slate-600 text-center font-medium">يرجى الانتظار بينما نقوم بتهيئة البيانات وتجهيز الميزات الجديدة.</p>
              
              <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                <div className="bg-blue-600 h-3 rounded-full animate-[progress_3s_ease-in-out_forwards]" style={{width: '0%'}}></div>
              </div>
              <p className="text-center text-sm text-slate-400 animate-pulse">جاري دمج قواعد البيانات...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  ما تم إنجازه في الترقية التشطيبية (الإصدار {APP_VERSION}):
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">خادم الربط السلكي المباشر (كابل إيثرنت فقط)</p>
                      <p className="text-xs text-slate-500">يعمل الخادم تلقائياً في الخلفية لمشاركة المنظومة مع الجهاز الآخر بسرعة فائقة دون الحاجة لراوتر أو واي فاي، مع إتاحة تعديل الآي بي والمنفذ للمدير والمطور فقط وحجب الشارة عن الموظف العادي.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">نظام معاينة وطباعة ملف الموظف الرسمي مع تخصيص البيانات</p>
                      <p className="text-xs text-slate-500">نافذة معاينة وطباعة رسمية بمقاس A4 تتيح اختيار أو استثناء البيانات المطلوب طباعتها (البيانات الشخصية، الوظيفية، البنكية، المؤهلات، الخبرات، العهد، والتوقيعات والختم).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">ترقية تشطيبية في نفس المسار (In-Place Upgrade)</p>
                      <p className="text-xs text-slate-500">استبدال ملفات النسخة القديمة مباشرة مع الإبقاء على أيقونة رسمية واحدة فقط على سطح المكتب وقائمة ابدأ، دون أي نسخ مكررة.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">الحفاظ الكامل 100% على كافة قواعد البيانات والموظفين</p>
                      <p className="text-xs text-slate-500">جميع سجلات الموظفين، الرواتب، العقود، والبيانات محفوظة ومحمية بالكامل في نفس مسار النظام دون أي مساس.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <button 
                onClick={handleDismiss}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                الدخول إلى المنظومة
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
