import { useState } from 'react';
import { LogIn, LogOut, Search, Filter } from 'lucide-react';
import { Employee } from '../types';
import clsx from 'clsx';
import { toast } from '../components/Toast';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent';
}

const mockAttendance: AttendanceRecord[] = [
  { id: '1', employeeId: 'HR-1001', employeeName: 'أحمد محمد', date: '2023-11-01', checkIn: '08:00 AM', checkOut: '04:00 PM', status: 'Present' },
  { id: '2', employeeId: 'HR-1001', employeeName: 'أحمد محمد', date: '2023-11-02', checkIn: '08:15 AM', checkOut: '04:30 PM', status: 'Late' },
  { id: '3', employeeId: 'HR-1002', employeeName: 'سارة خالد', date: '2023-11-01', checkIn: '-', checkOut: '-', status: 'Absent' },
  { id: '4', employeeId: 'HR-1003', employeeName: 'عمر عبدالله', date: '2023-11-01', checkIn: '07:55 AM', checkOut: '04:00 PM', status: 'Present' },
  { id: '5', employeeId: 'HR-1001', employeeName: 'أحمد محمد', date: '2023-11-03', checkIn: '08:00 AM', checkOut: '04:00 PM', status: 'Present' },
];

export default function Attendance({ user, employees }: { user: { role: string, username: string }, employees: Employee[] }) {
  const isAdminOrAccountant = ['admin', 'accountant'].includes(user.role);
  
  // For employees, only show their own attendance
  const initialRecords = isAdminOrAccountant ? mockAttendance : mockAttendance.filter(r => r.employeeId === 'HR-1001');
  
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [search, setSearch] = useState('');

  const filteredRecords = records.filter(r => 
    r.employeeName.includes(search) || r.date.includes(search)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700';
      case 'Late': return 'bg-amber-100 text-amber-700';
      case 'Absent': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Present': return 'حاضر';
      case 'Late': return 'متأخر';
      case 'Absent': return 'غائب';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">سجل الحضور والانصراف</h2>
          <p className="text-slate-500 mt-1">
            {isAdminOrAccountant ? 'متابعة أوقات دوام الموظفين' : 'سجل دوامك اليومي'}
          </p>
        </div>
        {!isAdminOrAccountant && (
          <div className="flex gap-3">
             <button onClick={() => toast('تم تسجيل الحضور بنجاح')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              <LogIn size={20} />
              <span>تسجيل حضور</span>
            </button>
            <button onClick={() => toast('تم تسجيل الانصراف بنجاح')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors">
              <LogOut size={20} />
              <span>تسجيل انصراف</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو التاريخ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-10 pl-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button onClick={() => toast('سيتم تفعيل ميزة التصفية قريباً')} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors">
          <Filter size={18} />
          <span>تصفية</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {isAdminOrAccountant && <th className="p-4 font-semibold text-slate-600">الموظف</th>}
                <th className="p-4 font-semibold text-slate-600">التاريخ</th>
                <th className="p-4 font-semibold text-slate-600">وقت الحضور</th>
                <th className="p-4 font-semibold text-slate-600">وقت الانصراف</th>
                <th className="p-4 font-semibold text-slate-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  {isAdminOrAccountant && (
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{record.employeeName}</div>
                      <div className="text-xs text-slate-500">{record.employeeId}</div>
                    </td>
                  )}
                  <td className="p-4 text-slate-700">{record.date}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <LogIn size={16} className="text-slate-400" />
                      {record.checkIn}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <LogOut size={16} className="text-slate-400" />
                      {record.checkOut}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      "inline-flex px-2.5 py-1 rounded-md text-xs font-medium",
                      getStatusColor(record.status)
                    )}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrAccountant ? 5 : 4} className="p-8 text-center text-slate-500">
                    لا توجد سجلات مطابقة
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
