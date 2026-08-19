import React, { useState } from 'react';
import { 
  LogIn, LogOut, Search, Filter, Plus, Clock, Eye, X, 
  Calendar, User, CheckCircle, AlertCircle, Trash2, 
  Save, FileText, Activity, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { Employee } from '../types';
import clsx from 'clsx';
import { toast } from '../components/Toast';

export interface AttendanceMovement {
  id: string;
  type: 'in' | 'out';
  time: string; // display string e.g. "08:00 AM" or "14:30"
  minutesFromMidnight: number; // 0..1439
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  movements: AttendanceMovement[];
}

// Helper to convert time strings to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '-' || timeStr === '') return 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

// Helper to format minutes as readable time e.g. "08:30 AM"
function formatMinutesToTimeStr(totalMins: number): string {
  const hours24 = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  const isPM = hours24 >= 12;
  const displayHours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedHours = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
  return `${paddedHours}:${paddedMins} ${isPM ? 'PM' : 'AM'}`;
}

// Helper to calculate total hours and movement stats for a day
export function calculateAttendanceStats(movements: AttendanceMovement[]) {
  let totalMinutes = 0;
  let currentInTime: number | null = null;
  let checkInCount = 0;
  let checkOutCount = 0;
  let isCurrentlyInside = false;

  const sessionDurations: { inId: string; outId?: string; durationMins?: number }[] = [];

  for (const m of sorted) {
    if (m.type === 'in') {
      checkInCount++;
      currentInTime = m.minutesFromMidnight;
      isCurrentlyInside = true;
    } else if (m.type === 'out') {
      checkOutCount++;
      if (currentInTime !== null) {
        totalMinutes += dur;
        currentInTime = null;
        isCurrentlyInside = false;
        // attach duration to last opened session
        const lastSession = sessionDurations[sessionDurations.length - 1];
        if (lastSession && !lastSession.outId) {
          lastSession.outId = m.id;
          lastSession.durationMins = dur;
        }
      } else {
        isCurrentlyInside = false;
      }
    }
  }

  const minutesOnly = totalMinutes % 60;

  let formattedHours = '0 دقيقة';
  if (hoursOnly > 0 && minutesOnly > 0) {
    formattedHours = `${hoursOnly} ساعات و ${minutesOnly} دقيقة`;
  } else if (hoursOnly > 0) {
    formattedHours = `${hoursOnly} ساعات`;
  } else if (minutesOnly > 0) {
    formattedHours = `${minutesOnly} دقيقة`;
  }

  const firstCheckIn = sorted.find(m => m.type === 'in')?.time || '-';
  const lastCheckOut = [...sorted].reverse().find(m => m.type === 'out')?.time || '-';

  return {
    totalMinutes,
    formattedHours,
    hoursOnly,
    minutesOnly,
    checkInCount,
    checkOutCount,
    firstCheckIn,
    lastCheckOut,
    isCurrentlyInside,
    sortedMovements: sorted,
    sessionDurations
  };
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'HR-1001',
    employeeName: 'أحمد محمد',
    date: '2023-11-01',
    status: 'Present',
    movements: [
      { id: 'm1', type: 'in', time: '08:00 AM', minutesFromMidnight: 480, note: 'دخول صباحي' },
      { id: 'm2', type: 'out', time: '11:30 AM', minutesFromMidnight: 690, note: 'خروج موعد طبي قصير' },
      { id: 'm3', type: 'in', time: '12:45 PM', minutesFromMidnight: 765, note: 'عودة لمتابعة العمل' },
      { id: 'm4', type: 'out', time: '04:30 PM', minutesFromMidnight: 990, note: 'انصراف نهاية الدوام' }
    ]
  },
  {
    id: 'att-2',
    employeeId: 'HR-1001',
    employeeName: 'أحمد محمد',
    date: '2023-11-02',
    status: 'Late',
    movements: [
      { id: 'm5', type: 'in', time: '08:30 AM', minutesFromMidnight: 510, note: 'دخول متأخر' },
      { id: 'm6', type: 'out', time: '04:45 PM', minutesFromMidnight: 1005, note: 'انصراف نهاية اليوم' }
    ]
  },
  {
    id: 'att-3',
    employeeId: 'HR-1002',
    employeeName: 'سارة خالد',
    date: '2023-11-01',
    status: 'Present',
    movements: [
      { id: 'm7', type: 'in', time: '07:55 AM', minutesFromMidnight: 475, note: 'دخول الصباح' },
      { id: 'm8', type: 'out', time: '01:00 PM', minutesFromMidnight: 780, note: 'استراحة' },
      { id: 'm9', type: 'in', time: '01:45 PM', minutesFromMidnight: 825, note: 'عودة من الاستراحة' }
    ]
  },
  {
    id: 'att-4',
    employeeId: 'HR-1003',
    employeeName: 'عمر عبدالله',
    date: '2023-11-01',
    status: 'Present',
    movements: [
      { id: 'm10', type: 'in', time: '08:00 AM', minutesFromMidnight: 480, note: 'حضور في الموعد' },
      { id: 'm11', type: 'out', time: '12:00 PM', minutesFromMidnight: 720, note: '' },
      { id: 'm12', type: 'in', time: '01:00 PM', minutesFromMidnight: 780, note: '' },
      { id: 'm13', type: 'out', time: '05:00 PM', minutesFromMidnight: 1020, note: 'نهاية الدوام' }
    ]
  },
  {
    id: 'att-5',
    employeeId: 'HR-1004',
    employeeName: 'منى أحمد',
    date: '2023-11-01',
    status: 'Absent',
    movements: []
  },
  {
    id: 'att-6',
    employeeId: 'HR-1005',
    employeeName: 'أحمد محمد',
    date: '2023-11-04',
    status: 'Leave',
    movements: []
  }
];

