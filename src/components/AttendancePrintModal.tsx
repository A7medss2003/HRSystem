import React, { useState, useRef } from 'react';
import { 
  Printer, X, Eye, FileText, CheckCircle, Clock, 
  Calendar, Building2, UserCheck, ShieldCheck, Download, 
  Settings2, Layers, Check
} from 'lucide-react';
import clsx from 'clsx';
import { AttendanceRecord, Employee } from '../types';

interface AttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  employees: Employee[];
  systemSettings?: any;
  dateFilter: string;
  customStartDate?: string;
  customEndDate?: string;
  statusFilter: string;
  sourceFilter: string;
  stats: {
    totalToday: number;
    presentToday: number;
    lateToday: number;
    totalHours: number;
  };
  currentUser: {
    username: string;
    role: string;
  };
}

export default function AttendancePrintModal({
  isOpen,
  onClose,
  records,
  employees,
  systemSettings,
  dateFilter,
  customStartDate,
  customEndDate,
  statusFilter,
  sourceFilter,
  stats,
  currentUser
}: AttendancePrintModalProps) {
  const [showStats, setShowStats] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [fontSize, setFontSize] = useState<'normal' | 'compact'>('normal');

  if (!isOpen) return null;

  const companyName = systemSettings?.companyName || 'مركز البنيان للتقنية و الصناعات الهندسية';
  const currentDateFormatted = new Date().toLocaleDateString('ar-LY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const printTimeFormatted = new Date().toLocaleTimeString('ar-LY', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate descriptive date label
  const getDateLabel = () => {
    if (dateFilter === 'today') return `اليوم (${new Date().toISOString().split('T')[0]})`;
    if (dateFilter === 'week') return 'الأسبوع الحالي';
    if (dateFilter === 'month') return 'الشهر الحالي';
    if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        return `من ${customStartDate} إلى ${customEndDate}`;
      }
      return 'فترة مخصصة';
    }
    return 'جميع التواريخ المسجلة';
  };

  const getSourceLabel = () => {
    if (sourceFilter === 'zkteco') return 'جهاز البصمة (ZKTeco) فقط';
    if (sourceFilter === 'manual') return 'تسجيل يدوي فقط';
    return 'جميع المصادر (أجهزة البصمة + تسجيل يدوي)';
  };

  const getStatusLabel = () => {
    if (statusFilter === 'Present') return 'الحاضرون فقط';
    if (statusFilter === 'Late') return 'المتأخرون فقط';
    if (statusFilter === 'Absent') return 'الغائبون فقط';
    if (statusFilter === 'Leave') return 'في إجازة فقط';
    return 'كل الحالات';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:static print:overflow-visible">
      <div 
        className={clsx(
          "bg-slate-100 rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden border border-slate-300 transition-all",
          "max-h-[94vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:w-full print:rounded-none",
          orientation === 'landscape' ? "max-w-6xl" : "max-w-4xl"
        )}
        dir="rtl"
      >
        
        {/* Modal Controls Header (Hidden during actual print) */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
              <Printer size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">معاينة وطباعة تقرير الحضور والانصراف</h3>
                <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {records.length} سجل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                معاينة شكل الصفحة الفعلي قبل إرسالها للطابعة أو الحفظ بصيغة PDF
              </p>
            </div>
          </div>

          {/* Action buttons & Options */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* View options */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
              <button
                onClick={() => setOrientation('landscape')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  orientation === 'landscape' ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                )}
                title="تخطيط عرضي مناسب للجداول العريضة"
              >
                تخطيط أفقي
              </button>
              <button
                onClick={() => setOrientation('portrait')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  orientation === 'portrait' ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                )}
                title="تخطيط طولي قياسي"
              >
                تخطيط رأسي
              </button>
            </div>

            {/* Font size toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
              <button
                onClick={() => setFontSize('normal')}
                className={clsx(
                  "px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  fontSize === 'normal' ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                )}
              >
                خط قياسي
              </button>
              <button
                onClick={() => setFontSize('compact')}
                className={clsx(
                  "px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs",
                  fontSize === 'compact' ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                )}
              >
                مدمج
              </button>
            </div>

            {/* Toggle Stats */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>الإحصائيات</span>
            </label>

            {/* Toggle Signatures */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>التوقيعات</span>
            </label>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Printer size={15} />
              <span>طباعة الآن</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="إغلاق المعاينة"
            >
              <X size={18} />
            </button>

          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible bg-slate-200/70 print:bg-white flex justify-center">
          
          {/* A4 Paper Document Sheet */}
          <div 
            id="attendance-print-document"
            className={clsx(
              "bg-white shadow-xl border border-slate-300 rounded-xl p-8 sm:p-10 w-full transition-all text-slate-800 font-sans",
              "print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none",
              orientation === 'landscape' ? "max-w-5xl" : "max-w-3xl"
            )}
          >
            
            {/* Document Header */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6">
              <div className="flex items-start justify-between gap-4">
                
                {/* Organization Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      <Building2 size={18} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      {companyName}
                    </h1>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    نظام إدارة الموارد البشرية وشؤون الموظفين • تقارير البصمة والحضور
                  </p>
                </div>

                {/* Report Title Badge */}
                <div className="text-left space-y-1">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 rounded-md text-xs font-bold">
                    تقرير رسمي
                  </span>
                  <div className="text-[11px] text-slate-500 font-mono">
                    تاريخ الاستخراج: {currentDateFormatted}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    الوقت: {printTimeFormatted}
                  </div>
                </div>

              </div>

              {/* Main Document Title */}
              <div className="mt-5 text-center bg-slate-50 py-2.5 px-4 rounded-lg border border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  كشف وسجلات الحضور والانصراف
                </h2>
                <div className="flex items-center justify-center gap-4 mt-1 text-xs text-slate-600 flex-wrap">
                  <div><strong className="text-slate-800">الفترة:</strong> {getDateLabel()}</div>
                  <span className="text-slate-300">•</span>
                  <div><strong className="text-slate-800">المصدر:</strong> {getSourceLabel()}</div>
                  <span className="text-slate-300">•</span>
                  <div><strong className="text-slate-800">الحالة:</strong> {getStatusLabel()}</div>
                  <span className="text-slate-300">•</span>
                  <div><strong className="text-slate-800">إجمالي السجلات:</strong> {records.length}</div>
                </div>
              </div>

            </div>

            {/* Optional Stats Summary Cards */}
            {showStats && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">إجمالي السجلات المعروضة</div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">{records.length}</div>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[11px] text-emerald-800 font-semibold">حضور في الموعد</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{stats.presentToday}</div>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-center">
                  <div className="text-[11px] text-amber-800 font-semibold">حالات التأخير</div>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">{stats.lateToday}</div>
                </div>
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-center">
                  <div className="text-[11px] text-blue-800 font-semibold">مجموع ساعات العمل</div>
                  <div className="text-lg font-bold text-blue-700 mt-0.5">{stats.totalHours} <span className="text-xs font-normal">ساعة</span></div>
                </div>
              </div>
            )}

            {/* Detailed Table */}
            <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
              <table className={clsx("w-full text-right border-collapse", fontSize === 'compact' ? "text-[11px]" : "text-xs")}>
                <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 border-l border-slate-200 text-center w-10">#</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">الموظف</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">الرقم الوظيفي</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">القسم</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">التاريخ</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">وقت الحضور</th>
                    <th className="py-2.5 px-3 border-l border-slate-200">وقت الانصراف</th>
                    <th className="py-2.5 px-3 border-l border-slate-200 text-center">ساعات العمل</th>
                    <th className="py-2.5 px-3 border-l border-slate-200 text-center">التأخير</th>
                    <th className="py-2.5 px-3 border-l border-slate-200 text-center">الحالة</th>
                    <th className="py-2.5 px-3 text-center">المصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.length > 0 ? (
                    records.map((r, index) => {
                      const emp = employees.find(e => e.id === r.employeeId || e.fullName === r.employeeName);
                      const sortedMoves = [...(r.movements || [])].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
                      const firstIn = sortedMoves[0]?.time;
                      const lastOut = sortedMoves.length > 1 ? sortedMoves[sortedMoves.length - 1]?.time : undefined;

                      return (
                        <tr key={r.id || index} className={index % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                          <td className="py-2 px-3 border-l border-slate-200 text-center font-mono text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 font-bold text-slate-900">
                            {r.employeeName}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 font-mono text-slate-600">
                            {emp?.employeeId || r.employeeId || '—'}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 text-slate-700">
                            {emp?.department || '—'}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 font-mono text-slate-700">
                            {r.date}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 font-mono font-bold text-slate-800">
                            {firstIn ? firstIn : (r.status === 'Present' || r.status === 'Late' ? 'مسجل' : '—')}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 font-mono text-slate-700">
                            {lastOut ? lastOut : '—'}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 text-center font-mono text-slate-800 font-semibold">
                            {r.workHours ? `${r.workHours} س` : '—'}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 text-center font-mono">
                            {r.delayMinutes && r.delayMinutes > 0 ? (
                              <span className="text-amber-700 font-bold">
                                {r.delayMinutes} د
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 text-center">
                            <span className={clsx(
                              "inline-block px-2 py-0.5 rounded text-[10px] font-bold border",
                              r.status === 'Present' && "bg-emerald-50 text-emerald-800 border-emerald-300",
                              r.status === 'Late' && "bg-amber-50 text-amber-800 border-amber-300",
                              r.status === 'Absent' && "bg-rose-50 text-rose-800 border-rose-300",
                              r.status === 'Leave' && "bg-blue-50 text-blue-800 border-blue-300"
                            )}>
                              {r.status === 'Present' ? 'حاضر' : r.status === 'Late' ? 'متأخر' : r.status === 'Absent' ? 'غائب' : 'إجازة'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-[10px] text-slate-600 font-medium">
                            {r.source === 'zkteco' ? 'بصمة ZKTeco' : 'يدوي'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        لا توجد سجلات مطابقة للطباعة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Signatures & Approvals Section */}
            {showSignatures && (
              <div className="mt-8 pt-6 border-t-2 border-slate-300">
                <div className="grid grid-cols-3 gap-8 text-center">
                  
                  <div className="space-y-12">
                    <div>
                      <div className="text-xs font-bold text-slate-800">مسؤول الحضور والانصراف</div>
                      <div className="text-[10px] text-slate-500">مُعدّ الكشف: {currentUser.username}</div>
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                    <div className="text-[11px] text-slate-500">التوقيع والتاريخ</div>
                  </div>

                  <div className="space-y-12">
                    <div>
                      <div className="text-xs font-bold text-slate-800">مدير الموارد البشرية</div>
                      <div className="text-[10px] text-slate-500">المراجعة والتدقيق</div>
                    </div>
                    <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                    <div className="text-[11px] text-slate-500">التوقيع والتاريخ</div>
                  </div>

                  <div className="space-y-12">
                    <div>
                      <div className="text-xs font-bold text-slate-800">اعتماد الإدارة العامة</div>
                      <div className="text-[10px] text-slate-500">الختم الرسمي</div>
                    </div>
                    <div className="w-20 h-20 rounded-full border border-dashed border-slate-400 mx-auto flex items-center justify-center text-[10px] text-slate-400">
                      مكان الختم
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex justify-between items-center">
              <div>طُبع من خلال المنظومة الإدارية • {companyName}</div>
              <div>صفحة 1 من 1</div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
