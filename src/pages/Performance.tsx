import { useState } from 'react';
import { Star, Search, MessageSquare } from 'lucide-react';
import { Employee } from '../types';

export default function Performance({ employees, user }: { employees: Employee[], user: { role: string, username: string } }) {
  
  const generateReviews = () => {
    let targetEmployees = employees;
    if (user.role === 'employee') {
      targetEmployees = employees.slice(0, 1);
    }
    
    return targetEmployees.map(emp => ({
      id: `rev-${emp.id}`,
      employee: emp,
      period: 'الربع الأول 2024',
      reviewer: emp.directManager || 'المدير العام',
      rating: 4.5,
      comments: 'أداء ممتاز والتزام عالي بالمواعيد. يحتاج إلى تطوير مهارات التواصل قليلاً.',
    }));
  };

  const reviews = generateReviews();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">تقييم الأداء</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(rev => (
          <div key={rev.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {rev.employee.fullName ? rev.employee.fullName.charAt(0) : '?'}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800">{rev.employee.fullName}</h3>
                   <p className="text-xs text-slate-500">{rev.employee.jobTitle}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-600 font-bold font-mono">
                <Star size={16} fill="currentColor" />
                <span>{rev.rating}</span>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed mb-4">
              <MessageSquare size={16} className="inline-block ml-2 text-slate-400" />
              "{rev.comments}"
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
              <span>الفترة: <strong className="text-slate-700">{rev.period}</strong></span>
              <span>المُقيّم: <strong className="text-slate-700">{rev.reviewer}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
