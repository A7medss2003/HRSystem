import React, { useState, useEffect } from 'react';
import { Shield, Search, User, Check, AlertCircle, Save, CheckCircle2, UserCheck, Sparkles, UserPlus, Info } from 'lucide-react';
import { useStore } from '../store';
import { Employee } from '../types';
import { toast } from '../components/Toast';

export default function Roles() {
  const { employees, updateEmployee, addSystemLog } = useStore();
  const [search, setSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Local state for permissions of selected employee before saving
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('employee');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  // When switching selected employee, reset local state to their current settings
  useEffect(() => {
    if (selectedEmp) {
      setCurrentPermissions(selectedEmp.customPermissions || []);
      setCurrentRole(selectedEmp.defaultRole || 'employee');
      setHasUnsavedChanges(false);
      setSaveSuccess(false);
    }
  }, [selectedEmpId]);

  const handleTogglePerm = (permId: string) => {
    if (!selectedEmp) return;
    
    let updatedPerms = [...currentPermissions];
    let updatedRole = currentRole;
    
    if (permId === 'all') {
      const isChecked = updatedPerms.includes('all') || updatedRole === 'admin';
      if (isChecked) {
        updatedRole = 'employee';
        updatedPerms = updatedPerms.filter(p => p !== 'all');
      } else {
        updatedRole = 'admin';
        updatedPerms = ['all', 'manage_employees', 'add_employee', 'view_dashboard', 'view_payroll', 'manage_attendance', 'manage_leaves', 'manage_settings', 'delete_employees'];
      }
    } else {
      if (updatedPerms.includes(permId)) {
        updatedPerms = updatedPerms.filter(p => p !== permId);
      } else {
        updatedPerms = [...updatedPerms, permId];
        // If adding add_employee, also ensure manage_employees is present so directory is visible
        if (permId === 'add_employee' && !updatedPerms.includes('manage_employees')) {
          updatedPerms.push('manage_employees');
        }
      }
      // If was admin and unchecked something specific, downgrade to employee role
      if (updatedRole === 'admin' && permId !== 'all') {
        updatedPerms = updatedPerms.filter(p => p !== 'all');
        updatedRole = 'employee';
      }
    }
    
    setCurrentPermissions(updatedPerms);
    setCurrentRole(updatedRole);
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleApplyPreset = (preset: 'data_entry' | 'admin' | 'accountant' | 'attendance' | 'regular') => {
    if (!selectedEmp) return;

    if (preset === 'data_entry') {
      // Data entry specialist: can add and manage employees, CANNOT access settings, payroll or delete
      setCurrentPermissions(['manage_employees', 'add_employee', 'request_leave']);
      setCurrentRole('employee');
      toast(`تم تحديد صلاحيات "مسجل بيانات فقط" للموظف ${selectedEmp.fullName}. اضغط حفظ لتأكيدها.`);
    } else if (preset === 'admin') {
      setCurrentPermissions(['all', 'manage_employees', 'add_employee', 'delete_employees', 'view_dashboard', 'view_payroll', 'manage_attendance', 'manage_leaves', 'manage_settings']);
      setCurrentRole('admin');
      toast(`تم تحديد صلاحيات "مدير عام" للموظف ${selectedEmp.fullName}. اضغط حفظ لتأكيدها.`);
    } else if (preset === 'accountant') {
      setCurrentPermissions(['view_payroll', 'view_dashboard', 'request_leave']);
      setCurrentRole('accountant');
      toast(`تم تحديد صلاحيات "محاسب / مالية" للموظف ${selectedEmp.fullName}. اضغط حفظ لتأكيدها.`);
    } else if (preset === 'attendance') {
      setCurrentPermissions(['manage_attendance', 'manage_leaves', 'request_leave']);
      setCurrentRole('employee');
      toast(`تم تحديد صلاحيات "مسؤول حضور وإجازات" للموظف ${selectedEmp.fullName}. اضغط حفظ لتأكيدها.`);
    } else if (preset === 'regular') {
      setCurrentPermissions(['request_leave']);
      setCurrentRole('employee');
      toast(`تم تحديد صلاحيات "موظف عادي" للموظف ${selectedEmp.fullName}. اضغط حفظ لتأكيدها.`);
    }

    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSavePermissions = () => {
    if (!selectedEmp) return;

    const updatedEmp: Employee = {
      ...selectedEmp,
      customPermissions: currentPermissions,
      defaultRole: currentRole
    };

    updateEmployee(updatedEmp);
    addSystemLog({
      userId: 'admin',
      userName: 'المدير',
      action: 'تعديل صلاحيات',
      details: `تم تحديث وحفظ صلاحيات الموظف ${selectedEmp.fullName} (${currentPermissions.join(', ') || 'بدون صلاحيات إضافية'})`
    });

    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    toast(`تم حفظ وتثبيت صلاحيات الموظف "${selectedEmp.fullName}" بنجاح!`);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  const permsList = [
    { 
      id: 'manage_employees', 
      label: 'إدارة وتصفح الموظفين (دليل الموظفين وتعديل البيانات)', 
      desc: 'تتيح للموظف فتح قسم الموظفين، استعراض بياناتهم، وتحديث بيانات الموظفين المسجلين.',
      badge: 'أساسي لمسجل البيانات',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      id: 'add_employee', 
      label: 'إضافة موظف جديد وتسجيل البيانات (زر إضافة موظف)', 
      desc: 'تتيح ظهور زر "إضافة موظف"، "إضافة متعاون"، واستيراد CSV لمسجل البيانات لإدخال موظفين جدد.',
      badge: 'خاص بمسجل البيانات',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      id: 'delete_employees', 
      label: 'صلاحية حذف الموظفين', 
      desc: 'تمكين الموظف من حذف سجلات الموظفين نهائياً من النظام. (يُوصى بعدم تفعيلها لمسجل البيانات).',
      badge: 'حساسة (للمدير)',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    },
    { 
      id: 'view_dashboard', 
      label: 'لوحة التحكم والإحصائيات العامة', 
      desc: 'مشاهدة إحصائيات الموظفين، المؤشرات السريعة، وتنبيهات العقود والإقامات.',
      badge: 'إحصائيات',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    { 
      id: 'view_payroll', 
      label: 'إدارة الرواتب والمالية', 
      desc: 'الاطلاع على الرواتب الشهرية والبدلات والمكافآت وإصدار كشوفات الرواتب.',
      badge: 'مالية',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    { 
      id: 'manage_attendance', 
      label: 'إدارة الحضور والانصراف', 
      desc: 'تسجيل ومتابعة سجلات وأوقات حضور وغياب جميع الموظفين في المنظومة.',
      badge: 'متابعة',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    { 
      id: 'manage_leaves', 
      label: 'إدارة طلبات الإجازات', 
      desc: 'مراجعة واعتماد أو رفض طلبات إجازات الموظفين وإدارة الأرصدة.',
      badge: 'إجازات',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    { 
      id: 'manage_settings', 
      label: 'إعدادات المنظومة (بيانات الشركة والمظهر والنسخ الاحتياطي)', 
      desc: 'التحكم بإعدادات الشركة، النسخ الاحتياطي، المظهر، وكلمات المرور. (لا تظهر لمسجل البيانات إلا إذا حُددت له هنا).',
      badge: 'إدارة النظام',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    { 
      id: 'request_leave', 
      label: 'تقديم طلب إجازة (حساب الموظف الشخصي)', 
      desc: 'تمكين الموظف من الدخول وتقديم طلب إجازة لنفسه ومتابعة رصيده الشخصي.',
      badge: 'خدمة ذاتية',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      id: 'all', 
      label: 'مدير عام (صلاحيات كاملة شاملة لكافة أجزاء المنظومة)', 
      desc: 'صلاحيات إدارية مطلقة تشمل جميع الشاشات والوظائف بما فيها التوظيف وإدارة الصلاحيات.',
      badge: 'مدير عام',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
  ];

  const isFullAdmin = currentRole === 'admin' || currentPermissions.includes('all');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            صلاحيات المستخدمين والمسؤولين
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            حدد صلاحيات كل موظف بدقة (تسجيل البيانات، إضافة الموظفين، الرواتب، الإعدادات) مع زر الحفظ المباشر في نفس المكان.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن موظف بالاسم أو الرقم الوظيفي..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredEmployees.map(emp => {
              const isSelected = selectedEmpId === emp.id;
              const hasAdmin = emp.defaultRole === 'admin' || (emp.customPermissions || []).includes('all');
              const hasDataEntry = (emp.customPermissions || []).includes('add_employee') || (emp.customPermissions || []).includes('manage_employees');
              
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/90 border border-indigo-200 shadow-xs' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate text-sm flex items-center justify-between">
                      <span>{emp.fullName}</span>
                      {hasAdmin ? (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">مدير</span>
                      ) : hasDataEntry ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">مسجل بيانات</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {emp.jobTitle || 'موظف'} • <span className="font-mono text-[11px]">{emp.employeeId}</span>
                    </div>
                  </div>
                  {((emp.customPermissions && emp.customPermissions.length > 0) || emp.defaultRole === 'admin') && (
                    <Shield size={14} className="text-indigo-500 shrink-0" />
                  )}
                </button>
              );
            })}
            {filteredEmployees.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                لا يوجد موظف مطابق للبحث
              </div>
            )}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="lg:col-span-2">
          {selectedEmp ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col space-y-6 animate-in fade-in duration-200">
              
              {/* Header and In-Place Save Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <User size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-800">{selectedEmp.fullName}</h2>
                      {isFullAdmin ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          مدير عام
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {currentRole === 'accountant' ? 'محاسب' : 'موظف'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      المسمى: <span className="font-semibold text-slate-700">{selectedEmp.jobTitle}</span> • الرقم الوظيفي: <span className="font-mono font-semibold text-slate-700">{selectedEmp.employeeId}</span>
                    </p>
                  </div>
                </div>

                {/* زر الحفظ في نفس المكان بالأعلى */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                      saveSuccess
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : hasUnsavedChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 size={18} />
                        تم الحفظ بنجاح!
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>حفظ الصلاحيات لهذا الموظف</span>
                        {hasUnsavedChanges && (
                          <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Unsaved changes alert */}
              {hasUnsavedChanges && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    <span className="font-medium">
                      تنبيه: قمت بتعديل الصلاحيات للموظف. اضغط على زر <strong>"حفظ الصلاحيات"</strong> لتطبيقها وتثبيتها الآن.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    حفظ التعديلات الآن
                  </button>
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500" />
                  قوالب صلاحيات جاهزة بنقرة واحدة:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('data_entry')}
                    className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <UserPlus size={14} />
                    مسجل بيانات فقط (تسجيل وإضافة الموظفين)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('admin')}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Shield size={14} />
                    مدير عام (صلاحيات كاملة)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('accountant')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    محاسب / مالية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('attendance')}
                    className="px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    حضور وإجازات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('regular')}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    موظف عادي (طلب إجازة فقط)
                  </button>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-indigo-600" />
                    قائمة الصلاحيات المتاحة (حدد ما يظهر وما يُسمح به للموظف):
                  </h3>
                  <span className="text-xs text-slate-500">
                    تم تحديد: <strong className="text-indigo-600 font-mono">{isFullAdmin ? 'كامل الصلاحيات' : `${currentPermissions.length} صلاحيات`}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {permsList.map(perm => {
                    const isChecked = currentPermissions.includes(perm.id) || (perm.id === 'all' && isFullAdmin) || isFullAdmin;
                    
                    return (
                      <label 
                        key={perm.id} 
                        className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all duration-150 ${
                          isChecked 
                            ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePerm(perm.id)}
                          disabled={isFullAdmin && perm.id !== 'all'}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-bold ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                              {perm.label}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${perm.badgeColor}`}>
                              {perm.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {perm.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Informative Guidance */}
              <div className="bg-blue-50 text-blue-900 p-4 rounded-xl flex gap-3 text-xs border border-blue-200">
                <Info className="shrink-0 mt-0.5 text-blue-600" size={18} />
                <div className="space-y-1">
                  <p className="font-bold">توضيح هام بخصوص مسجل البيانات وإعدادات المنظومة:</p>
                  <p>
                    - إذا أردت أن يقوم الموظف <strong>بتسجيل البيانات فقط</strong>، فعّل له صلاحية <strong>"إدارة وتصفح الموظفين"</strong> وصلاحية <strong>"إضافة موظف جديد وتسجيل البيانات"</strong>.
                  </p>
                  <p>
                    - <strong>إعدادات المنظومة:</strong> لن تظهر له أبداً ولن يدخل عليها إلا إذا قمت باختيار وتفعيل صلاحية "إعدادات المنظومة" له بشكل صريح.
                  </p>
                  <p>
                    - <strong>زر الحفظ:</strong> انقر دائماً على زر <strong>"حفظ الصلاحيات"</strong> الموضح بالأعلى وبالأسفل ليتم حفظ التعديلات وتثبيتها له فوراً.
                  </p>
                </div>
              </div>

              {/* Bottom In-Place Save Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl">
                <div className="text-xs text-slate-600 text-center sm:text-right">
                  {hasUnsavedChanges ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertCircle size={15} />
                      لديك تعديلات غير محفوظة للموظف ({selectedEmp.fullName})
                    </span>
                  ) : saveSuccess ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={15} />
                      تم حفظ وتثبيت كافة الصلاحيات بنجاح
                    </span>
                  ) : (
                    <span>الصلاحيات الحالية محفوظة ومفعلة في النظام</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      saveSuccess
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : hasUnsavedChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 size={18} />
                        تم الحفظ بنجاح!
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        حفظ الصلاحيات في نفس المكان
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 border-dashed rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[440px]">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center mb-3">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">الرجاء اختيار موظف من القائمة</h3>
              <p className="text-sm max-w-sm text-slate-500">
                انقر على أي موظف من القائمة بالجانب الأيمن لتعديل وتخصيص صلاحياته، وتحديد ما يظهر له وما يُحجب عنه في المنظومة.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
