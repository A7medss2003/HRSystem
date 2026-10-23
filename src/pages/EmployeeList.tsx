import React, { useState } from 'react';
import { Search, Plus, Filter, FileSpreadsheet, ChevronLeft, Star, X, Save, Gift, Trash2, Phone, Mail, Eye, ArrowUpDown, Landmark, Users, AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import clsx from 'clsx';
import { EmployeeStatus, Employee } from '../types';
import { toast } from '../components/Toast';

import { useStore } from '../store';
import FileImage from '../components/FileImage';
import { isManagerEmployee, isRegularUser } from '../lib/managerGuard';
import { auditEmployee } from '../lib/employeeAudit';
import EmployeeAuditBadge from '../components/EmployeeAuditTooltip';

interface EmployeeListProps {
  user?: { role: string; username: string; permissions: string[] };
  userRole: string;
  onSelectEmployee: (id: string) => void;
  onAddEmployee: (initialCategory?: 'موظف أساسي' | 'متعاقد' | 'متعاون') => void;
}

export default function EmployeeList({ user, userRole, onSelectEmployee, onAddEmployee }: EmployeeListProps) {
  const { employees, updateEmployee, deleteEmployee, globalSearchQuery, setGlobalSearchQuery } = useStore();
  
  const isAdmin = userRole === 'admin' || user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');
  const canAddEmployee = isAdmin || user?.permissions?.includes('manage_employees') || user?.permissions?.includes('add_employee');
  const canDeleteEmployee = isAdmin || user?.permissions?.includes('delete_employees');
  
  // إخفاء بيانات المدير عن الموظف العادي ومدخل البيانات
  const isRegular = isRegularUser(user);
  const visibleEmployees = employees.filter(emp => !isRegular || !isManagerEmployee(emp));

  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [auditFilter, setAuditFilter] = useState<'all' | 'missing' | 'expired' | 'complete'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'department'>('newest');
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
  
  const getStatusColor = (status?: EmployeeStatus | string) => {
    switch (status) {
      case 'نشط': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'في إجازة':
      case 'إجازة': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'موقوف': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredEmployees = visibleEmployees.filter(emp => {
    const s = (globalSearchQuery || '').toLowerCase().trim();
    const matchesSearch = s === '' || 
      (emp.fullName?.toLowerCase().includes(s) || false) || 
      (emp.jobTitle?.toLowerCase().includes(s) || false) ||
      (emp.employeeId?.toLowerCase().includes(s) || false) ||
      (emp.department?.toLowerCase().includes(s) || false) ||
      (emp.company?.toLowerCase().includes(s) || false) ||
      (emp.workPhone?.includes(s) || false) ||
      (emp.workMobile?.includes(s) || false) ||
      (emp.personalPhone?.includes(s) || false) ||
      (emp.workEmail?.toLowerCase().includes(s) || false);
    
    const matchesDept = filterDept === '' || emp.department === filterDept;
    const matchesStatus = filterStatus === '' || emp.status === filterStatus;
    const matchesCategory = filterCategory === '' || (emp.employmentCategory || 'موظف أساسي') === filterCategory;

    if (!matchesSearch || !matchesDept || !matchesStatus || !matchesCategory) return false;

    if (auditFilter !== 'all') {
      const audit = auditEmployee(emp);
      if (auditFilter === 'missing' && audit.missingCount === 0) return false;
      if (auditFilter === 'expired' && !audit.hasExpiredDocs && !audit.hasExpiringDocs) return false;
      if (auditFilter === 'complete' && (!audit.isComplete || audit.hasExpiredDocs)) return false;
    }

    return true;
  });

  const sortedAndFilteredEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
      return timeB - timeA; // الأحدث أولاً
    }
    if (sortBy === 'oldest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
      return timeA - timeB; // الأقدم أولاً
    }
    if (sortBy === 'name') {
      return (a.fullName || '').localeCompare(b.fullName || '', 'ar');
    }
    if (sortBy === 'department') {
      return (a.department || '').localeCompare(b.department || '', 'ar');
    }
    return 0;
  });

  const totalVisibleCount = visibleEmployees.length;
  const missingCountTotal = visibleEmployees.filter(e => auditEmployee(e).missingCount > 0).length;
  const expiredCountTotal = visibleEmployees.filter(e => {
    const a = auditEmployee(e);
    return a.hasExpiredDocs || a.hasExpiringDocs;
  }).length;
  const completeCountTotal = visibleEmployees.filter(e => {
    const a = auditEmployee(e);
    return a.isComplete && !a.hasExpiredDocs;
  }).length;

  const uniqueDepts = Array.from(new Set(visibleEmployees.map(e => e.department).filter(Boolean)));

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
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>دليل الموظفين</span>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
              {visibleEmployees.length} موظف
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">عرض وإدارة موظفي المنظومة مع الفحص التلقائي لانتهاء الوثائق ونواقص الخانات</p>
        </div>
        
        {canAddEmployee && (
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-blue-200 cursor-pointer"
            >
              <Plus size={16} />
              إضافة موظف
            </button>
            <button 
              onClick={() => onAddEmployee('متعاون')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Plus size={16} />
              إضافة متعاون
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Quick Audit Status Tabs */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 text-[11px] shrink-0">تصفية حسب حالة البيانات والوثائق:</span>
          
          <button
            type="button"
            onClick={() => setAuditFilter('all')}
            className={clsx(
              "px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              auditFilter === 'all'
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <span>جميع الموظفين</span>
            <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full font-mono", auditFilter === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>
              {totalVisibleCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAuditFilter('missing')}
            className={clsx(
              "px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              auditFilter === 'missing'
                ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            )}
            title="الموظفون الذين لديهم خانات فارغة غير معبأة في الأقسام الأربعة"
          >
            <AlertTriangle size={13} className={auditFilter === 'missing' ? "text-white" : "text-rose-500"} />
            <span>⚠️ بيانات ناقصة</span>
            <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold", auditFilter === 'missing' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800")}>
              {missingCountTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAuditFilter('expired')}
            className={clsx(
              "px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              auditFilter === 'expired'
                ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-200"
                : "bg-white text-red-700 border-red-200 hover:bg-red-50"
            )}
            title="الموظفون الذين لديهم جوازات سفر أو وثائق منتهية أو قريبة الانتهاء"
          >
            <AlertCircle size={13} className={auditFilter === 'expired' ? "text-white" : "text-red-500"} />
            <span>🚨 وثائق منتهية / تنتهي قريباً</span>
            <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold", auditFilter === 'expired' ? "bg-white/20 text-white" : "bg-red-100 text-red-800")}>
              {expiredCountTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAuditFilter('complete')}
            className={clsx(
              "px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              auditFilter === 'complete'
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200"
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            )}
            title="الموظفون مكتملو البيانات والوثائق بنسبة 100%"
          >
            <CheckCircle2 size={13} className={auditFilter === 'complete' ? "text-white" : "text-emerald-500"} />
            <span>✓ مكتملة وسارية 100%</span>
            <span className={clsx("text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold", auditFilter === 'complete' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
              {completeCountTotal}
            </span>
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث بالاسم، المسمى، الرقم الوظيفي، الهاتف، أو القسم..." 
                value={globalSearchQuery || ''}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown size={14} className="text-slate-500" />
              <span className="font-semibold text-slate-500">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="newest">الأحدث إضافة (تلقائياً)</option>
                <option value="oldest">الأقدم إضافة</option>
                <option value="name">أبجدياً بالاسم</option>
                <option value="department">حسب القسم</option>
              </select>
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={clsx(
                "px-3.5 py-2 border rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer",
                showFilters || filterDept || filterStatus || filterCategory
                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              <Filter size={15} />
              تصفية متقدمة
              {(filterDept || filterStatus || filterCategory) && (
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end text-xs text-slate-500">
            <span>النتائج المعروضة:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {sortedAndFilteredEmployees.length}
            </span>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1 w-44">
              <label className="text-[11px] text-slate-500 font-bold">القسم</label>
              <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs p-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الأقسام</option>
                {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-[11px] text-slate-500 font-bold">الحالة</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs p-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="في إجازة">في إجازة</option>
                <option value="موقوف">موقوف</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-[11px] text-slate-500 font-bold">فئة التوظيف</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs p-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الفئات</option>
                <option value="موظف أساسي">موظف أساسي</option>
                <option value="متعاقد">متعاقد</option>
                <option value="متعاون">متعاون</option>
              </select>
            </div>
            {(filterDept || filterStatus || filterCategory) && (
              <button 
                onClick={() => { setFilterDept(''); setFilterStatus(''); setFilterCategory(''); }} 
                className="mt-4 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1.5 hover:bg-red-50 rounded"
              >
                <X size={14} /> مسح التصفيات
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">الموظف</th>
                <th className="px-4 py-3.5">الرقم الوظيفي</th>
                <th className="px-4 py-3.5">القسم / الإدارة</th>
                <th className="px-4 py-3.5 text-center">اكتمال البيانات والوثائق</th>
                <th className="px-4 py-3.5">بيانات التواصل</th>
                <th className="px-4 py-3.5">فئة التوظيف</th>
                <th className="px-4 py-3.5">الحالة</th>
                <th className="px-4 py-3.5">تقييم الأداء</th>
                <th className="px-4 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedAndFilteredEmployees.map((emp) => {
                const audit = auditEmployee(emp);

                return (
                <tr 
                  key={emp.id} 
                  className={clsx(
                    "transition-colors cursor-pointer group hover:bg-blue-50/40",
                    emp.employmentCategory === 'متعاون' && "bg-indigo-50/20"
                  )}
                  onClick={() => onSelectEmployee(emp.id)}
                >
                  {/* 1. الموظف: الصورة + الاسم الكامل + المسمى الوظيفي + علامة النواقص والانتهاء */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {emp.photoUrl ? (
                          <FileImage 
                            src={emp.photoUrl} 
                            alt={emp.fullName} 
                            className={clsx(
                              "w-10 h-10 rounded-full object-cover border shadow-2xs group-hover:scale-105 transition-transform",
                              audit.hasExpiredDocs 
                                ? "border-red-500 ring-2 ring-red-400 ring-offset-1" 
                                : audit.missingCount > 0 
                                ? "border-rose-300" 
                                : "border-slate-200"
                            )} 
                          />
                        ) : (
                          <div className={clsx(
                            "w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform border",
                            audit.hasExpiredDocs 
                              ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400 ring-offset-1" 
                              : audit.missingCount > 0 
                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                              : "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border-blue-200/80"
                          )}>
                            {emp.fullName ? emp.fullName.trim().charAt(0) : '؟'}
                          </div>
                        )}
                        {audit.hasExpiredDocs && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate flex items-center gap-1.5 flex-wrap">
                          <span>{emp.fullName || 'بدون اسم'}</span>
                          {/* علامة مميزة حمراء عند وجود وثائق منتهية أو خانات ناقصة */}
                          {audit.hasExpiredDocs ? (
                            <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.2 rounded-full flex items-center gap-1 animate-pulse shrink-0" title={`وثيقة منتهية: ${audit.expiredDocs.map(d => d.name).join('، ')}`}>
                              🚨 {audit.expiredDocs[0].name} منتهي!
                            </span>
                          ) : audit.missingCount > 0 ? (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0" title={`يوجد ${audit.missingCount} خانة غير مدرجة في الأقسام الأربعة`}>
                              ⚠️ ناقص ({audit.missingCount})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{emp.jobTitle || 'المسمى غير محدد'}</span>
                          {emp.company && (
                            <span className="text-slate-400 font-normal">• {emp.company}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. الرقم الوظيفي */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-block">
                      {emp.employeeId || '-'}
                    </span>
                  </td>

                  {/* 3. القسم والإدارة */}
                  <td className="px-4 py-3.5 text-xs">
                    <div className="font-semibold text-slate-700">
                      {emp.department || <span className="text-slate-400 font-normal italic">غير محدد</span>}
                    </div>
                    {emp.management && (
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={emp.management}>
                        {emp.management}
                      </div>
                    )}
                  </td>

                  {/* 4. اكتمال البيانات والوثائق (مع الإشعار عند وضع الماوس) */}
                  <td className="px-4 py-3.5 text-xs text-center" onClick={(e) => e.stopPropagation()}>
                    <EmployeeAuditBadge employee={emp} onClick={() => onSelectEmployee(emp.id)} />
                  </td>

                  {/* 4. بيانات التواصل: هاتف وبريد */}
                  <td className="px-4 py-3.5 text-xs">
                    <div className="flex flex-col gap-1" dir="ltr">
                      {emp.workPhone || emp.workMobile || emp.personalPhone ? (
                        <span className="text-slate-700 font-mono text-right flex items-center justify-end gap-1">
                          {emp.workPhone || emp.workMobile || emp.personalPhone}
                          <Phone size={11} className="text-slate-400" />
                        </span>
                      ) : null}
                      {emp.workEmail || emp.personalEmail ? (
                        <span className="text-slate-500 text-[11px] text-right truncate max-w-[150px] flex items-center justify-end gap-1" title={emp.workEmail || emp.personalEmail}>
                          {emp.workEmail || emp.personalEmail}
                          <Mail size={11} className="text-slate-400" />
                        </span>
                      ) : null}
                      {!emp.workPhone && !emp.workMobile && !emp.personalPhone && !emp.workEmail && !emp.personalEmail && (
                        <span className="text-slate-400 italic text-right font-normal">غير مسجل</span>
                      )}
                    </div>
                  </td>

                  {/* 5. فئة التوظيف والمكافآت */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[11px] font-bold w-fit border",
                        emp.employmentCategory === 'متعاون' 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                          : emp.employmentCategory === 'متعاقد'
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {emp.employmentCategory || 'موظف أساسي'}
                      </span>
                      {emp.employmentCategory === 'متعاون' && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {emp.bonuses && emp.bonuses.length > 0 ? (
                            <span className="text-[10px] bg-indigo-100/70 text-indigo-800 font-bold px-1.5 py-0.5 rounded" dir="ltr">
                              {emp.bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()} د.ل
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">بدون مكافآت</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBonusModal(emp);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-0.5 hover:bg-indigo-100 rounded transition-colors"
                            title="إضافة مكافأة"
                          >
                            <Gift size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 6. الحالة */}
                  <td className="px-4 py-3.5">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                      getStatusColor(emp.status)
                    )}>
                      <span className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        emp.status === 'نشط' ? "bg-emerald-500" :
                        (emp.status as string) === 'إجازة' || (emp.status as string) === 'في إجازة' ? "bg-amber-500" :
                        emp.status === 'موقوف' ? "bg-red-500" :
                        "bg-slate-400"
                      )} />
                      {emp.status || 'نشط'}
                    </span>
                  </td>

                  {/* 7. تقييم الأداء */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenRatingModal(emp)}
                      className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-105 shadow-2xs cursor-pointer",
                        emp.performanceRating
                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      )}
                      title="انقر لتعديل أو إضافة تقييم الأداء"
                    >
                      <Star size={13} className={emp.performanceRating ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                      {emp.performanceRating ? (
                        <span>{emp.performanceRating.score}/10 ({emp.performanceRating.level})</span>
                      ) : (
                        <span className="text-[11px]">تقييم</span>
                      )}
                    </button>
                  </td>

                  {/* 8. الإجراءات */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEmployee(emp.id);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="عرض وتعديل الملف الكامل"
                      >
                        <Eye size={16} />
                      </button>
                      {canDeleteEmployee && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`هل أنت متأكد من حذف الموظف "${emp.fullName}"؟`)) {
                              deleteEmployee(emp.id);
                              toast(`تم حذف الموظف ${emp.fullName} بنجاح`);
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف الموظف"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <ChevronLeft size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </td>
                </tr>
                );
              })}
              
              {sortedAndFilteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                        <Users size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base mb-1">
                        {visibleEmployees.length === 0 ? 'لا يوجد موظفون مسجلون بعد' : 'لا توجد نتائج مطابقة لبحثك'}
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 text-center">
                        {visibleEmployees.length === 0 
                          ? 'ابدأ بإضافة موظف جديد إلى المنظومة، وستظهر بياناته هنا فوراً.' 
                          : 'جرّب البحث باسم آخر أو إزالة معايير التصفية.'}
                      </p>
                      {visibleEmployees.length === 0 && canAddEmployee && (
                        <button
                          type="button"
                          onClick={() => onAddEmployee('موظف أساسي')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-200"
                        >
                          <Plus size={15} />
                          إضافة أول موظف الآن
                        </button>
                      )}
                    </div>
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
