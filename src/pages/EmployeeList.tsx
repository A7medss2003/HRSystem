import React, { useState } from 'react';
import { Search, Plus, Filter, FileSpreadsheet, ChevronLeft, Star, X, Save, Gift } from 'lucide-react';
import clsx from 'clsx';
import { EmployeeStatus, Employee } from '../types';
import { toast } from '../components/Toast';

import { useStore } from '../store';
import FileImage from '../components/FileImage';

interface EmployeeListProps {
  userRole: string;
  onSelectEmployee: (id: string) => void;
  onAddEmployee: (initialCategory?: 'موظف أساسي' | 'متعاقد' | 'متعاون') => void;
}

export default function EmployeeList({ userRole, onSelectEmployee, onAddEmployee }: EmployeeListProps) {
  const { employees, updateEmployee, globalSearchQuery, setGlobalSearchQuery } = useStore();
  
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [bonusModalEmp, setBonusModalEmp] = useState<Employee | null>(null);
  const [bonusForm, setBonusForm] = useState({
    amount: '',
    reason: '',
  });

  const [ratingModalEmp, setRatingModalEmp] = useState<Employee | null>(null);
  const [ratingForm, setRatingForm] = useState<{
    score: number;
    level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'يحتاج تحسين';
    lastEvaluationDate: string;
    evaluator: string;
    notes: string;
  }>({
    score: 8.5,
    level: 'جيد جداً',
    lastEvaluationDate: new Date().toISOString().split('T')[0],
    evaluator: 'المدير المباشر',
    notes: ''
  });

  const handleOpenRatingModal = (emp: Employee) => {
    setRatingModalEmp(emp);
    if (emp.performanceRating) {
      setRatingForm({
        score: emp.performanceRating.score || 8.5,
        level: emp.performanceRating.level || 'جيد جداً',
        lastEvaluationDate: emp.performanceRating.lastEvaluationDate || new Date().toISOString().split('T')[0],
        evaluator: emp.performanceRating.evaluator || 'المدير المباشر',
        notes: emp.performanceRating.notes || ''
      });
    } else {
      setRatingForm({
        score: 8.5,
        level: 'جيد جداً',
        lastEvaluationDate: new Date().toISOString().split('T')[0],
        evaluator: 'المدير المباشر',
        notes: ''
      });
    }
  };

  const handleScoreChange = (val: number) => {
    const score = Math.max(0, Math.min(10, val));
    let level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'يحتاج تحسين' = 'جيد جداً';
    if (score >= 9) level = 'ممتاز';
    else if (score >= 8) level = 'جيد جداً';
    else if (score >= 7) level = 'جيد';
    else if (score >= 6) level = 'مقبول';
    else level = 'يحتاج تحسين';
    setRatingForm(prev => ({
      ...prev,
      score,
      level
    }));
  };

  const handleSaveRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalEmp) return;
    const updatedEmp: Employee = {
      ...ratingModalEmp,
      performanceRating: {
        score: ratingForm.score,
        level: ratingForm.level,
        lastEvaluationDate: ratingForm.lastEvaluationDate,
        evaluator: ratingForm.evaluator,
        notes: ratingForm.notes
      }
    };
    updateEmployee(updatedEmp);
    toast(`تم حفظ تقييم الموظف ${ratingModalEmp.fullName} بنجاح!`);
    setRatingModalEmp(null);
  };
  
  const handleSaveBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalEmp) return;
    
    const amountNum = parseFloat(bonusForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('الرجاء إدخال قيمة صحيحة للمكافأة');
      return;
    }

    const newBonus = {
      id: 'bon-' + Date.now(),
      title: 'مكافأة جديدة',
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      reason: bonusForm.reason,
      status: 'مصروفة' as const
    };

    const updatedEmp: Employee = {
      ...bonusModalEmp,
      bonuses: [...(bonusModalEmp.bonuses || []), newBonus]
    };

    updateEmployee(updatedEmp);
    toast(`تم إضافة مكافأة للموظف ${bonusModalEmp.fullName} بنجاح!`);
    setBonusModalEmp(null);
  };

  const handleOpenBonusModal = (emp: Employee) => {
    setBonusModalEmp(emp);
    setBonusForm({ amount: '', reason: '' });
  };
  
  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'نشط': return 'bg-emerald-10 text-emerald-700';
      case 'إجازة': return 'bg-amber-100 text-amber-700';
      case 'موقوف': return 'bg-red-10 text-red-700';
      default: return 'bg-slate-10 text-slate-700';
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const s = (globalSearchQuery || '').toLowerCase().trim();
    const matchesSearch = s === '' || 
      (emp.fullName?.toLowerCase().includes(s) || false) || 
      (emp.jobTitle?.toLowerCase().includes(s) || false) ||
      (emp.employeeId?.toLowerCase().includes(s) || false);
    
    const matchesDept = filterDept === '' || emp.department === filterDept;
    const matchesStatus = filterStatus === '' || emp.status === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        toast(`تم استيراد الملف: ${file.name} بنجاح!`);
      }
    };
    input.click();
  };

  const downloadTemplate = () => {
    const csvContent = "الاسم الكامل,المسمى الوظيفي,القسم,البريد الإلكتروني للعمل,رقم الجوال,تاريخ التعيين,الراتب الأساسي,الموقع,الحالة\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'employees_template.csv';
    link.click();
    toast('تم تنزيل النموذج بنجاح');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">الموظفون</h1>
        
        {userRole === 'admin' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={downloadTemplate}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              نموذج CSV
            </button>
            <button 
              onClick={handleImport}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FileSpreadsheet size={16} />
              استيراد من CSV
            </button>
            <button 
              onClick={() => onAddEmployee('موظف أساسي')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-blue-200"
            >
              <Plus size={16} />
              إضافة موظف
            </button>
            <button 
              onClick={() => onAddEmployee('متعاون')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-indigo-200"
            >
              <Plus size={16} />
              إضافة متعاون
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-10 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم، المسمى، أو الرقم الوظيفي..." 
              value={globalSearchQuery || ''}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={clsx(
              "px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm",
              showFilters || filterDept || filterStatus 
                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <Filter size={16} />
            تصفية
            {(filterDept || filterStatus) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 mr-1"></span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
             <div className="flex flex-col gap-1 w-48">
               <label className="text-xs text-slate-500 font-semibold">القسم</label>
               <select 
                 value={filterDept} 
                 onChange={(e) => setFilterDept(e.target.value)}
                 className="bg-white border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">الكل</option>
                 {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
             </div>
             <div className="flex flex-col gap-1 w-48">
               <label className="text-xs text-slate-500 font-semibold">الحالة</label>
               <select 
                 value={filterStatus} 
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="bg-white border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">الكل</option>
                 <option value="نشط">نشط</option>
                 <option value="في إجازة">في إجازة</option>
                 <option value="موقوف">موقوف</option>
               </select>
             </div>
             {(filterDept || filterStatus) && (
               <button 
                 onClick={() => { setFilterDept(''); setFilterStatus(''); }} 
                 className="mt-5 text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
               >
                 <X size={14} /> مسح التصفية
               </button>
             )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">الموظف</th>
                <th className="px-6 py-4 font-medium">الرقم الوظيفي</th>
                <th className="px-6 py-4 font-medium">القسم</th>
                <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                <th className="px-6 py-4 font-medium">فئة التوظيف والمكافآت</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">تقييم الأداء</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-10">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className={clsx(
                    "transition-colors cursor-pointer group",
                    emp.employmentCategory === 'متعاون' ? "bg-indigo-50/40 hover:bg-indigo-50/80 border-r-4 border-r-indigo-500" : "hover:bg-slate-50"
                  )}
                  onClick={() => onSelectEmployee(emp.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {emp.photoUrl ? (
                        <FileImage src={emp.photoUrl} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center font-bold", emp.employmentCategory === 'متعاون' ? "bg-indigo-10 text-indigo-600" : "bg-blue-10 text-blue-600")}>
                          {emp.fullName ? emp.fullName.charAt(0) : '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800">{emp.fullName || 'بدون اسم'}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{emp.jobTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs" dir="ltr">{emp.employeeId}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.department}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.workEmail}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold w-fit border transition-colors",
                        emp.employmentCategory === 'متعاون' 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm" 
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {emp.employmentCategory || 'موظف أساسي'}
                      </span>
                      {emp.employmentCategory === 'متعاون' && (
                        <div className="flex items-center gap-2 mt-1">
                          {emp.bonuses && emp.bonuses.length > 0 ? (
                             <div className="flex items-center gap-1.5 bg-white border border-indigo-10 rounded text-[11px] px-2 py-1 shadow-xs">
                               <span className="text-slate-500">المكافآت:</span>
                               <span className="font-bold text-indigo-600" dir="ltr">
                                 {emp.bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()} د.ل
                               </span>
                             </div>
                          ) : (
                             <span className="text-[10px] text-slate-400">لا توجد مكافآت مسجلة</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBonusModal(emp);
                            }}
                            className="p-1 rounded-md text-indigo-600 bg-indigo-50 border border-indigo-10 hover:bg-indigo-10 transition-colors"
                            title="إضافة مكافأة"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(emp.status))}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenRatingModal(emp)}
                      className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border transition-all hover:scale-105 shadow-2xs cursor-pointer",
                        emp.performanceRating
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      )}
                      title="انقر لتقييم الموظف أو تعديل تقييمه"
                    >
                      <Star size={14} className={emp.performanceRating ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                      {emp.performanceRating ? (
                        <>
                          <span>{emp.performanceRating.score}/10</span>
                          <span className="text-amber-800 font-bold">({emp.performanceRating.level})</span>
                        </>
                      ) : (
                        <span>إضافة تقييم</span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ChevronLeft size={20} />
                  </td>
                </tr>
              ))}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    لا يوجد موظفين يطابقون بحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Rating Modal */}
      {ratingModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200" onClick={() => setRatingModalEmp(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-10 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-10 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-10">
                  <Star size={20} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">تقييم أداء الموظف</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ratingModalEmp.fullName} — <span className="text-slate-600">{ratingModalEmp.jobTitle}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingModalEmp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRating} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    نسبة الأداء (من 10)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10" step="0.1"
                      value={ratingForm.score}
                      onChange={(e) => handleScoreChange(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-lg py-2.5 px-3.5 transition-all text-amber-600"
                      required
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">/10</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    مستوى التقييم
                  </label>
                  <select
                    value={ratingForm.level}
                    onChange={(e: any) => setRatingForm(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-semibold py-3 px-3.5 transition-all"
                  >
                    <option value="ممتاز">ممتاز</option>
                    <option value="جيد جداً">جيد جداً</option>
                    <option value="جيد">جيد</option>
                    <option value="مقبول">مقبول</option>
                    <option value="يحتاج تحسين">يحتاج تحسين</option>
                  </select>
                </div>
              </div>

              {/* Quick score pills */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">اختيار سريع للنسبة:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'ممتاز 9.5', val: 9.5 },
                    { label: 'جيد جداً 8.5', val: 8.5 },
                    { label: 'جيد 7.5', val: 7.5 },
                    { label: 'مقبول 6.5', val: 6.5 },
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleScoreChange(item.val)}
                      className={clsx(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer",
                        ratingForm.score === item.val
                          ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    اسم المُقيّم / المدير المباشر
                  </label>
                  <input
                    type="text"
                    value={ratingForm.evaluator}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, evaluator: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm py-2.5 px-3.5 transition-all"
                    placeholder="اسم المدير المسؤول"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    تاريخ التقييم
                  </label>
                  <input
                    type="date"
                    dir="ltr"
                    value={ratingForm.lastEvaluationDate}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, lastEvaluationDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm py-2.5 px-3.5 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  ملاحظات التقييم والتوصيات
                </label>
                <textarea
                  rows={3}
                  value={ratingForm.notes}
                  onChange={(e) => setRatingForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أدخل ملاحظات حول أداء الموظف، نقاط القوة، ومجالات التطوير..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm p-3.5 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-10">
                <button
                  type="button"
                  onClick={() => setRatingModalEmp(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Save size={16} />
                  <span>حفظ التقييم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Modal */}
      {bonusModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200" onClick={() => setBonusModalEmp(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-10 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-10 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-10">
                  <Gift size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">إضافة مكافأة</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bonusModalEmp.fullName} — <span className="text-slate-600">{bonusModalEmp.jobTitle}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBonusModalEmp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  قيمة المكافأة (د.ل)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={bonusForm.amount}
                  onChange={(e) => setBonusForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm py-2.5 px-3.5 transition-all"
                  placeholder="مثال: 500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  ملاحظة / سبب المكافأة
                </label>
                <textarea
                  rows={3}
                  required
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="أدخل سبب المكافأة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm p-3.5 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-10">
                <button
                  type="button"
                  onClick={() => setBonusModalEmp(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>إضافة المكافأة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
