import { useState } from 'react';
import { Search, Printer, Download, DollarSign, Calendar } from 'lucide-react';
import { Employee } from '../types';
import { toast } from '../components/Toast';

export default function Payroll({ employees, user }: { employees: Employee[], user: { role: string, username: string } }) {
  const [search, setSearch] = useState('');
  
  // Fake payroll records
  const generatePayrolls = () => {
    let targetEmployees = employees;
    if (user.role === 'employee') {
      targetEmployees = employees.slice(0, 1); // Mock mapping to single employee
    }
    
    return targetEmployees.map(emp => ({
      id: `pay-${emp.id}`,
      employee: emp,
      period: 'أبريل 2024',
      basic: 3500,
      allowances: 400,
      deductions: 150,
      net: 3750,
      status: 'مدفوع'
    }));
  };

  const payrolls = generatePayrolls();

  const handlePrint = () => {
    toast('سيتم تجهيز قسيمة الراتب للطباعة');
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">مسير الرواتب</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {user.role !== 'employee' && (
          <div className="p-4 border-b border-slate-100 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">الموظف</th>
                <th className="px-6 py-4 font-medium">الفترة</th>
                <th className="px-6 py-4 font-medium">الراتب الأساسي</th>
                <th className="px-6 py-4 font-medium">البدلات</th>
                <th className="px-6 py-4 font-medium">الاستقطاعات</th>
                <th className="px-6 py-4 font-medium text-emerald-600">الصافي</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{pay.employee.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2"><Calendar size={14}/>{pay.period}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{pay.basic} د.ل</td>
                  <td className="px-6 py-4 text-emerald-600 font-mono" dir="ltr">+{pay.allowances} د.ل</td>
                  <td className="px-6 py-4 text-red-600 font-mono" dir="ltr">-{pay.deductions} د.ل</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono bg-emerald-50/50" dir="ltr">{pay.net} د.ل</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="طباعة قسيمة الراتب">
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
