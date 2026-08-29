import React, { useState } from 'react';
import { Activity, Search, Filter, Calendar } from 'lucide-react';
import { useStore } from '../store';

export default function AuditLogs() {
  const { systemAuditLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredLogs = systemAuditLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600" />
            سجل مراقبة النظام (Audit Logs)
          </h1>
          <p className="text-slate-500 mt-1">تتبع جميع العمليات والأحداث التي تتم داخل المنظومة</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="البحث في سجل العمليات..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700 w-48">تاريخ ووقت الإجراء</th>
                <th className="p-4 font-semibold text-slate-700 w-48">المستخدم</th>
                <th className="p-4 font-semibold text-slate-700 w-48">نوع الإجراء</th>
                <th className="p-4 font-semibold text-slate-700">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-600 text-sm whitespace-nowrap" dir="ltr">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {log.userName}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <Activity size={48} className="mx-auto text-slate-300 mb-3" />
                    <p>لا توجد سجلات مطابقة للبحث</p>
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
