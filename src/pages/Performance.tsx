import React, { useState } from 'react';
import { Star, Search, MessageSquare, Plus, Printer } from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../components/Toast';
import { PerformanceReview } from '../types';

export default function Performance({ user }: { user: { role: string, username: string } }) {
  const { employees, performanceReviews, addPerformanceReview } = useStore();
  const [search, setSearch] = useState('');
  
  const filteredReviews = performanceReviews.filter(r => 
    (user.role === 'admin' || user.role === 'developer' || r.employeeName === user.username) &&
    (r.employeeName.includes(search) || r.employeeId.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">تقييم الأداء</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="no-print px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
            <Printer size={16} />
            طباعة
          </button>
        {['admin', 'developer'].includes(user.role) && (
          <button onClick={() => toast('سيتم إضافة نموذج التقييم قريباً')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
            <Plus size={16} />
            تقييم جديد
          </button>
        )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="البحث في التقييمات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="p-4">
          {filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map(r => (
                <div key={r.id} className="border border-slate-200 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-slate-800">{r.employeeName}</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{r.period}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3 text-amber-500">
                    {[...Array(10)].map((_, i) => (
                      <Star key={i} size={16} fill={i < Math.floor(r.rating) ? 'currentColor' : 'none'} />
                    ))}
                    <span className="text-sm text-slate-600 mr-2">{r.rating} / 10</span>
                  </div>
                  <p className="text-sm text-slate-600"><MessageSquare size={14} className="inline ml-1"/> {r.comments}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">لا توجد تقييمات سابقة</div>
          )}
        </div>
      </div>
    </div>
  );
}
