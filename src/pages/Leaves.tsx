import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, Plus, Download } from 'lucide-react';
import { Employee, LeaveRequest } from '../types';
import clsx from 'clsx';
import { toast } from '../components/Toast';

import { useStore } from '../store';

export default function Leaves({ user }: { user: { role: string, username: string } }) {
  const { employees, leaves, addLeave, updateLeave } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [newLeave, setNewLeave] = useState({ type: 'إجازة سنوية', startDate: '', endDate: '', reason: '' });

  const isAdminOrAccountant = ['admin', 'accountant'].includes(user.role);
  
  // For employees, only show their own leaves (mocked to أحمد محمد HR-1001 for now)
  const displayLeaves = isAdminOrAccountant ? leaves : leaves.filter(l => l.employeeId === 'HR-1001');

  const handleStatusChange = (id: string, newStatus: 'Approved' | 'Rejected') => {
    const targetLeave = leaves.find(l => l.id === id);
    const leaveToUpdate = leaves.find(l => l.id === id);
    if (leaveToUpdate) {
      updateLeave({ ...leaveToUpdate, status: newStatus });
    }
    toast(`إشعار للموظف (${targetLeave?.employeeName}): ${newStatus === 'Approved' ? 'تمت الموافقة على طلب الإجازة الخاص بك' : 'تم رفض طلب الإجازة الخاص بك'}`);
  };

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: 'HR-1001', // Mocking current user ID
      employeeName: user.username,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      status: 'Pending',
      reason: newLeave.reason
    };
    addLeave(newRequest);
    setShowModal(false);
    setNewLeave({ type: 'إجازة سنوية', startDate: '', endDate: '', reason: '' });
    toast('تم تقديم طلب الإجازة بنجاح');
  };

  const exportToCSV = () => {
    const headers = ['رقم الموظف', 'اسم الموظف', 'نوع الإجازة', 'من تاريخ', 'إلى تاريخ', 'السبب', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...displayLeaves.map(leave => {
        // Handle quotes for reason to avoid breaking CSV format
        const reason = `"${leave.reason.replace(/"/g, '""')}"`;
        const status = leave.status === 'Approved' ? 'موافق عليها' : leave.status === 'Rejected' ? 'مرفوضة' : 'قيد الانتظار';
        return [
          leave.employeeId,
          leave.employeeName,
          leave.type,
          leave.startDate,
          leave.endDate,
          reason,
          status
        ].join(',');
      })
    ].join('\n');

    // Add BOM for UTF-8 to support Arabic characters in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leaves_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('تم تصدير البيانات بنجاح');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الإجازات</h2>
          <p className="text-slate-500 mt-1">
            {isAdminOrAccountant ? 'متابعة وإدارة طلبات إجازات الموظفين' : 'سجل الإجازات وتقديم الطلبات'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrAccountant && (
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-200 font-medium"
            >
              <Download size={18} />
              <span>تصدير CSV</span>
            </button>
          )}
          {user.role === 'employee' && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>طلب إجازة</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {isAdminOrAccountant && <th className="p-4 font-semibold text-slate-600">الموظف</th>}
                <th className="p-4 font-semibold text-slate-600">النوع</th>
                <th className="p-4 font-semibold text-slate-600">من تاريخ</th>
                <th className="p-4 font-semibold text-slate-600">إلى تاريخ</th>
                <th className="p-4 font-semibold text-slate-600">السبب</th>
                <th className="p-4 font-semibold text-slate-600">الحالة</th>
                {isAdminOrAccountant && <th className="p-4 font-semibold text-slate-600 text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                  {isAdminOrAccountant && (
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{leave.employeeName}</div>
                      <div className="text-xs text-slate-500">{leave.employeeId}</div>
                    </td>
                  )}
                  <td className="p-4 text-slate-700">{leave.type}</td>
                  <td className="p-4 text-slate-700">{leave.startDate}</td>
                  <td className="p-4 text-slate-700">{leave.endDate}</td>
                  <td className="p-4 text-slate-500 max-w-xs truncate">{leave.reason}</td>
                  <td className="p-4">
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                      leave.status === 'Approved' && "bg-green-100 text-green-700",
                      leave.status === 'Pending' && "bg-amber-100 text-amber-700",
                      leave.status === 'Rejected' && "bg-red-100 text-red-700"
                    )}>
                      {leave.status === 'Approved' && <CheckCircle2 size={16} />}
                      {leave.status === 'Pending' && <Clock size={16} />}
                      {leave.status === 'Rejected' && <XCircle size={16} />}
                      {leave.status === 'Approved' ? 'مقبول' : leave.status === 'Pending' ? 'قيد المراجعة' : 'مرفوض'}
                    </span>
                  </td>
                  {isAdminOrAccountant && (
                    <td className="p-4 text-center">
                      {leave.status === 'Pending' ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleStatusChange(leave.id, 'Approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="قبول">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleStatusChange(leave.id, 'Rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="رفض">
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {displayLeaves.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrAccountant ? 7 : 5} className="p-8 text-center text-slate-500">
                    لا توجد طلبات إجازة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">طلب إجازة جديد</h3>
            </div>
            <form onSubmit={handleAddLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع الإجازة</label>
                <select 
                  required
                  value={newLeave.type}
                  onChange={e => setNewLeave({...newLeave, type: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="إجازة سنوية">إجازة سنوية</option>
                  <option value="إجازة مرضية">إجازة مرضية</option>
                  <option value="إجازة طارئة">إجازة طارئة</option>
                  <option value="إجازة بدون راتب">إجازة بدون راتب</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={newLeave.startDate}
                    onChange={e => setNewLeave({...newLeave, startDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
                  <input 
                    type="date" 
                    required
                    value={newLeave.endDate}
                    onChange={e => setNewLeave({...newLeave, endDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">السبب (اختياري)</label>
                <textarea 
                  rows={3}
                  value={newLeave.reason}
                  onChange={e => setNewLeave({...newLeave, reason: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="سبب طلب الإجازة..."
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                >
                  إرسال الطلب
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
