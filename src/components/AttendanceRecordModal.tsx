import React, { useState, useEffect } from 'react';
import { 
  X, Clock, Calendar, User, CheckCircle2, AlertCircle, 
  Trash2, Plus, Save, FileText, Activity 
} from 'lucide-react';
import { AttendanceRecord, AttendanceMovement, Employee } from '../types';
import { timeToMinutes } from '../lib/zktecoParser';
import { toast } from './Toast';

interface AttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  employees: Employee[];
  onSave: (record: AttendanceRecord) => void;
  onDelete?: (recordId: string) => void;
  readOnly?: boolean;
}

export default function AttendanceRecordModal({
  isOpen,
  onClose,
  record,
  employees,
  onSave,
  onDelete,
  readOnly = false
}: AttendanceRecordModalProps) {
  const isEditing = !!record;

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Present' | 'Late' | 'Absent' | 'Leave'>('Present');
  const [notes, setNotes] = useState('');
  const [movements, setMovements] = useState<AttendanceMovement[]>([]);

  // حركة سريعة للإضافة
  const [newMoveTime, setNewMoveTime] = useState('08:30');
  const [newMoveType, setNewMoveType] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (record) {
      setSelectedEmpId(record.employeeId);
      setDate(record.date);
      setStatus(record.status);
      setNotes(record.notes || '');
      setMovements(record.movements || []);
    } else {
      setSelectedEmpId(employees[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Present');
      setNotes('');
      setMovements([
        {
          id: 'mov-' + Date.now() + '-1',
          type: 'in',
          time: '08:30',
          minutesFromMidnight: timeToMinutes('08:30')
        },
        {
          id: 'mov-' + Date.now() + '-2',
          type: 'out',
          time: '16:30',
          minutesFromMidnight: timeToMinutes('16:30')
        }
      ]);
    }
  }, [record, isOpen, employees]);

  if (!isOpen) return null;

  const handleAddMovement = () => {
    if (!newMoveTime) return;
    const minutes = timeToMinutes(newMoveTime);
    const newMov: AttendanceMovement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      type: newMoveType,
      time: newMoveTime,
      minutesFromMidnight: minutes
    };

    const updated = [...movements, newMov].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
    setMovements(updated);
    toast('تمت إضافة الحركة', 'info');
  };

  const handleRemoveMovement = (id: string) => {
    setMovements(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast('يرجى اختيار الموظف أولاً', 'error');
      return;
    }

    const emp = employees.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId);
    const empName = emp ? emp.fullName : 'موظف';

    // احتساب ساعات العمل والتأخير
    const sortedMoves = [...movements].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
    const firstIn = sortedMoves.find(m => m.type === 'in') || sortedMoves[0];
    const lastOut = sortedMoves.slice().reverse().find(m => m.type === 'out') || (sortedMoves.length > 1 ? sortedMoves[sortedMoves.length - 1] : undefined);

    let totalHours = 0;
    if (firstIn && lastOut && lastOut.minutesFromMidnight > firstIn.minutesFromMidnight) {
      totalHours = Math.round(((lastOut.minutesFromMidnight - firstIn.minutesFromMidnight) / 60) * 10) / 10;
    }

    const delayMinutes = firstIn && firstIn.minutesFromMidnight > (8 * 60 + 45) // بعد 08:45
      ? firstIn.minutesFromMidnight - (8 * 60 + 30)
      : 0;

    const savedRecord: AttendanceRecord = {
      id: record?.id || 'att-' + Date.now(),
      employeeId: selectedEmpId,
      employeeName: empName,
      date,
      status,
      movements: sortedMoves,
      workHours: totalHours,
      delayMinutes,
      notes,
      source: record?.source || 'manual'
    };

    onSave(savedRecord);
    toast(isEditing ? 'تم تعديل سجل الحضور بنجاح' : 'تم إضافة سجل الحضور بنجاح', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isEditing ? 'تفاصيل وتعديل سجل الحضور' : 'إضافة سجل حضور يدوي'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing ? `التاريخ: ${date}` : 'تسجيل حركة حضور وانصراف جديدة'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* Employee */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">الموظف</label>
            <select
              disabled={isEditing || readOnly}
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>اختر الموظف...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">التاريخ</label>
              <input
                type="date"
                disabled={readOnly}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الحالة</label>
              <select
                disabled={readOnly}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Present">حاضر في الموعد</option>
                <option value="Late">متأخر</option>
                <option value="Absent">غائب</option>
                <option value="Leave">في إجازة</option>
              </select>
            </div>
          </div>

          {/* Movements Timeline */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">حركات الحضور والانصراف (البصمات):</span>
              <span className="text-[11px] text-slate-500 font-mono">{movements.length} حركة</span>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {movements.length > 0 ? (
                movements.map((m, idx) => (
                  <div key={m.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.type === 'in' ? 'دخول / حضور' : 'خروج / انصراف'}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{m.time}</span>
                      {m.note && <span className="text-slate-400 text-[10px]">({m.note})</span>}
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMovement(m.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف الحركة"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-slate-400">لا توجد حركات مسجلة</div>
              )}
            </div>

            {/* Add movement row */}
            {!readOnly && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <select
                  value={newMoveType}
                  onChange={(e) => setNewMoveType(e.target.value as any)}
                  className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="in">دخول</option>
                  <option value="out">خروج</option>
                </select>

                <input
                  type="time"
                  value={newMoveTime}
                  onChange={(e) => setNewMoveTime(e.target.value)}
                  className="p-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800"
                />

                <button
                  type="button"
                  onClick={handleAddMovement}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1 font-bold"
                >
                  <Plus size={14} />
                  إضافة
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              disabled={readOnly}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات حول هذا اليوم (إذن خروج، مهمة خارجية، عذر...)"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {isEditing && onDelete && !readOnly ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
                    onDelete(record.id);
                    toast('تم حذف السجل', 'info');
                    onClose();
                  }
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 font-bold transition-colors"
              >
                <Trash2 size={14} />
                حذف السجل
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
              {!readOnly && (
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={15} />
                  حفظ السجل
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
