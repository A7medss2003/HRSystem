import { Users, FileText, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import { Employee } from '../types';

export default function Dashboard({ employees }: { employees: Employee[] }) {
  const activeEmployees = employees.filter(e => e.status === 'نشط').length;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الموظفين" value={employees.length.toString()} icon={Users} color="bg-blue-500" />
        <StatCard title="الموظفين النشطين" value={activeEmployees.toString()} icon={Users} color="bg-emerald-500" />
        <StatCard title="إجمالي الرواتب" value="24,500 د.ل" icon={DollarSign} color="bg-indigo-500" />
        <StatCard title="الوظائف الشاغرة" value="3" icon={Briefcase} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">الموظفون المضافون حديثاً</h3>
          <div className="space-y-4">
            {employees.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center gap-3">
                {emp.photoUrl ? (
                  <img src={emp.photoUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {emp.fullName ? emp.fullName.charAt(0) : '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-slate-800">{emp.fullName}</p>
                  <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                </div>
                <div className="mr-auto text-xs text-slate-400 font-mono" dir="ltr">{emp.employeeId}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">توزيع الموظفين حسب القسم</h3>
          <div className="space-y-4">
            {[
              { dep: 'قسم التطوير', count: 12, perc: 45 },
              { dep: 'قسم المالية', count: 4, perc: 15 },
              { dep: 'الموارد البشرية', count: 3, perc: 10 },
              { dep: 'المبيعات والتسويق', count: 8, perc: 30 },
            ].map(d => (
              <div key={d.dep}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{d.dep}</span>
                  <span className="text-slate-500">{d.count} موظفين</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${d.perc}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);
