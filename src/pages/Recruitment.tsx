import React, { useState } from 'react';
import { Briefcase, UserPlus, Clock, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { useStore } from '../store';
import { toast } from '../components/Toast';
import { Candidate } from '../types';

export default function Recruitment({ user }: { user: { role: string, username: string } }) {
  const { candidates, addCandidate, updateCandidate } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', position: '' });

  if (!['admin', 'developer'].includes(user.role)) {
    return <div className="p-8 text-center text-red-500">غير مصرح لك</div>;
  }

  const stages = [
    { id: 'new', name: 'طلبات جديدة' },
    { id: 'screening', name: 'الفرز المبدئي' },
    { id: 'interview', name: 'المقابلة' },
    { id: 'offer', name: 'عرض العمل' },
  ];

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.position.trim()) {
      toast('الرجاء إدخال اسم المرشح والمسمى الوظيفي');
      return;
    }

    const newCandidate: Candidate = {
      id: 'cand-' + Date.now(),
      name: formData.name,
      position: formData.position,
      stage: 'new',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    addCandidate(newCandidate);
    toast('تمت إضافة المرشح بنجاح');
    setShowAddModal(false);
    setFormData({ name: '', position: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 min-h-screen pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة التوظيف</h1>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm cursor-pointer">
          <Plus size={16} />
          إضافة مرشح جديد
        </button>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-4">
        {stages.map(stage => {
          const stageCandidates = candidates.filter(c => c.stage === stage.id);
          return (
            <div key={stage.id} className="min-w-[300px] w-80 shrink-0 bg-slate-200/50 rounded-xl p-4 flex flex-col h-[calc(100vh-200px)]">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-slate-700">{stage.name}</h3>
                <span className="bg-slate-300 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {stageCandidates.map((c) => (
                  <div key={c.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors group">
                    <div className="font-bold text-slate-800 text-sm mb-1">{c.name}</div>
                    <div className="text-xs text-blue-600 font-medium mb-3">{c.position}</div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/> {c.dateAdded}</span>
                    </div>
                  </div>
                ))}
                {stageCandidates.length === 0 && (
                  <div className="text-center text-sm text-slate-400 mt-8">لا يوجد مرشحين</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <UserPlus size={20} />
                </div>
                <h3 className="font-bold text-slate-800">إضافة مرشح جديد</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCandidate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-2">اسم المرشح</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm py-2.5 px-3.5 transition-all"
                    placeholder="مثال: أحمد محمد"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-2">المسمى الوظيفي المتقدم له</label>
                  <input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm py-2.5 px-3.5 transition-all"
                    placeholder="مثال: مطور واجهات أمامية"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  إضافة المرشح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
