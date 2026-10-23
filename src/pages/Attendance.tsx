import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Filter, Plus, Clock, Calendar, User, 
  CheckCircle, AlertCircle, Trash2, Save, FileText, 
  Activity, Sparkles, Download, Printer, RefreshCw, 
  Fingerprint, ChevronDown, Check, ArrowUpDown, Eye, Edit
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { toast } from '../components/Toast';
import { useStore } from '../store';
import { AttendanceRecord, AttendanceMovement } from '../types';
import { isManagerEmployee, isRegularUser } from '../lib/managerGuard';
import ZKTecoImportModal from '../components/ZKTecoImportModal';
import AttendanceRecordModal from '../components/AttendanceRecordModal';
import AttendancePrintModal from '../components/AttendancePrintModal';

export default function Attendance({ user }: { user: { role: string; username: string; permissions?: string[] }; }) {
  const { 
    employees, 
    attendanceRecords: records, 
    setAttendanceRecords: setRecords, 
    systemSettings 
  } = useStore();

  const isAdminOrAccountant = ['admin', 'accountant', 'developer'].includes(user.role) || user.permissions?.includes('all');
  const isRegular = isRegularUser(user);

  // States
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Late' | 'Absent' | 'Leave'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'zkteco' | 'manual'>('all');

  // Modals & Menus
  const [isZkModalOpen, setIsZkModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const importExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (importExportRef.current && !importExportRef.current.contains(event.target as Node)) {
        setIsImportExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Date helper
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Regular user guard
      if (isRegular && r.employeeName !== user.username) return false;
      const emp = employees.find(e => e.id === r.employeeId || e.fullName === r.employeeName);
      if (isRegular && emp && isManagerEmployee(emp)) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (r.employeeName || '').toLowerCase().includes(q);
        const matchesId = (r.employeeId || '').toLowerCase().includes(q);
        const matchesEmpId = emp?.employeeId?.toLowerCase().includes(q);
        const matchesFpId = emp?.fingerprintId?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesEmpId && !matchesFpId) return false;
      }

      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Source
      if (sourceFilter !== 'all') {
        const recSource = r.source || 'manual';
        if (recSource !== sourceFilter) return false;
      }

      // Date Range
      if (dateFilter === 'today') {
        if (r.date !== todayStr) return false;
      } else if (dateFilter === 'week') {
        const recDate = new Date(r.date);
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (recDate < oneWeekAgo || recDate > now) return false;
      } else if (dateFilter === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        if (!r.date.startsWith(currentMonth)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && r.date < customStartDate) return false;
        if (customEndDate && r.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, employees, isRegular, user.username, search, statusFilter, sourceFilter, dateFilter, customStartDate, customEndDate, todayStr]);

  // Statistics calculation
  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === todayStr);
    const presentToday = todayRecords.filter(r => r.status === 'Present').length;
    const lateToday = todayRecords.filter(r => r.status === 'Late').length;
    
    // Total hours in filtered list
    let totalWorkHours = 0;
    filteredRecords.forEach(r => {
      if (r.workHours) {
        totalWorkHours += r.workHours;
      } else if (r.movements && r.movements.length >= 2) {
        const first = r.movements[0].minutesFromMidnight;
        const last = r.movements[r.movements.length - 1].minutesFromMidnight;
        if (last > first) {
          totalWorkHours += (last - first) / 60;
        }
      }
    });

    return {
      presentToday,
      lateToday,
      totalToday: todayRecords.length,
      totalHours: Math.round(totalWorkHours * 10) / 10
    };
  }, [records, filteredRecords, todayStr]);

  // Handlers
  const handleSaveRecord = (savedRecord: AttendanceRecord) => {
    const existingIndex = records.findIndex(r => r.id === savedRecord.id);
    if (existingIndex >= 0) {
      const updated = [...records];
      updated[existingIndex] = savedRecord;
      setRecords(updated);
    } else {
      setRecords([savedRecord, ...records]);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast('لا توجد سجلات لتصديرها', 'error');
      return;
    }

    const exportData = filteredRecords.map((r, index) => {
      const emp = employees.find(e => e.id === r.employeeId || e.fullName === r.employeeName);
      const sortedMoves = [...(r.movements || [])].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
      const firstIn = sortedMoves[0]?.time || '—';
      const lastOut = sortedMoves.length > 1 ? sortedMoves[sortedMoves.length - 1]?.time : '—';

      return {
        '#': index + 1,
        'اسم الموظف': r.employeeName,
        'الرقم الوظيفي': emp?.employeeId || r.employeeId,
        'رقم البصمة': emp?.fingerprintId || '—',
        'القسم': emp?.department || '—',
        'التاريخ': r.date,
        'وقت الحضور': firstIn,
        'وقت الانصراف': lastOut,
        'ساعات العمل': r.workHours || (firstIn !== '—' && lastOut !== '—' ? 'محسوب' : '—'),
        'دقائق التأخير': r.delayMinutes || 0,
        'الحالة': r.status === 'Present' ? 'حاضر' : r.status === 'Late' ? 'متأخر' : r.status === 'Absent' ? 'غائب' : 'إجازة',
        'المصدر': r.source === 'zkteco' ? 'جهاز البصمة (ZKTeco)' : 'تسجيل يدوي'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجلات الحضور');
    XLSX.writeFile(wb, `سجلات_الحضور_${todayStr}.xlsx`);
    toast('تم تصدير ملف الإكسل بنجاح', 'success');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast('لا توجد سجلات لتصديرها', 'error');
      return;
    }

    const exportData = filteredRecords.map((r, index) => {
      const emp = employees.find(e => e.id === r.employeeId || e.fullName === r.employeeName);
      const sortedMoves = [...(r.movements || [])].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
      const firstIn = sortedMoves[0]?.time || '—';
      const lastOut = sortedMoves.length > 1 ? sortedMoves[sortedMoves.length - 1]?.time : '—';

      return {
        '#': index + 1,
        'اسم الموظف': r.employeeName,
        'الرقم الوظيفي': emp?.employeeId || r.employeeId,
        'رقم البصمة': emp?.fingerprintId || '—',
        'القسم': emp?.department || '—',
        'التاريخ': r.date,
        'وقت الحضور': firstIn,
        'وقت الانصراف': lastOut,
        'ساعات العمل': r.workHours || (firstIn !== '—' && lastOut !== '—' ? 'محسوب' : '—'),
        'دقائق التأخير': r.delayMinutes || 0,
        'الحالة': r.status === 'Present' ? 'حاضر' : r.status === 'Late' ? 'متأخر' : r.status === 'Absent' ? 'غائب' : 'إجازة',
        'المصدر': r.source === 'zkteco' ? 'جهاز البصمة (ZKTeco)' : 'تسجيل يدوي'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجلات_الحضور_${todayStr}.csv`;
    link.click();
    toast('تم تصدير ملف CSV بنجاح', 'success');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">الحضور والانصراف</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredRecords.length} سجل
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة أوقات الحضور والانصراف، الربط المباشر مع أجهزة البصمة ZKTeco، واحتساب ساعات العمل والتأخير
          </p>
        </div>

        {isAdminOrAccountant && (
          <div className="flex flex-wrap items-center gap-2">
            
            {/* استيراد وتصدير (Menu Dropdown Button) */}
            <div className="relative" ref={importExportRef}>
              <button
                onClick={() => setIsImportExportOpen(prev => !prev)}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-xs cursor-pointer border border-blue-600 active:scale-[0.98]"
              >
                <ArrowUpDown size={15} />
                <span>استيراد وتصدير</span>
                <ChevronDown size={14} className={clsx("transition-transform duration-200", isImportExportOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu */}
              {isImportExportOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                    خيارات الاستيراد والتصدير
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsZkModalOpen(true);
                      setIsImportExportOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-2.5 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Fingerprint size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">استيراد من جهاز البصمة (ZKTeco)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ملفات DAT, TXT, CSV, Excel مع المطابقة</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleExportExcel();
                      setIsImportExportOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-2.5 hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-800 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Download size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">تصدير إلى ملف إكسل (.xlsx)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">تصدير {filteredRecords.length} سجل مصفى</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleExportCSV();
                      setIsImportExportOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-2.5 hover:bg-amber-50/80 text-slate-700 hover:text-amber-800 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">تصدير بصيغة CSV</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ملف بيانات مفصول بفواصل</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsPrintModalOpen(true);
                      setIsImportExportOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Printer size={15} className="text-blue-600" />
                    <span>الطباعة والمعاينة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Add Button */}
            <button
              onClick={() => {
                setSelectedRecord(null);
                setIsRecordModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus size={15} className="text-blue-600" />
              <span>إضافة سجل يدوي</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98]"
              title="تصدير السجلات المعروضة إلى ملف إكسل"
            >
              <Download size={15} className="text-emerald-600" />
              <span>تصدير إكسل</span>
            </button>

            {/* Print and Preview Report */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98] group"
              title="معاينة وطباعة تقرير الحضور والانصراف"
            >
              <Printer size={15} className="text-blue-600 transition-transform group-hover:scale-110" />
              <span>الطباعة والمعاينة</span>
            </button>

          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">حضور اليوم في الموعد</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.presentToday}</div>
            <div className="text-[10px] text-emerald-600">من أصل {stats.totalToday} حضور</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">المتأخرون اليوم</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.lateToday}</div>
            <div className="text-[10px] text-amber-600">بعد فترة السماح</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">مجموع ساعات العمل</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalHours} <span className="text-xs font-normal text-slate-500">ساعة</span></div>
            <div className="text-[10px] text-blue-600">للفترة المعروضة</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Fingerprint size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">سجلات جهاز البصمة</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">
              {records.filter(r => r.source === 'zkteco').length}
            </div>
            <div className="text-[10px] text-indigo-600">مستوردة من ZKTeco</div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3.5 print:hidden">
        
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="البحث بالاسم، الرقم الوظيفي، أو رقم البصمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-bold ml-1">التاريخ:</span>
            <button
              onClick={() => setDateFilter('today')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                dateFilter === 'today' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                dateFilter === 'week' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                dateFilter === 'month' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                dateFilter === 'all' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              الكل
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                dateFilter === 'custom' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              مخصص
            </button>
          </div>

          {/* Status & Source Selects */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="Present">حاضر في الموعد</option>
              <option value="Late">متأخر</option>
              <option value="Absent">غائب</option>
              <option value="Leave">إجازة</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">كل المصادر</option>
              <option value="zkteco">جهاز البصمة (ZKTeco)</option>
              <option value="manual">تسجيل يدوي</option>
            </select>
          </div>

        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3 text-xs animate-in slide-in-from-top-1">
            <span className="font-bold text-slate-700">الفترة من:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
            />
            <span className="font-bold text-slate-700">إلى:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>
        )}

      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Printable Header (Visible only when printing) */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-center">
          <h2 className="text-xl font-bold text-slate-900">{systemSettings?.companyName || 'نظام الموارد البشرية'}</h2>
          <h3 className="text-base font-semibold text-slate-700 mt-1">تقرير سجلات الحضور والانصراف</h3>
          <p className="text-xs text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-LY')} • إجمالي السجلات: {filteredRecords.length}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">الموظف</th>
                <th className="py-4 px-5">القسم</th>
                <th className="py-4 px-5">التاريخ</th>
                <th className="py-4 px-5">الحضور (دخول)</th>
                <th className="py-4 px-5">الانصراف (خروج)</th>
                <th className="py-4 px-5">ساعات العمل</th>
                <th className="py-4 px-5">الحالة</th>
                <th className="py-4 px-5">المصدر</th>
                <th className="py-4 px-5 text-center print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const emp = employees.find(e => e.id === r.employeeId || e.fullName === r.employeeName);
                  const sortedMoves = [...(r.movements || [])].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
                  const firstIn = sortedMoves[0]?.time;
                  const lastOut = sortedMoves.length > 1 ? sortedMoves[sortedMoves.length - 1]?.time : undefined;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Employee */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 text-sm">{r.employeeName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>{emp?.employeeId || r.employeeId}</span>
                          {emp?.fingerprintId && (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 text-[10px]">
                              بصمة: {emp.fingerprintId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-5 text-slate-600">
                        {emp?.department || '—'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-5 font-mono text-slate-700 font-medium">
                        {r.date}
                      </td>

                      {/* In Time */}
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-800">
                        {firstIn ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {firstIn}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Out Time */}
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-800">
                        {lastOut ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {lastOut}
                          </span>
                        ) : firstIn ? (
                          <span className="text-amber-600 font-sans text-[11px]">بصمة واحدة</span>
                        ) : '—'}
                      </td>

                      {/* Work Hours */}
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                        {r.workHours ? (
                          <span>{r.workHours} س</span>
                        ) : (firstIn && lastOut) ? (
                          <span>
                            {Math.round(((sortedMoves[sortedMoves.length - 1].minutesFromMidnight - sortedMoves[0].minutesFromMidnight) / 60) * 10) / 10} س
                          </span>
                        ) : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1",
                          r.status === 'Present' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          r.status === 'Absent' ? "bg-red-100 text-red-800 border border-red-200" :
                          r.status === 'Late' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-blue-100 text-blue-800 border border-blue-200"
                        )}>
                          {r.status === 'Present' && <CheckCircle size={12} />}
                          {r.status === 'Late' && <Clock size={12} />}
                          {r.status === 'Present' ? 'حاضر' : r.status === 'Absent' ? 'غائب' : r.status === 'Late' ? (
                            r.delayMinutes ? `متأخر (${r.delayMinutes} د)` : 'متأخر'
                          ) : 'إجازة'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-5">
                        {r.source === 'zkteco' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Fingerprint size={12} />
                            جهاز البصمة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                            يدوي
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedRecord(r);
                              setIsRecordModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="عرض وتعديل التفاصيل"
                          >
                            <Edit size={16} />
                          </button>

                          {isAdminOrAccountant && (
                            <button 
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
                                  handleDeleteRecord(r.id);
                                  toast('تم حذف السجل بنجاح', 'info');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Fingerprint size={24} />
                    </div>
                    <div className="text-sm font-semibold text-slate-600">لا توجد سجلات حضور مطابقة</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      يمكنك استيراد سجلات البصمة مباشرة من ملف جهاز ZKTeco أو إضافة سجل حضور يدوي بالضغط على الأزرار بالأعلى.
                    </p>
                    {isAdminOrAccountant && (
                      <button
                        onClick={() => setIsZkModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Fingerprint size={16} />
                        استيراد من جهاز البصمة ZKTeco الآن
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ZKTeco Import Modal */}
      <ZKTecoImportModal
        isOpen={isZkModalOpen}
        onClose={() => setIsZkModalOpen(false)}
      />

      {/* Add / Edit Attendance Record Modal */}
      <AttendanceRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        employees={employees}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        readOnly={!isAdminOrAccountant}
      />

      {/* Attendance Print & Preview Modal */}
      <AttendancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={filteredRecords}
        employees={employees}
        systemSettings={systemSettings}
        dateFilter={dateFilter}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        statusFilter={statusFilter}
        sourceFilter={sourceFilter}
        stats={stats}
        currentUser={user}
      />

    </div>
  );
}
