import React, { useState } from 'react';
import { X, Plus, Users, User, CheckCircle2, Shield, DollarSign, Calendar, Type, AlignLeft } from 'lucide-react';
import { CustomField, GlobalCustomField } from '../types';
import { toast } from './Toast';

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  employeeName?: string;
  onSave: (fieldData: {
    label: string;
    section: string;
    scope: 'employee' | 'global';
    isRequired: boolean;
    type: 'text' | 'number' | 'date';
    width: '1' | '2' | '3';
    initialValue?: string;
  }) => void;
}

export default function CustomFieldModal({
  isOpen,
  onClose,
  section,
  employeeName,
  onSave
}: CustomFieldModalProps) {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState<'employee' | 'global'>('employee');
  const [isRequired, setIsRequired] = useState(false);
  const [type, setType] = useState<'text' | 'number' | 'date'>('text');
  const [width, setWidth] = useState<'1' | '2' | '3'>('1');
  const [initialValue, setInitialValue] = useState('');
  const [targetSection, setTargetSection] = useState(section || 'basic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast('يرجى كتابة اسم الحقل / الزر');
      return;
    }

    onSave({
      label: label.trim(),
      section: targetSection,
      scope,
      isRequired,
      type,
      width,
      initialValue: initialValue.trim()
    });

    toast(
      scope === 'employee'
        ? `تم إضافة الحقل "${label}" لهذا الموظف بنجاح!`
        : `تم إضافة الحقل "${label}" لجميع الموظفين بنجاح!`
    );

    // Reset and close
    setLabel('');
    setInitialValue('');
    setIsRequired(false);
    onClose();
  };

  const sectionName = 
    targetSection === 'basic' ? 'المعلومات الأساسية' :
    targetSection === 'work' ? 'معلومات العمل' : 'المعلومات الشخصية';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Plus size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إضافة حقل / بند مخصص (صلاحية المدير)</h2>
              <p className="text-xs text-emerald-100 mt-0.5">أضف حقولاً مخصصة مثل قيمة المرتب، رقم الحساب، أو غيرها</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Scope Selection: Employee vs Global */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              نطاق ظهور الحقل (أين تريد إظهار هذا الحقل؟) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('employee')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  scope === 'employee'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${scope === 'employee' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <User size={18} />
                  </div>
                  {scope === 'employee' && <CheckCircle2 size={18} className="text-emerald-600" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">لهذا الموظف فقط</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {employeeName ? `يظهر في ملف "${employeeName}" فقط ولا يظهر للآخرين` : 'يظهر في ملف هذا الموظف فقط'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('global')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  scope === 'global'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${scope === 'global' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Users size={18} />
                  </div>
                  {scope === 'global' && <CheckCircle2 size={18} className="text-blue-600" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">لجميع الموظفين</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    يظهر هذا الحقل لجميع الموظفين الحاليين والجدد في المنظومة
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Field Label */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              عنوان الحقل أو الزر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="مثال: قيمة المرتب، رقم الحساب المصرفي، فرع الصرف، سيارة عهدة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Quick presets for common fields */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-1.5">اقتراحات شائعة:</span>
            <div className="flex flex-wrap gap-1.5">
              {['قيمة المرتب الأساسي', 'رقم الحساب المصرفي', 'اسم المصرف والفرع', 'بدل سكن / نقل', 'الرقم المالي'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setLabel(preset);
                    if (preset.includes('مرتب') || preset.includes('بدل') || preset.includes('مالي')) {
                      setType('number');
                    }
                  }}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Field Type and Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">نوع البيانات</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="text">نص عادي</option>
                <option value="number">رقم / قيمة مالية (بالدينار)</option>
                <option value="date">تاريخ</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">قسم الظهور</label>
              <select
                value={targetSection}
                onChange={e => setTargetSection(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="basic">المعلومات الأساسية</option>
                <option value="work">معلومات العمل</option>
                <option value="personal">المعلومات الشخصية</option>
                <option value="bank">بيانات المصرف والحساب</option>
              </select>
            </div>
          </div>

          {/* Required/Optional Switch */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">هل الحقل إجباري التعبئة؟</span>
              <span className="text-[11px] text-slate-500">
                {isRequired ? 'لن يُسمح بحفظ الموظف إذا تُرك هذا الحقل فارغاً' : 'يمكن ترك هذا الحقل فارغاً دون منع الحفظ'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isRequired 
                  ? 'bg-red-500 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isRequired ? 'إجباري (مطلوب)' : 'اختياري'}
            </button>
          </div>

          {/* Initial Value (if for this employee) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              القيمة الأولية {scope === 'employee' ? '(لهذا الموظف)' : '(اختياري)'}
            </label>
            <input
              type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
              value={initialValue}
              onChange={e => setInitialValue(e.target.value)}
              placeholder={type === 'number' ? 'أدخل القيمة الرقمية (مثال: 3500)' : 'أدخل القيمة...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm shadow-emerald-200 flex items-center gap-1.5"
            >
              <Plus size={16} />
              إضافة الحقل
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
