import React, { useState } from 'react';
import {   
  Search, Filter, Plus, Clock, 
  Calendar, User, CheckCircle, AlertCircle, Trash2, 
  Save, FileText, Activity 
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from '../components/Toast';
import { useStore } from '../store';
import { AttendanceRecord, AttendanceMovement } from '../types';

export default function Attendance({ user }: { user: { role: string; username: string }; }) {
  const { employees, attendanceRecords: records, setAttendanceRecords: setRecords } = useStore();
  const isAdminOrAccountant = ['admin', 'accountant'].includes(user.role);

  const [search, setSearch] = useState('');
  
  const filteredRecords = records.filter(r => 
    (isAdminOrAccountant || r.employeeName === user.username) &&
    (r.employeeName.includes(search) || r.employeeId.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">الحضور والانصراف</h1>
        
        {isAdminOrAccountant && (
          <button onClick={() => toast('سيتم إضافة هذه الميزة لاحقاً')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
            <Plus size={16} />
            إضافة سجل حضور
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الرقم الوظيفي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-4 px-6 text-slate-700">الموظف</th>
                <th className="py-4 px-6 text-slate-700">التاريخ</th>
                <th className="py-4 px-6 text-slate-700">الحالة</th>
                <th className="py-4 px-6 text-slate-700 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800">{r.employeeName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{r.employeeId}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{r.date}</td>
                  <td className="py-4 px-6">
                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold",
                      r.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                      r.status === 'Absent' ? "bg-red-100 text-red-700" :
                      r.status === 'Late' ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {r.status === 'Present' ? 'حاضر' : r.status === 'Absent' ? 'غائب' : r.status === 'Late' ? 'متأخر' : 'إجازة'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => toast('سيتم إضافة هذه الميزة لاحقاً')} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="عرض التفاصيل">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">لا توجد سجلات حضور</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