import { useStore } from '../store';

export default function Attendance({ user }: { user: { role: string; username: string }; }) {

  // Initial attendance list
  // useState<AttendanceRecord[]>((

  // New Movement Form state inside the modal

  // Add Attendance Day Modal state

  const filteredRecords = records.filter(
    r => r.employeeName.includes(search) || r.date.includes(search) || r.employeeId.includes(search)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700 border-green-200';
      case 'Late': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'Leave': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Present': return 'حاضر';
      case 'Late': return 'متأخر';
      case 'Absent': return 'غائب';
      case 'Leave': return 'إجازة';
      default: return status;
    }
  };

  // Add movement to selected day record
  const handleAddMovement = (e: React.FormEvent) => {
    if (!selectedRecord) return;

    let timeDisplay = newMoveTime;
    // format "14:30" to "02:30 PM" if standard 24h format
    if (newMoveTime.includes(':') && !newMoveTime.toUpperCase().includes('M')) {
      const m = mStr;
      const isPm = h >= 12;
      const h12 = h % 12 === 0 ? 12 : h % 12;
      timeDisplay = `${h12 < 10 ? '0' + h12 : h12}:${m} ${isPm ? 'PM' : 'AM'}`;
    }

    const newMovement: AttendanceMovement = {
      id: 'm-' + Date.now(),
      type: newMoveType,
      time: timeDisplay,
      minutesFromMidnight: mins,
      note: newMoveNote.trim() || (newMoveType === 'in' ? 'تسجيل دخول' : 'تسجيل خروج')
    };

    const updatedMovements = [...selectedRecord.movements, newMovement];
    const updatedRecord = {
      ...selectedRecord,
      movements: updatedMovements
    };

    // Update in state

  };

  // Delete movement
  const handleDeleteMovement = (moveId: string) => {
    if (!selectedRecord) return;
    const updatedRecord = {
      ...selectedRecord,
      movements: updatedMovements
    };
  };

  // Quick check-in / check-out for current user
  const handleQuickCheckIn = () => {
    const isPm = hours >= 12;
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${h12 < 10 ? '0' + h12 : h12}:${mins < 10 ? '0' + mins : mins} ${isPm ? 'PM' : 'AM'}`;
    const minsMid = hours * 60 + mins;

    const todayStr = now.toISOString().split('T')[0];
    const userEmp = employees.find(e => e.fullName === user.username) || employees[0];
    const empId = userEmp ? userEmp.id : 'HR-1001';
    const empName = userEmp ? userEmp.fullName : user.username;


    if (existingToday) {
      const newMove: AttendanceMovement = {
        id: 'm-' + Date.now(),
        type: 'in',
        time: timeStr,
        minutesFromMidnight: minsMid,
        note: 'تسجيل دخول مباشر'
      };
      const updated = {
        ...existingToday,
        movements: [...existingToday.movements, newMove]
      };
    } else {
      const newRec: AttendanceRecord = {
        id: 'att-' + Date.now(),
        employeeId: empId,
        employeeName: empName,
        date: todayStr,
        status: 'Present',
        movements: [
          {
            id: 'm-' + Date.now(),
            type: 'in',
            time: timeStr,
            minutesFromMidnight: minsMid,
            note: 'تسجيل دخول مباشر'
          }
        ]
      };
    }
  };

  const handleQuickCheckOut = () => {
    const isPm = hours >= 12;
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const timeStr = `${h12 < 10 ? '0' + h12 : h12}:${mins < 10 ? '0' + mins : mins} ${isPm ? 'PM' : 'AM'}`;
    const minsMid = hours * 60 + mins;

    const todayStr = now.toISOString().split('T')[0];
    const userEmp = employees.find(e => e.fullName === user.username) || employees[0];
    const empId = userEmp ? userEmp.id : 'HR-1001';

    if (existingToday) {
      const newMove: AttendanceMovement = {
        id: 'm-' + Date.now(),
        type: 'out',
        time: timeStr,
        minutesFromMidnight: minsMid,
        note: 'تسجيل انصراف مباشر'
      };
      const updated = {
        ...existingToday,
        movements: [...existingToday.movements, newMove]
      };
    } else {
    }
  };

  // Handle Add New Attendance Day Record
  const handleCreateDayRecord = (e: React.FormEvent) => {
    const emp = employees.find(item => item.id === newDayEmpId) || {
      id: newDayEmpId,
      fullName: 'موظف'
    };

    const movements: AttendanceMovement[] = [];
    if (newDayStatus !== 'Absent' && newDayStatus !== 'Leave') {
      if (newDayInTime.trim()) {
        movements.push({
          id: 'm-' + Date.now() + '-in',
          type: 'in',
          time: newDayInTime.trim(),
          minutesFromMidnight: parseTimeToMinutes(newDayInTime),
          note: 'دخول صباحي'
      }
      if (newDayOutTime.trim()) {
        movements.push({
          id: 'm-' + Date.now() + '-out',
          type: 'out',
          time: newDayOutTime.trim(),
          minutesFromMidnight: parseTimeToMinutes(newDayOutTime),
          note: 'انصراف'
      }
    }

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.fullName,
      date: newDayDate,
      status: newDayStatus,
      movements
    };

  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">سجل الحضور والانصراف</h2>
          <p className="text-slate-500 mt-1">
            {isAdminOrAccountant 
              ? 'متابعة أوقات دوام الموظفين، حركات الدخول والخروج المتعددة، وحساب ساعات العمل اليومية'
              : 'سجل دوامك اليومي وحساب ساعات عملك الفعلية'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddDayModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={18} />
            <span>إضافة سجل حضور</span>
          </button>
          {!isAdminOrAccountant && (
            <>
              <button 
                onClick={handleQuickCheckIn} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogIn size={18} />
                <span>تسجيل حضور</span>
              </button>
              <button 
                onClick={handleQuickCheckOut} 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                <span>تسجيل انصراف</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الرمز الوظيفي، أو التاريخ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            إجمالي السجلات: <strong className="text-slate-800">{filteredRecords.length}</strong>
          </span>
          <button 
            onClick={() => toast('يتم الآن تصفية السجلات حسب المعايير الحالية')} 
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Filter size={16} />
            <span>تصفية</span>
          </button>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {isAdminOrAccountant && <th className="p-4 font-semibold text-slate-600 text-sm">الموظف</th>}
                <th className="p-4 font-semibold text-slate-600 text-sm">التاريخ</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">أول دخول</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">آخر خروج</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">ساعات العمل الفعلية</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">الحالة</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-center">الإجراءات والساعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {isAdminOrAccountant && (
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{record.employeeName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{record.employeeId}</div>
                      </td>
                    )}
                    <td className="p-4 text-slate-700 font-medium">{record.date}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 text-sm">
                        <LogIn size={15} className="text-green-600" />
                        <span>{stats.firstCheckIn}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 text-sm">
                        <LogOut size={15} className="text-slate-400" />
                        <span>{stats.lastCheckOut}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                          <Clock size={15} className="text-blue-600" />
                          <span>{stats.formattedHours}</span>
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">
                          {stats.checkInCount} دخول / {stats.checkOutCount} خروج
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "inline-flex px-3 py-1 rounded-full text-xs font-semibold border",
                        getStatusColor(record.status)
                      )}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 cursor-pointer"
                        title="عرض سجل الدخول والخروج المتعدد وساعات العمل الفعلية"
                      >
                        <Eye size={15} />
                        <span>سجل الحركات ({record.movements.length})</span>
                      </button>
                    </td>
                  </tr>
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrAccountant ? 7 : 6} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="text-slate-300 w-12 h-12" />
                      <p className="font-semibold text-slate-600">لا توجد سجلات حضور مطابقة</p>
                      <p className="text-xs text-slate-400">حاول البحث باسم آخر أو أضف سجل حضور جديد</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL: Employee Daily Movements & Work Hours */}
      {selectedRecord && (() => {
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedRecord(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" 
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base">سجل حركات اليوم وساعات العمل</h3>
                      <span className={clsx(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        getStatusColor(selectedRecord.status)
                      )}>
                        {getStatusText(selectedRecord.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      الموظف: <strong className="text-slate-700">{selectedRecord.employeeName}</strong> | التاريخ: <strong className="text-slate-700">{selectedRecord.date}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 3 Metric Cards for Hours & Counts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between text-blue-700 mb-1">
                      <span className="text-xs font-bold">إجمالي ساعات العمل</span>
                      <Activity size={18} />
                    </div>
                    <div className="text-xl font-extrabold text-blue-900">{stats.formattedHours}</div>
                    <div className="text-[11px] text-blue-600 mt-1">
                      {stats.totalMinutes} دقيقة عمل فعلي في هذا اليوم
                    </div>
                  </div>

                  <div className="p-4 bg-green-50/70 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between text-green-700 mb-1">
                      <span className="text-xs font-bold">عدد مرات الدخول</span>
                      <ArrowDownLeft size={18} />
                    </div>
                    <div className="text-xl font-extrabold text-green-900">{stats.checkInCount} مرات</div>
                    <div className="text-[11px] text-green-600 mt-1">
                      أول دخول: {stats.firstCheckIn}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <span className="text-xs font-bold">عدد مرات الخروج</span>
                      <ArrowUpRight size={18} />
                    </div>
                    <div className="text-xl font-extrabold text-slate-900">{stats.checkOutCount} مرات</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      آخر خروج: {stats.lastCheckOut}
                    </div>
                  </div>
                </div>

                {/* Currently present badge if checked in without exit yet */}
                {stats.isCurrentlyInside && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>الموظف متواجد حالياً في العمل (لم يتم تسجيل خروج الجلسة الأخيرة بعد).</span>
                  </div>
                )}

                {/* Movements Timeline Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                    <span>تسلسل الحركات (دخول / خروج) اليوم</span>
                    <span className="text-xs font-normal text-slate-500">عدد الحركات: {selectedRecord.movements.length}</span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-3 font-semibold">#</th>
                          <th className="p-3 font-semibold">نوع الحركة</th>
                          <th className="p-3 font-semibold">الوقت</th>
                          <th className="p-3 font-semibold">الملاحظات</th>
                          <th className="p-3 font-semibold text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.sortedMovements.map((move, index) => (
                          <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-slate-500 font-mono">{index + 1}</td>
                            <td className="p-3">
                              <span className={clsx(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold",
                                move.type === 'in' 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-slate-100 text-slate-800"
                              )}>
                                {move.type === 'in' ? <LogIn size={13} className="text-green-600" /> : <LogOut size={13} className="text-slate-500" />}
                                <span>{move.type === 'in' ? 'دخول (حضور)' : 'خروج (انصراف)'}</span>
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{move.time}</td>
                            <td className="p-3 text-slate-600">{move.note || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteMovement(move.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف هذه الحركة"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {selectedRecord.movements.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              لا توجد حركات مسجلة لهذا اليوم حتى الآن
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Movement Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 mb-3">إضافة حركة حضور أو انصراف لهذا اليوم:</h5>
                  <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">نوع الحركة</label>
                      <select
                        value={newMoveType}
                        onChange={(e: any) => setNewMoveType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        <option value="in">دخول (حضور)</option>
                        <option value="out">خروج (انصراف)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">الوقت (مثال: 14:30)</label>
                      <input
                        type="text"
                        value={newMoveTime}
                        onChange={(e) => setNewMoveTime(e.target.value)}
                        placeholder="08:00 AM أو 14:30"
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">ملاحظة (اختياري)</label>
                      <input
                        type="text"
                        value={newMoveNote}
                        onChange={(e) => setNewMoveNote(e.target.value)}
                        placeholder="مثال: عودة من اجتماع"
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>إضافة وحساب</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  إغلاق وعودة
                </button>
              </div>
            </div>
          </div>
      })()}

      {/* MODAL: Create New Day Attendance Record */}
      {showAddDayModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddDayModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">إضافة سجل حضور يومي جديد</h3>
                  <p className="text-xs text-slate-500 mt-0.5">سجل يوم دوام لموظف مع أوقات الدخول والخروج</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDayModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDayRecord} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">الموظف</label>
                <select
                  value={newDayEmpId}
                  onChange={(e) => setNewDayEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.jobTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">التاريخ</label>
                  <input
                    type="date"
                    dir="ltr"
                    value={newDayDate}
                    onChange={(e) => setNewDayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">الحالة</label>
                  <select
                    value={newDayStatus}
                    onChange={(e: any) => setNewDayStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="Present">حاضر (Present)</option>
                    <option value="Late">متأخر (Late)</option>
                    <option value="Absent">غائب (Absent)</option>
                    <option value="Leave">إجازة (Leave)</option>
                  </select>
                </div>
              </div>

              {newDayStatus !== 'Absent' && newDayStatus !== 'Leave' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">أول دخول صباحي</label>
                    <input
                      type="text"
                      value={newDayInTime}
                      onChange={(e) => setNewDayInTime(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">آخر خروج</label>
                    <input
                      type="text"
                      value={newDayOutTime}
                      onChange={(e) => setNewDayOutTime(e.target.value)}
                      placeholder="04:00 PM"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Save size={16} />
                  <span>حفظ سجل الحضور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
}

