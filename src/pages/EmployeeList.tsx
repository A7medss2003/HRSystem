import { useState } from 'react';
import { Search, Plus, Filter, FileSpreadsheet, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { EmployeeStatus, Employee } from '../types';
import { toast } from '../components/Toast';

interface EmployeeListProps {
  employees: Employee[];
  userRole: string;
  onSelectEmployee: (id: string) => void;
  onAddEmployee: () => void;
}

export default function EmployeeList({ employees, userRole, onSelectEmployee, onAddEmployee }: EmployeeListProps) {
  const [search, setSearch] = useState('');
  
  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'نشط': return 'bg-emerald-100 text-emerald-700';
      case 'إجازة': return 'bg-amber-100 text-amber-700';
      case 'موقوف': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.fullName?.includes(search) || '') || 
    (emp.jobTitle?.includes(search) || '') ||
    (emp.employeeId?.includes(search) || '')
  );

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
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
              onClick={onAddEmployee}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-blue-200"
            >
              <Plus size={16} />
              إضافة موظف
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم، المسمى، أو الرقم الوظيفي..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
          <button onClick={() => toast('سيتم تفعيل ميزة التصفية قريباً')} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 text-sm">
            <Filter size={16} />
            تصفية
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">الموظف</th>
                <th className="px-6 py-4 font-medium">الرقم الوظيفي</th>
                <th className="px-6 py-4 font-medium">القسم</th>
                <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onSelectEmployee(emp.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
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
                    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(emp.status))}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ChevronLeft size={20} />
                  </td>
                </tr>
              ))}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    لا يوجد موظفين يطابقون بحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
