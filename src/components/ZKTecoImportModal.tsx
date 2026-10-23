import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  HelpCircle, Settings2, Download, ArrowRight, RefreshCw, 
  Clock, UserCheck, UserX, Database, Sparkles, Filter, ChevronDown, Check
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { 
  AttendanceImportConfig, 
  AttendanceImportPreviewRow, 
  Employee, 
  AttendanceRecord 
} from '../types';
import { 
  parseAttendanceFile, 
  parseAttendanceRawText, 
  applyAttendanceImport, 
  generateSampleZkFile 
} from '../lib/zktecoParser';
import { toast } from './Toast';

interface ZKTecoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ZKTecoImportModal({ isOpen, onClose, onSuccess }: ZKTecoImportModalProps) {
  const { 
    employees, 
    attendanceRecords, 
    setAttendanceRecords, 
    updateEmployee, 
    systemSettings, 
    addSystemLog 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preview'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [rawPunchesCount, setRawPunchesCount] = useState(0);
  const [previewRows, setPreviewRows] = useState<AttendanceImportPreviewRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'unmatched' | 'late' | 'merge'>('all');
  const [filterSearch, setFilterSearch] = useState('');

  // إعدادات الاستيراد
  const [config, setConfig] = useState<AttendanceImportConfig>({
    workStartTime: systemSettings?.workStartTime || '08:30',
    workEndTime: systemSettings?.workEndTime || '16:30',
    lateGraceMinutes: systemSettings?.lateGracePeriodMinutes ?? 15,
    mergeStrategy: 'merge', // دمج وتحديث أوقات الحضور والانصراف تلقائياً
    autoLinkUnknownByEnrollId: true
  });

  const [showConfig, setShowConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setParseErrors([]);

    try {
      const result = await parseAttendanceFile(file, config, employees, attendanceRecords);
      setPreviewRows(result.previewRows);
      setRawPunchesCount(result.rawPunchesCount);
      setParseErrors(result.errors);
      if (result.previewRows.length > 0) {
        setActiveTab('preview');
        toast(`تم تحليل ${result.rawPunchesCount} حركة بصمة بنجاح!`, 'success');
      } else {
        toast(result.errors[0] || 'تعذر استخراج حركات صالحة من الملف', 'error');
      }
    } catch (err: any) {
      console.error(err);
      toast('حدث خطأ أثناء معالجة الملف: ' + (err.message || 'صيغة غير مدعومة'), 'error');
      setParseErrors([err.message || 'خطأ غير متوقع']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRawText = () => {
    if (!rawText.trim()) {
      toast('يرجى لصق نص سجلات البصمة أولاً', 'error');
      return;
    }
    setIsLoading(true);
    setParseErrors([]);

    try {
      const result = parseAttendanceRawText(rawText, config, employees, attendanceRecords);
      setPreviewRows(result.previewRows);
      setRawPunchesCount(result.rawPunchesCount);
      setParseErrors(result.errors);
      if (result.previewRows.length > 0) {
        setActiveTab('preview');
        toast(`تم تحليل ${result.rawPunchesCount} حركة بصمة بنجاح!`, 'success');
      } else {
        toast('لم يتم التعرف على أي أسطر بصمة صالحة', 'error');
      }
    } catch (err: any) {
      toast('خطأ في معالجة النص: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة الحساب عند تعديل أوقات العمل أو فترة السماح
  const handleRecalculatePreview = () => {
    if (selectedFile) {
      processSelectedFile(selectedFile);
    } else if (rawText) {
      handleProcessRawText();
    }
  };

  // الربط اليدوي لموظف غير مطابق وتحديث رقم البصمة له في النظام
  const handleManualMapEmployee = (rowId: string, employeeId: string) => {
    const targetEmp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
    if (!targetEmp) return;

    setPreviewRows(prev => prev.map(row => {
      if (row.id === rowId || (row.pin === prev.find(p => p.id === rowId)?.pin)) {
        return {
          ...row,
          matchedEmployeeId: targetEmp.id,
          matchedEmployeeName: targetEmp.fullName,
          matchMethod: 'manual'
        };
      }
      return row;
    }));

    toast(`تم ربط البصمة بالموظف "${targetEmp.fullName}"`, 'info');
  };

  // حفظ رقم البصمة في ملف الموظف مباشرة
  const handleSaveFingerprintToEmployee = (pin: string, employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    updateEmployee({
      ...emp,
      fingerprintId: pin
    });

    toast(`تم حفظ رقم البصمة (${pin}) في ملف الموظف "${emp.fullName}" بنجاح`, 'success');
  };

  // تنفيذ الاستيراد النهائي وحفظ السجلات
  const handleConfirmImport = () => {
    if (previewRows.length === 0) {
      toast('لا توجد سجلات للاستيراد', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { updatedRecords, stats } = applyAttendanceImport(previewRows, attendanceRecords, config);
      setAttendanceRecords(updatedRecords);

      // حفظ أرقام البصمات للموظفين الذين تم ربطهم إذا كان الخيار مفعلاً
      if (config.autoLinkUnknownByEnrollId) {
        previewRows.forEach(row => {
          if (row.matchedEmployeeId && row.pin) {
            const emp = employees.find(e => e.id === row.matchedEmployeeId);
            if (emp && !emp.fingerprintId) {
              updateEmployee({ ...emp, fingerprintId: row.pin });
            }
          }
        });
      }

      addSystemLog({
        userId: 'system',
        userName: 'جهاز البصمة ZKTeco',
        action: 'استيراد سجلات البصمة',
        details: `تم استيراد ومعالجة سجلات البصمة: إنشاء ${stats.created} سجل جديد، تحديث ودمج ${stats.merged} سجل، وتخطي ${stats.skipped} سجل.`
      });

      toast(`اكتمل الاستيراد! تم إنشاء ${stats.created} سجل جديد وتحديث/دمج ${stats.merged} سجل.`, 'success');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast('حدث خطأ أثناء حفظ السجلات: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // تنزيل نموذج تجريبي
  const handleDownloadSample = (formatType: 'dat' | 'txt' | 'csv' | 'xlsx') => {
    const { blob, fileName } = generateSampleZkFile(employees, formatType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`تم تحميل نموذج ${formatType.toUpperCase()} التجريبي جاهزاً للتجربة`, 'success');
  };

  // إحصائيات المعاينة
  const matchedCount = previewRows.filter(r => r.matchedEmployeeName).length;
  const unmatchedCount = previewRows.filter(r => !r.matchedEmployeeName).length;
  const lateCount = previewRows.filter(r => r.status === 'Late').length;
  const existingMergeCount = previewRows.filter(r => r.isExisting).length;

  const filteredPreviewRows = previewRows.filter(row => {
    if (previewFilter === 'unmatched' && row.matchedEmployeeName) return false;
    if (previewFilter === 'late' && row.status !== 'Late') return false;
    if (previewFilter === 'merge' && !row.isExisting) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const name = (row.matchedEmployeeName || '').toLowerCase();
      const pin = row.pin.toLowerCase();
      const date = row.date;
      return name.includes(q) || pin.includes(q) || date.includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">استيراد سجلات الحضور من جهاز البصمة (ZKTeco)</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                دعم شامل لملفات: Excel (.xlsx, .xls) و CSV و DAT و TXT مع المطابقة والدمج الذكي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={clsx(
                "p-2 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer",
                showConfig ? "bg-white text-blue-800" : "bg-white/10 hover:bg-white/20 text-white"
              )}
              title="إعدادات الاستيراد ومواعيد العمل"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">إعدادات الدوام</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Configuration Drawer */}
        {showConfig && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">بداية الدوام الرسمي</label>
                <div className="relative">
                  <Clock size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
                  <input
                    type="time"
                    value={config.workStartTime}
                    onChange={(e) => setConfig({ ...config, workStartTime: e.target.value })}
                    className="w-full pl-2 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">فترة السماح للتأخير (دقائق)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={config.lateGraceMinutes}
                  onChange={(e) => setConfig({ ...config, lateGraceMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="15 دقيقة"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">معالجة السجلات الموجودة مسبقاً</label>
                <select
                  value={config.mergeStrategy}
                  onChange={(e) => setConfig({ ...config, mergeStrategy: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="merge">دمج وتحديث الأوقات تلقائياً (موصى به)</option>
                  <option value="overwrite">استبدال السجلات القديمة بالكامل</option>
                  <option value="skip">تخطي وعدم المساس بالسجلات الموجودة</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={config.autoLinkUnknownByEnrollId}
                    onChange={(e) => setConfig({ ...config, autoLinkUnknownByEnrollId: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>حفظ أرقام البصمات في ملف الموظفين</span>
                </label>
              </div>
            </div>

            {previewRows.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleRecalculatePreview}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  إعادة احتساب الحالات بالأوقات الجديدة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={clsx(
              "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer",
              activeTab === 'upload' 
                ? "border-blue-600 text-blue-700 bg-white" 
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <UploadCloud size={16} />
            رفع ملف البصمة (Excel, DAT, TXT, CSV)
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={clsx(
              "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer",
              activeTab === 'paste' 
                ? "border-blue-600 text-blue-700 bg-white" 
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <FileText size={16} />
            لصق نصوص البصمة مباشرة
          </button>

          {previewRows.length > 0 && (
            <button
              onClick={() => setActiveTab('preview')}
              className={clsx(
                "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer mr-auto",
                activeTab === 'preview' 
                  ? "border-blue-600 text-blue-700 bg-white" 
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <CheckCircle2 size={16} className="text-emerald-600" />
              المعاينة والمطابقة
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px] font-mono">
                {previewRows.length} سجل
              </span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all",
                  selectedFile 
                    ? "border-blue-500 bg-blue-50/50" 
                    : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dat,.txt,.csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <UploadCloud size={32} />
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {selectedFile ? selectedFile.name : 'اسحب وأفلت ملف جهاز البصمة هنا، أو انقر للاختيار'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  يدعم النظام ملفات البصمة الخام المباشرة من جهاز ZKTeco مثل <strong>attlog.dat</strong> و <strong>attlog.txt</strong> أو ملفات الإكسل و CSV المستخرجة من برنامج البصمة.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-600 shadow-2xs">.dat (attlog.dat)</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-600 shadow-2xs">.xlsx / .xls</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-600 shadow-2xs">.csv</span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-600 shadow-2xs">.txt</span>
                </div>
              </div>

              {/* Sample files helper */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Download size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">تريد تجربة الاستيراد فوراً؟</h4>
                    <p className="text-[11px] text-slate-500">
                      يمكنك تنزيل ملف تجريبي يحوي بيانات موظفيك الحقيقيين المسجلين في النظام لتجربة المعالجة بنقرة واحدة:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadSample('dat')}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    نموذج .DAT (ZKTeco)
                  </button>
                  <button
                    onClick={() => handleDownloadSample('xlsx')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    نموذج Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleDownloadSample('csv')}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-xs font-bold text-blue-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    نموذج CSV
                  </button>
                </div>
              </div>

              {/* Explanatory Guide Box */}
              <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <HelpCircle size={16} />
                  <span>كيف يتعرف النظام على الموظفين من ملف البصمة؟</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
                  <li><strong>مطابقة برقم البصمة (Enroll ID / PIN):</strong> يُطابق الرقم المسجل في حقل "رقم البصمة في الجهاز" بملف الموظف.</li>
                  <li><strong>مطابقة بالرقم الوظيفي:</strong> إذا كان رقم البصمة في الملف يطابق الرقم الوظيفي (مثل 1 أو 102 أو EMP-1).</li>
                  <li><strong>مطابقة بالاسم الكامل:</strong> إذا كان ملف الإكسل يحتوي على عمود لأسماء الموظفين، يطابق النظام الاسم بدقة وذكاء مع تصحيح الهمزات والتاء المربوطة.</li>
                  <li><strong>ربط يدوي سهل:</strong> إذا لم يتم التعرف على رقم معين، يتيح لك النظام ربطه فورياً بموظف وحفظ الرقم في ملفه بضغطة زر واحدة!</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: Paste Raw Text */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الصق أسطر البصمة مباشرة من ملف attlog.dat أو السجل النصي:
                </label>
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`1\t2026-10-16 08:24:12\t1\t0\t0\t0\n2\t2026-10-16 08:35:40\t1\t0\t0\t0\n1\t2026-10-16 16:32:05\t1\t1\t0\t0`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  الأسطر المدخلة: {rawText.split('\n').filter(Boolean).length}
                </span>

                <button
                  onClick={handleProcessRawText}
                  disabled={!rawText.trim() || isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles size={16} />
                  تحليل البيانات والانتقال للمعاينة
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Preview & Confirm */}
          {activeTab === 'preview' && (
            <div className="space-y-5">
              
              {/* Stats overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-blue-700">الحركات المستخرجة</div>
                  <div className="text-2xl font-bold text-blue-900 mt-0.5">{rawPunchesCount}</div>
                  <div className="text-[10px] text-blue-600 mt-0.5">{previewRows.length} سجل يومي</div>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-emerald-700">موظفون تمت مطابقتهم</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-0.5">{matchedCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">جاهزون للاستيراد</div>
                </div>

                <div className={clsx(
                  "rounded-xl p-3 border",
                  unmatchedCount > 0 ? "bg-amber-50/80 border-amber-300" : "bg-slate-50 border-slate-200"
                )}>
                  <div className={clsx("text-[11px] font-semibold", unmatchedCount > 0 ? "text-amber-800" : "text-slate-600")}>
                    غير مطابقين
                  </div>
                  <div className={clsx("text-2xl font-bold mt-0.5", unmatchedCount > 0 ? "text-amber-900" : "text-slate-700")}>
                    {unmatchedCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">يمكن ربطهم يدوياً بالأسفل</div>
                </div>

                <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-purple-700">سجلات مسبقة (تحديث ودمج)</div>
                  <div className="text-2xl font-bold text-purple-900 mt-0.5">{existingMergeCount}</div>
                  <div className="text-[10px] text-purple-600 mt-0.5">{previewRows.length - existingMergeCount} سجل جديد</div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                      previewFilter === 'all' ? "bg-white text-slate-800 shadow-2xs border border-slate-200" : "text-slate-600 hover:bg-white/50"
                    )}
                  >
                    الكل ({previewRows.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('unmatched')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                      previewFilter === 'unmatched' ? "bg-amber-500 text-white shadow-2xs" : "text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    <UserX size={13} />
                    غير المطابقين ({unmatchedCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('late')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                      previewFilter === 'late' ? "bg-rose-600 text-white shadow-2xs" : "text-rose-700 hover:bg-rose-50"
                    )}
                  >
                    <Clock size={13} />
                    المتأخرون ({lateCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('merge')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1",
                      previewFilter === 'merge' ? "bg-indigo-600 text-white shadow-2xs" : "text-indigo-700 hover:bg-indigo-50"
                    )}
                  >
                    <RefreshCw size={13} />
                    تحديث ودمج ({existingMergeCount})
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="بحث بالاسم أو رقم البصمة أو التاريخ..."
                    className="w-full sm:w-64 pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Filter size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4">رقم البصمة (PIN)</th>
                        <th className="py-3 px-4">الموظف المطابق</th>
                        <th className="py-3 px-4">التاريخ</th>
                        <th className="py-3 px-4">الحضور (دخول)</th>
                        <th className="py-3 px-4">الانصراف (خروج)</th>
                        <th className="py-3 px-4">ساعات العمل</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewRows.length > 0 ? (
                        filteredPreviewRows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* PIN */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {row.pin}
                              </span>
                            </td>

                            {/* Employee Match */}
                            <td className="py-3 px-4">
                              {row.matchedEmployeeName ? (
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <UserCheck size={14} className="text-emerald-600 shrink-0" />
                                    <span>{row.matchedEmployeeName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>مطابقة: {
                                      row.matchMethod === 'fingerprintId' ? 'رقم البصمة' :
                                      row.matchMethod === 'employeeId' ? 'الرقم الوظيفي' :
                                      row.matchMethod === 'fullName' ? 'بالاسم' : 'يدوي'
                                    }</span>
                                    {row.matchedEmployeeId && (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveFingerprintToEmployee(row.pin, row.matchedEmployeeId!)}
                                        className="text-blue-600 hover:underline hover:text-blue-800 text-[10px]"
                                        title="تثبيت رقم البصمة للموظف"
                                      >
                                        تثبيت كمعرف بصمة
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                                    <UserX size={14} className="shrink-0" />
                                    <span>غير مطابق ({row.originalNameInFile || 'مجهول'})</span>
                                  </div>
                                  <select
                                    onChange={(e) => handleManualMapEmployee(row.id, e.target.value)}
                                    defaultValue=""
                                    className="bg-amber-50 border border-amber-300 rounded px-2 py-1 text-[11px] text-slate-800 outline-none w-full max-w-[200px]"
                                  >
                                    <option value="" disabled>اختر الموظف لربطه...</option>
                                    {employees.map(e => (
                                      <option key={e.id} value={e.id}>
                                        {e.fullName} ({e.employeeId})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {row.date}
                            </td>

                            {/* Check In */}
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {row.checkInTime || '—'}
                            </td>

                            {/* Check Out */}
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {row.checkOutTime || (
                                <span className="text-amber-600 font-sans text-[11px]">بصمة واحدة</span>
                              )}
                            </td>

                            {/* Work Hours */}
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {row.totalHours > 0 ? `${row.totalHours} س` : '—'}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {row.status === 'Late' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  <Clock size={11} />
                                  متأخر ({row.delayMinutes} د)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <Check size={11} />
                                  حاضر في الموعد
                                </span>
                              )}
                            </td>

                            {/* Action Type */}
                            <td className="py-3 px-4 text-center">
                              {row.isExisting ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  تحديث ودمج
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                  سجل جديد
                                </span>
                              )}
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            لا توجد سجلات تطابق الفلتر الحالي
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'preview' ? (
              <span>
                سيتم استيراد ومعالجة <strong>{previewRows.length}</strong> سجل حضور. سيتم دمج السجلات السابقة وتحديث الأوقات تلقائياً.
              </span>
            ) : (
              <span>اختر ملف جهاز البصمة أو الصق البيانات للمتابعة.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {activeTab === 'preview' && (
              <button
                onClick={handleConfirmImport}
                disabled={isLoading || previewRows.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>جاري الاستيراد والمعالجة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تأكيد واستيراد {previewRows.length} سجل إلى النظام</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
