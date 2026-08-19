import React, { useState } from 'react';
import { Shield, Plus, Trash2, Edit2, Save, X, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { RoleDef } from '../types';

const AVAILABLE_PERMISSIONS = [
  { id: 'view_dashboard', label: 'رؤية لوحة التحكم والإحصائيات' },
  { id: 'manage_employees', label: 'إضافة وتعديل بيانات الموظفين' },
  { id: 'view_payroll', label: 'الاطلاع على الرواتب والمالية' },
  { id: 'manage_attendance', label: 'إدارة الحضور والانصراف' },
  { id: 'manage_leaves', label: 'قبول ورفض الإجازات' },
  { id: 'view_profile', label: 'رؤية الملف الشخصي فقط' },
  { id: 'request_leave', label: 'تقديم طلب إجازة' },
  { id: 'manage_settings', label: 'تغيير إعدادات المنظومة' }
];

export default function Roles() {
  const { roles, setRoles } = useStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const handleEdit = (role: Role) => {
    setEditingId(role.id);
    setEditName(role.name);
    setEditPermissions([...role.permissions]);
  };

  const handleTogglePermission = (permId: string) => {
    setEditPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = (id: string) => {
    setRoles(roles.map(r => r.id === id ? {
      ...r,
      name: editName,
      permissions: editPermissions
    } : r));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (['admin', 'accountant', 'employee'].includes(id)) {
      alert('لا يمكن حذف الصلاحيات الأساسية للنظام');
      return;
    }
    setRoles(roles.filter(r => r.id !== id));
  };

  const handleAdd = () => {
    const newId = `role_${Date.now()}`;
    setRoles([...roles, { id: newId, name: 'صلاحية جديدة', permissions: [] }]);
    setEditingId(newId);
    setEditName('صلاحية جديدة');
    setEditPermissions([]);
  };

  const getPermissionLabel = (pId: string) => {
    if (pId === 'all') return 'وصول كامل (كل الصلاحيات)';
    const perm = AVAILABLE_PERMISSIONS.find(p => p.id === pId);
    return perm ? perm.label : pId;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-blue-600" />
            إدارة الصلاحيات
          </h2>
          <p className="text-slate-500 mt-1 text-sm">تحديد ما يمكن لكل مستخدم رؤيته أو فعله في المنظومة بكل سهولة</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          إضافة صلاحية جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {roles.map((role) => (
          <div key={role.id} className={clsx(
            "bg-white rounded-2xl shadow-sm border overflow-hidden transition-all",
            editingId === role.id ? "border-blue-400 ring-4 ring-blue-50" : "border-slate-100"
          )}>
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/50">
              <div className="flex-1">
                {editingId === role.id ? (
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="اسم الصلاحية (مثال: مدير الموارد البشرية)"
                    className="border border-slate-200 rounded-lg px-4 py-2 w-full max-w-md focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-slate-800"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield size={20} className={role.id === 'admin' ? "text-amber-500" : "text-blue-500"} />
                    {role.name}
                  </h3>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {editingId === role.id ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium">
                      <X size={18} /> إلغاء
                    </button>
                    <button onClick={() => handleSave(role.id)} className="flex items-center gap-1 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors font-bold shadow-sm">
                      <Save size={18} /> حفظ التعديلات
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(role)} className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-medium">
                      <Edit2 size={18} /> تعديل
                    </button>
                    {role.id !== 'admin' && (
                      <button onClick={() => handleDelete(role.id)} className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium">
                        <Trash2 size={18} /> حذف
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-bold text-slate-500 mb-4">الأذونات الممنوحة لهذه الصلاحية:</h4>
              
              {editingId === role.id && role.id !== 'admin' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isSelected = editPermissions.includes(perm.id);
                    return (
                      <div 
                        key={perm.id} 
                        onClick={() => handleTogglePermission(perm.id)}
                        className={clsx(
                          "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none",
                          isSelected 
                            ? "border-blue-500 bg-blue-50 text-blue-800 font-bold" 
                            : "border-slate-100 hover:border-slate-300 text-slate-600 bg-white"
                        )}
                      >
                        {isSelected ? <CheckSquare className="text-blue-500 shrink-0" size={20} /> : <Square className="text-slate-300 shrink-0" size={20} />}
                        <span className="text-sm">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : role.id === 'admin' ? (
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-bold border border-amber-200">
                  <Shield size={18} />
                  وصول كامل لكافة أجزاء وإعدادات المنظومة
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.length > 0 ? role.permissions.map(p => (
                    <span key={p} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                      <CheckSquare size={14} className="text-emerald-500" />
                      {getPermissionLabel(p)}
                    </span>
                  )) : (
                    <span className="text-slate-400 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">لا توجد أذونات محددة</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
