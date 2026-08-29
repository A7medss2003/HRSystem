import { Users, FileText, DollarSign, TrendingUp, Briefcase } from 'lucide-react';
import { Employee } from '../types';
import { useStore } from '../store';
import FileImage from '../components/FileImage';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { employees } = useStore();
  const activeEmployees = employees.filter(e => e.status === 'نشط').length;
  
  const departmentCounts = employees.reduce((acc, emp) => {
    const dep = emp.department || 'غير محدد';
    acc[dep] = (acc[dep] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentCounts)
    .map(([dep, count]) => ({
      name: dep,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const performanceCounts = employees.reduce((acc, emp) => {
    const level = emp.performanceRating?.level || 'غير مقيم';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const performanceData = Object.entries(performanceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const PERF_COLORS: Record<string, string> = {
    'ممتاز': '#10b981',
    'جيد جداً': '#3b82f6',
    'جيد': '#f59e0b',
    'مقبول': '#f97316',
    'يحتاج تحسين': '#ef4444',
    'غير مقيم': '#94a3b8'
  };

  const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي الموظفين" value={employees.length.toString()} icon={Users} color="bg-blue-500" />
        <StatCard title="الموظفين النشطين" value={activeEmployees.toString()} icon={Users} color="bg-emerald-500" />
        <StatCard title="الوظائف الشاغرة" value="3" icon={Briefcase} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Department Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">توزيع الموظفين حسب القسم</h3>
          <div className="flex-1 min-h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="عدد الموظفين" radius={[4, 4, 0, 0]}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">نسبة تقييمات الأداء</h3>
          <div className="flex-1 min-h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PERF_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                  formatter={(value: number) => [value, 'عدد الموظفين']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recently Added Employees */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">الموظفون المضافون حديثاً</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.slice(0, 6).map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                {emp.photoUrl ? (
                  <FileImage src={emp.photoUrl} alt="" className="w-12 h-12 rounded-full shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                    {emp.fullName ? emp.fullName.charAt(0) : '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{emp.fullName}</p>
                  <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                </div>
                <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md" dir="ltr">
                  {emp.employeeId}
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
