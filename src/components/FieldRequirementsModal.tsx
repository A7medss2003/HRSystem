import React, { useState } from 'react';
import { X, Check, Search, ShieldCheck, Lock, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { SYSTEM_FIELDS_CONFIG } from '../lib/fieldConfig';
import { useStore } from '../store';
import { toast } from './Toast';

interface FieldRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FieldRequirementsModal({ isOpen, onClose }: FieldRequirementsModalProps) {
  const { requiredFields, setRequiredFieldsBatch, addSystemLog } = useStore();
  const [localRequirements, setLocalRequirements] = useState<Record<string, boolean>>(() => ({
    ...(requiredFields || {}),
    fullName: true, // Always required
  }));
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<'all' | 'basic' | 'work' | 'personal'>('all');

  if (!isOpen) return null;

  const toggleField = (key: string) => {
    if (key === 'fullName') {
      toast('حقل الاسم الكامل إجباري دائماً ولا يمكن جعله اختيارياً');
      return;
    }
    setLocalRequirements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMakeAllOptional = () => {
    const next: Record<string, boolean> = { fullName: true };
    setLocalRequirements(next);
    toast('تم ضبط جميع البيانات كاختيارية (باستثناء الاسم الكامل)');
  };

  const handleSave = () => {
    setRequiredFieldsBatch({
      ...localRequirements,
      fullName: true,
    });
    addSystemLog({
      userId: 'admin',
      userName: 'المدير',
      action: 'تخصيص الحقول',
      details: 'تم تحديث إعدادات الحقول الإلزامية والاختيارية للموظفين'
    });
    toast('تم حفظ إعدادات حقول الموظفين بنجاح!');
    onClose();
  };

  const filteredFields = SYSTEM_FIELDS_CONFIG.filter(field => {
    const matchesSearch = field.label.toLowerCase().includes(search.toLowerCase());
    const matchesSection = selectedSection === 'all' || field.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const totalRequiredCount = Object.entries(localRequirements).filter(([_, req]) => req).length;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <SlidersHorizontal size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تخصيص الحقول (إجباري / اختياري)</h2>
              <p className="text-xs text-blue-100 mt-0.5">تحكم في الحقول التي يلزم الموظف أو المستخدم تعبئتها</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-100 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>تنبيه الإدارة:</strong> بشكل افتراضي تكون جميع الحقول <span className="font-bold underline">اختيارية التعبئة</span> باستثناء <strong>الاسم الكامل</strong>. يمكنك تفعيل الإلزام لأي حقل تريده هنا.
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن حقل..."
              className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${selectedSection === 'all' ? 'bg-white font-bold text-blue-700 shadow-sm' : 'text-slate-600'}`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setSelectedSection('basic')}
                className={`px-2.5 py-1 rounded-md transition-colors ${selectedSection === 'basic' ? 'bg-white font-bold text-blue-700 shadow-sm' : 'text-slate-600'}`}
              >
                أساسية
              </button>
              <button
                type="button"
                onClick={() => setSelectedSection('work')}
                className={`px-2.5 py-1 rounded-md transition-colors ${selectedSection === 'work' ? 'bg-white font-bold text-blue-700 shadow-sm' : 'text-slate-600'}`}
              >
                العمل
              </button>
              <button
                type="button"
                onClick={() => setSelectedSection('personal')}
                className={`px-2.5 py-1 rounded-md transition-colors ${selectedSection === 'personal' ? 'bg-white font-bold text-blue-700 shadow-sm' : 'text-slate-600'}`}
              >
                شخصية
              </button>
            </div>

            <button
              type="button"
              onClick={handleMakeAllOptional}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              title="جعل كافة الحقول اختيارية ما عدا الاسم الكامل"
            >
              <RefreshCw size={12} />
              الكل اختياري
            </button>
          </div>
        </div>

        {/* Fields List */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
          {filteredFields.map(field => {
            const isRequired = field.key === 'fullName' ? true : !!localRequirements[field.key];
            const isLocked = field.isPermanentRequired;

            return (
              <div 
                key={field.key}
                onClick={() => !isLocked && toggleField(field.key)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isRequired 
                    ? 'bg-blue-50/60 border-blue-200 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                } ${isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isRequired ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isLocked ? <Lock size={15} /> : isRequired ? <Check size={16} /> : '○'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{field.label}</span>
                      {isLocked && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Lock size={10} />
                          إجباري دائم
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {field.section === 'basic' ? 'المعلومات الأساسية' : field.section === 'work' ? 'معلومات العمل' : 'المعلومات الشخصية'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isRequired 
                      ? 'bg-blue-100 text-blue-800 font-bold' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isRequired ? 'مطلوب (إجباري)' : 'اختياري'}
                  </span>

                  {!isLocked && (
                    <div className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                      isRequired ? 'bg-blue-600 justify-start' : 'bg-slate-300 justify-end'
                    }`}>
                      <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md transform"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredFields.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              لا توجد حقول مطابقة للبحث
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            الحقول الإلزامية حالياً: <strong className="text-blue-700">{totalRequiredCount}</strong> حقل
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm shadow-blue-200 flex items-center gap-1.5"
            >
              <Check size={16} />
              حفظ الإعدادات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
