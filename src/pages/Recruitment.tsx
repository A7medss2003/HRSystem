import { Briefcase, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '../components/Toast';

export default function Recruitment({ user }: { user: { role: string, username: string } }) {
  if (user.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">غير مصرح لك</div>;
  }

  const stages = [
    { id: 'new', name: 'طلبات جديدة', count: 5 },
    { id: 'screening', name: 'الفرز المبدئي', count: 3 },
    { id: 'interview', name: 'المقابلة', count: 2 },
    { id: 'offer', name: 'عرض العمل', count: 1 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 min-h-screen pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة التوظيف</h1>
        <button onClick={() => toast('سيتم تفعيل ميزة إضافة وظيفة قريباً')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
          <Briefcase size={16} />
          إضافة وظيفة شاغرة
        </button>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[300px] w-80 shrink-0 bg-slate-200/50 rounded-xl p-4 flex flex-col h-[calc(100vh-200px)]">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold text-slate-700">{stage.name}</h3>
              <span className="bg-slate-300 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{stage.count}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {[...Array(stage.count)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                  <div className="font-bold text-slate-800 text-sm mb-1">مرشح {i+1}</div>
                  <div className="text-xs text-blue-600 font-medium mb-3">مهندس برمجيات</div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/> منذ يومين</span>
                    <div className="flex gap-1">
                       <button onClick={() => toast('تم نقل المرشح للمرحلة التالية')} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><CheckCircle size={16}/></button>
                       <button onClick={() => toast('تم رفض المرشح')} className="p-1 text-red-500 hover:bg-red-50 rounded"><XCircle size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
