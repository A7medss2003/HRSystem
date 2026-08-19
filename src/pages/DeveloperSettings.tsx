import React, { useState } from 'react';
import { Monitor, Save, Download, Image as ImageIcon, Upload, Trash2, Database, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useStore } from '../store';
import localforage from 'localforage';

export default function DeveloperSettings() {
  const [logo, setLogo] = useState<string | null>(localStorage.getItem('app_logo'));
  const [bg, setBg] = useState<string | null>(localStorage.getItem('app_bg'));
  const { employees, leaves } = useStore();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setLogo(base64);
        localStorage.setItem('app_logo', base64);
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setBg(base64);
        localStorage.setItem('app_bg', base64);
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = () => {
    setLogo(null);
    localStorage.removeItem('app_logo');
    window.location.reload();
  };

  const handleClearBg = () => {
    setBg(null);
    localStorage.removeItem('app_bg');
    window.location.reload();
  };

  const handleBackup = () => {
    const data = JSON.stringify(Object.assign({}, localStorage));
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
          });
          alert('تم استعادة البيانات بنجاح، سيتم إعادة تحميل الصفحة.');
          window.location.reload();
        } catch (err) {
          alert('خطأ في قراءة ملف النسخة الاحتياطية.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearFiles = async () => {
    if (window.confirm('هل أنت متأكد من حذف جميع المرفقات والصور المحفوظة محلياً؟ (لا يمكن التراجع)')) {
      try {
        const fileStore = localforage.createInstance({
          name: 'hr-system-files',
          storeName: 'files'
        });
        await fileStore.clear();
        alert('تم مسح جميع المرفقات بنجاح.');
      } catch (err) {
        alert('حدث خطأ أثناء مسح المرفقات.');
      }
    }
  };

  const handleFactoryReset = async () => {
    if (window.confirm('تحذير: سيتم مسح كافة البيانات والإعدادات والمرفقات وإعادة المنظومة للوضع الافتراضي. هل تريد المتابعة؟')) {
      try {
        const fileStore = localforage.createInstance({
          name: 'hr-system-files',
          storeName: 'files'
        });
        await fileStore.clear();
        localStorage.clear();
        window.location.reload();
      } catch (err) {
        alert('حدث خطأ أثناء إعادة ضبط المنظومة.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Monitor className="text-blue-600" />
            أدوات المطور والصيانة
          </h2>
          <p className="text-slate-500 mt-1 text-sm">إدارة متقدمة، نسخ احتياطي، ومسح للبيانات والتخزين المحلي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Database size={24} /></div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الموظفين في قاعدة البيانات</p>
              <p className="text-xl font-bold text-slate-800">{employees.length} موظف</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Database size={24} /></div>
            <div>
              <p className="text-sm text-slate-500">إجمالي طلبات الإجازات</p>
              <p className="text-xl font-bold text-slate-800">{leaves.length} طلب</p>
            </div>
          </div>
          <button onClick={handleClearFiles} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium">
            <Trash2 size={16} />
            تفريغ مساحة المرفقات (Images & Files)
          </button>
        </div>

        {/* Custom Branding */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <ImageIcon size={20} className="text-blue-500" />
            تخصيص المظهر والشعار
          </h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">شعار المنظومة</p>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">اختر صورة الشعار</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {logo && (
                  <button onClick={handleClearLogo} className="p-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="إزالة الشعار المخصص">
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-600 mb-2">خلفية المنظومة</p>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-600">اختر صورة الخلفية</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                </label>
                {bg && (
                  <button onClick={handleClearBg} className="p-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="إزالة الخلفية المخصصة">
                    <Trash2 size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Save size={20} className="text-blue-500" />
            إدارة البيانات المتقدمة
          </h3>
          
          <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">
            إدارة النسخ الاحتياطية واستعادة البيانات أو إعادة تعيين النظام بالكامل للمطورين.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleBackup}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-blue-200"
              >
                <Download size={20} />
                <span className="text-sm">نسخ احتياطي (تصدير)</span>
              </button>

              <label className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl flex flex-col items-center justify-center gap-2 font-medium transition-colors border border-emerald-200 cursor-pointer">
                <Upload size={20} />
                <span className="text-sm">استعادة (استيراد)</span>
                <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
              </label>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button 
                onClick={handleFactoryReset}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors border border-red-200"
              >
                <AlertTriangle size={20} />
                إعادة ضبط المصنع بالكامل (مسح نهائي)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
