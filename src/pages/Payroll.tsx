import React, { useState } from 'react';
import { Search, Printer, Download, DollarSign, Calendar, Plus } from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../components/Toast';

export default function Payroll({ user }: { user: { role: string, username: string } }) {
  const { payrolls } = useStore();
  const [search, setSearch] = useState('');
  
  const filteredPayrolls = payrolls.filter(p => 
    (user.role !== 'employee' || p.employeeName === user.username) &&
    (p.employeeName.includes(search) || p.employeeId.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">مسيرات الرواتب</h1>
        {['admin', 'accountant', 'developer'].includes(user.role) && (
          <button onClick={() => toast('سيتم إضافة نافذة توليد الرواتب قريباً')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
            <Plus size={16} />
            توليد مسير رواتب
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الرقم..."
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
                <th className="py-4 px-6">الموظف</th>
                <th className="py-4 px-6">الفترة</th>
                <th className="py-4 px-6">الأساسي</th>
                <th className="py-4 px-6">البدلات</th>
                <th className="py-4 px-6">الخصومات</th>
                <th className="py-4 px-6">الصافي</th>
                <th className="py-4 px-6">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayrolls.length > 0 ? filteredPayrolls.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800">{p.employeeName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.employeeId}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{p.period}</td>
                  <td className="py-4 px-6 text-slate-600">{p.basic} د.ل</td>
                  <td className="py-4 px-6 text-emerald-600">+{p.allowances} د.ل</td>
                  <td className="py-4 px-6 text-red-600">-{p.deductions} د.ل</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{p.net} د.ل</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">{p.status}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">لا توجد مسيرات رواتب</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
