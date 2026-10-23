import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  X, 
  CheckSquare, 
  Square, 
  Eye, 
  Building2, 
  User, 
  Briefcase, 
  CreditCard, 
  GraduationCap, 
  Award, 
  Laptop, 
  FileText, 
  Check, 
  Download,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Stamp,
  ArrowRight,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import { Employee } from '../types';
import FileImage from './FileImage';
import { toast } from './Toast';

interface EmployeePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  companyName?: string;
}

export default function EmployeePrintModal({
  isOpen,
  onClose,
  employee,
  companyName = 'مركز البنيان للتقنية و الصناعات الهندسية'
}: EmployeePrintModalProps) {
  // Checkbox selections for which sections to include in print
  const [sections, setSections] = useState({
    personal: true,
    work: true,
    bank: true,
    education: true,
    experience: true,
    skills: true,
    equipment: true,
    contracts: false,
    photo: true,
    signatures: true,
  });

  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press, Print on Ctrl+P
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  // Reliable section toggling (pure button click without label double-firing)
  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = (val: boolean) => {
    setSections({
      personal: val,
      work: val,
      bank: val,
      education: val,
      experience: val,
      skills: val,
      equipment: val,
      contracts: val,
      photo: val,
      signatures: val,
    });
  };

  const selectBasicOnly = () => {
    setSections({
      personal: true,
      work: true,
      bank: false,
      education: false,
      experience: false,
      skills: false,
      equipment: false,
      contracts: false,
      photo: true,
      signatures: true,
    });
  };

  // Bulletproof printing: uses Electron Native Printing if on desktop, or iframe on web
  const handlePrint = () => {
    const content = printAreaRef.current;
    if (!content) return;

    setIsPrinting(true);

    const fullHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>ملف الموظف - ${employee.fullName || 'موظف'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              visibility: visible !important;
              font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; 
              background: #fff; 
              color: #0f172a; 
              padding: 10mm 12mm;
              line-height: 1.5;
              font-size: 12px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header-table { width: 100%; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header-title { font-size: 19px; font-weight: 800; color: #1e3a8a; }
            .header-sub { font-size: 12px; color: #475569; font-weight: 600; }
            .doc-tag { font-size: 11px; color: #64748b; font-family: monospace; }
            .profile-box { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; padding: 12px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; }
            .section-box { margin-bottom: 14px; page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
            .section-head { background: #f1f5f9; padding: 6px 12px; font-weight: 700; font-size: 12px; color: #1e293b; border-bottom: 1px solid #cbd5e1; }
            .data-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 12px; padding: 10px 12px; }
            .data-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 12px; padding: 10px 12px; }
            .data-item { font-size: 11.5px; }
            .data-label { color: #64748b; font-weight: 600; margin-bottom: 2px; }
            .data-value { color: #0f172a; font-weight: 700; }
            table.clean-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
            table.clean-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; color: #334155; font-weight: 700; }
            table.clean-table td { border: 1px solid #e2e8f0; padding: 6px 8px; color: #0f172a; }
            .photo-box { width: 95px; height: 110px; border: 1.5px solid #94a3b8; border-radius: 6px; overflow: hidden; object-fit: cover; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
            .signatures-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 25px; page-break-inside: avoid; text-align: center; }
            .sig-line { border-top: 1px dashed #94a3b8; margin-top: 36px; padding-top: 6px; font-weight: 700; font-size: 11.5px; color: #334155; }
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              body { 
                padding: 4mm 6mm;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `;

    // 1. Try Electron Native IPC Print first
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.invoke('print-html-document', {
          html: fullHtml,
          title: `ملف الموظف - ${employee.fullName || 'موظف'}`
        }).then((res: any) => {
          setIsPrinting(false);
          if (res?.success) {
            toast('تم إرسال المستند إلى الطابعة بنجاح');
          }
        }).catch(() => {
          runIframePrint(fullHtml);
        });
        return;
      } catch (e) {
        // continue to iframe fallback
      }
    }

    // 2. Web Iframe Fallback
    runIframePrint(fullHtml);
  };

  const runIframePrint = (html: string) => {
    try {
      const oldIframe = document.getElementById('hr-print-hidden-iframe');
      if (oldIframe) {
        try { document.body.removeChild(oldIframe); } catch (e) {}
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'hr-print-hidden-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '-9999px';
      iframe.style.bottom = '-9999px';
      iframe.style.width = '1024px';
      iframe.style.height = '1024px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        setIsPrinting(false);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setIsPrinting(false);
        toast('تم إرسال المستند إلى نافذة الطباعة بنجاح');
      }, 400);
    } catch (err) {
      window.print();
      setIsPrinting(false);
    }
  };

  const handleScrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const selectedCount = Object.values(sections).filter(Boolean).length;
  const totalCount = Object.keys(sections).length;

  const sectionItems = [
    { id: 'personal', label: 'البيانات الشخصية والأساسية', icon: User, desc: 'تاريخ الميلاد، الجنسية، الهاتف، العنوان' },
    { id: 'work', label: 'معلومات الوظيفة والعمل', icon: Briefcase, desc: 'المسمى، الإدارة، تاريخ التعيين، الراتب' },
    { id: 'bank', label: 'بيانات المصرف والحساب البنكي', icon: CreditCard, desc: 'اسم المصرف، رقم الحساب، IBAN' },
    { id: 'education', label: 'المؤهلات العلمية والشهادات', icon: GraduationCap, desc: 'الدرجة، التخصص، الكلية، سنة التخرج' },
    { id: 'experience', label: 'الخبرات المهنية السابقة', icon: Award, desc: 'الشركات، المناصب السابقة، الفترات' },
    { id: 'skills', label: 'المهارات والكفاءات', icon: ShieldCheck, desc: 'قائمة المهارات ومستوى الإتقان' },
    { id: 'equipment', label: 'العهد والأجهزة المسلمة', icon: Laptop, desc: 'الأجهزة المسلمة، الأرقام التسلسلية' },
    { id: 'contracts', label: 'العقود والمكافآت', icon: FileText, desc: 'تفاصيل عقد العمل والبنود الرسمية' },
    { id: 'photo', label: 'الصورة الشخصية للموظف', icon: User, desc: 'إظهار صورة الموظف بالترويسة' },
    { id: 'signatures', label: 'خانة التوقيعات والختم الرسمي', icon: Stamp, desc: 'توقيع الموظف، شؤون الموظفين، ختم المدير' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 font-sans" 
      dir="rtl"
      onClick={(e) => {
        // Close if clicking outside the modal dialog
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200 border border-slate-200 ${
          isFullscreenPreview ? 'max-w-[98vw] h-[96vh]' : 'max-w-6xl h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          
          {/* Title & Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="الرجوع والعودة لملف الموظف (Esc)"
            >
              <ArrowRight size={16} />
              <span>رجوع</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Printer size={19} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <span>معاينة وطباعة ملف الموظف</span>
                  <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                    {employee.employeeId || 'EMP'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  الموظف: <strong className="text-white">{employee.fullName}</strong> | تم تحديد ({selectedCount} من {totalCount}) أقسام
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <button
              type="button"
              onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title={isFullscreenPreview ? 'عرض قائمة تخصيص الأقسام' : 'معاينة ملء الشاشة للورقة'}
            >
              {isFullscreenPreview ? (
                <>
                  <SlidersHorizontal size={14} />
                  <span>تخصيص الحقول</span>
                </>
              ) : (
                <>
                  <Maximize2 size={14} />
                  <span>معاينة كاملة</span>
                </>
              )}
            </button>

            {/* Print Primary Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <Printer size={16} className={isPrinting ? 'animate-bounce' : ''} />
              <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المستند الآن (A4)'}</span>
            </button>

            {/* Exit / Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
              title="إغلاق المعاينة والرجوع"
            >
              <X size={16} />
              <span className="hidden sm:inline">إغلاق المعاينة</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls Sidebar + Right Printable Sheet Canvas */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Controls Sidebar (Collapsible in fullscreen mode) */}
          {!isFullscreenPreview && (
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-4 overflow-y-auto shrink-0 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                
                {/* Header & Quick Action Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-blue-600" />
                      تحديد البيانات المراد طباعتها:
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      {selectedCount} / {totalCount}
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                    <button 
                      type="button"
                      onClick={() => selectAll(true)} 
                      className="px-2 py-1.5 bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-colors text-center cursor-pointer shadow-2xs"
                    >
                      تحديد الكل
                    </button>
                    <button 
                      type="button"
                      onClick={() => selectAll(false)} 
                      className="px-2 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-center cursor-pointer shadow-2xs"
                    >
                      إلغاء الكل
                    </button>
                    <button 
                      type="button"
                      onClick={selectBasicOnly} 
                      className="px-2 py-1.5 bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-center cursor-pointer shadow-2xs"
                    >
                      الأساسية فقط
                    </button>
                  </div>
                </div>

                {/* Checklist of All Available Sections */}
                <div className="space-y-1.5">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isChecked = sections[item.id as keyof typeof sections];
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleSection(item.id as keyof typeof sections)}
                        className={`w-full text-right flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                          isChecked 
                            ? 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Checkbox Icon Indicator */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-transparent'
                          }`}>
                            <Check size={13} strokeWidth={3} />
                          </div>

                          <Icon size={16} className={isChecked ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                          
                          <div>
                            <span className="block font-bold">{item.label}</span>
                            <span className="block text-[10px] text-slate-400 font-normal leading-tight mt-0.5">{item.desc}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isChecked ? 'bg-blue-200/60 text-blue-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isChecked ? 'مُضمّن' : 'مستبعد'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Instructions Card */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1.5 mt-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Check size={15} className="text-blue-600" />
                  مستند رسمي معتمد للطباعة (A4)
                </p>
                <p className="text-blue-700/90 leading-relaxed text-[10.5px]">
                  التنسيق مجهز بالترويسة المعتمدة، وختم الإدارة، وتوقيع الموظف ليتم حفظه مباشرة كملف PDF أو إرساله للطابعة دون أي عناصر واجهة مشتتة.
                </p>
              </div>

            </div>
          )}

          {/* Printable Preview Sheet Container */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 bg-slate-200/80 p-3 sm:p-6 md:p-8 overflow-y-auto flex flex-col items-center relative"
          >
            {/* The Actual A4 Sheet */}
            <div 
              ref={printAreaRef}
              className="bg-white text-slate-800 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 md:p-12 rounded-xl shadow-xl border border-slate-300 text-[12.5px] leading-relaxed flex flex-col justify-between mb-16 transition-all"
            >
              <div>
                {/* Official Letterhead */}
                <div className="header-table border-b-2 border-blue-900 pb-4 mb-6 flex items-start justify-between">
                  <div className="space-y-1">
                    <h1 className="header-title text-xl font-extrabold text-blue-900">{companyName}</h1>
                    <p className="header-sub text-xs text-slate-500 font-semibold">إدارة الموارد البشرية والشؤون الإدارية</p>
                    <p className="text-xs text-slate-700 font-bold mt-1">بطاقة الملف التعريفي والبيانات الوظيفية للموظف</p>
                  </div>

                  <div className="text-left space-y-1" dir="ltr">
                    <span className="doc-tag text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-600">
                      REF: EMP-{employee.employeeId || employee.id?.substring(0, 6)}
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Date: {new Date().toLocaleDateString('ar-LY')}
                    </p>
                  </div>
                </div>

                {/* Top Profile Summary with Photo */}
                <div className="profile-box flex items-start justify-between gap-6 mb-5 p-4 bg-slate-50/90 border border-slate-200 rounded-xl">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{employee.fullName || 'غير محدد'}</h2>
                      <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                        {employee.jobTitle || 'موظف'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <div><span className="text-slate-400">الرقم الوظيفي:</span> <strong className="text-slate-800 font-mono">{employee.employeeId || '-'}</strong></div>
                      <div><span className="text-slate-400">القسم / الإدارة:</span> <strong className="text-slate-800">{employee.department || '-'}</strong></div>
                      <div><span className="text-slate-400">الرقم الوطني:</span> <strong className="text-slate-800 font-mono">{employee.nationalId || '-'}</strong></div>
                      <div><span className="text-slate-400">الحالة الوظيفية:</span> <strong className="text-emerald-700">{employee.status || 'نشط'}</strong></div>
                    </div>
                  </div>

                  {sections.photo && (
                    <div className="photo-box w-24 h-28 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                      {employee.photoUrl ? (
                        <FileImage src={employee.photoUrl} alt={employee.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User size={38} className="text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION 1: Personal Details */}
                {sections.personal && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200 flex items-center justify-between">
                      <span>1. البيانات الشخصية والأساسية</span>
                    </div>
                    <div className="data-grid-3 grid grid-cols-3 gap-3 p-3 text-xs">
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">تاريخ الميلاد:</div><div className="data-value font-bold font-mono">{employee.dob || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">الجنسية:</div><div className="data-value font-bold">{employee.nationality || 'ليبي'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">الحالة الاجتماعية:</div><div className="data-value font-bold">{employee.maritalStatus || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">رقم الهاتف:</div><div className="data-value font-bold font-mono" dir="ltr">{employee.personalPhone || employee.workMobile || employee.workPhone || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">البريد الإلكتروني:</div><div className="data-value font-bold font-mono text-[11px]">{employee.personalEmail || employee.workEmail || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">مكان الميلاد:</div><div className="data-value font-bold font-mono text-slate-700">{employee.placeOfBirth || '-'}</div></div>
                      <div className="data-item col-span-2"><div className="data-label text-slate-500 font-medium">عنوان السكن:</div><div className="data-value font-bold">{employee.homeAddress || employee.workAddress || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">جهة الاتصال للطوارئ:</div><div className="data-value font-bold">{employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone || ''})` : '-'}</div></div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: Work & Job Information */}
                {sections.work && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200 flex items-center justify-between">
                      <span>2. معلومات العمل والوظيفة</span>
                    </div>
                    <div className="data-grid-3 grid grid-cols-3 gap-3 p-3 text-xs">
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">المسمى الوظيفي:</div><div className="data-value font-bold">{employee.jobTitle || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">الإدارة / القسم:</div><div className="data-value font-bold">{employee.department || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">تصنيف الموظف:</div><div className="data-value font-bold">{employee.employmentCategory || 'موظف أساسي'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">تاريخ التعيين / المباشرة:</div><div className="data-value font-bold font-mono">{employee.contracts?.[0]?.startDate || employee.createdAt?.split('T')[0] || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">نوع العقد:</div><div className="data-value font-bold">{employee.contracts?.[0]?.type || 'عقد عمل محدد'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">مكان العمل / الفرع:</div><div className="data-value font-bold">{employee.workLocation || 'الفرع الرئيسي'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">الراتب الأساسي:</div><div className="data-value font-bold font-mono text-blue-700">{employee.contracts?.[0]?.basicSalary ? `${Number(employee.contracts[0].basicSalary).toLocaleString()} د.ل` : '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">طبيعة العمل:</div><div className="data-value font-bold font-mono">{employee.remoteWorkType || 'مكتب'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">المسؤول المباشر:</div><div className="data-value font-bold">{employee.directManager || '-'}</div></div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: Bank Account */}
                {sections.bank && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200 flex items-center justify-between">
                      <span>3. بيانات المصرف والحساب البنكي</span>
                    </div>
                    <div className="data-grid-2 grid grid-cols-2 gap-3 p-3 text-xs">
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">اسم المصرف:</div><div className="data-value font-bold">{employee.bankName || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">الفرع:</div><div className="data-value font-bold">{employee.bankBranch || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">رقم الحساب المصرفي:</div><div className="data-value font-bold font-mono text-sm tracking-wider" dir="ltr">{employee.bankAccountNumber || '-'}</div></div>
                      <div className="data-item"><div className="data-label text-slate-500 font-medium">رمز الآيبان الدولي (IBAN):</div><div className="data-value font-bold font-mono text-xs tracking-wider" dir="ltr">{employee.bankIban || '-'}</div></div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: Education */}
                {sections.education && employee.educations && employee.educations.length > 0 && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                      <span>4. المؤهلات العلمية والشهادات</span>
                    </div>
                    <table className="clean-table w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-2 border border-slate-200 text-right">الشهادة / الدرجة</th>
                          <th className="p-2 border border-slate-200 text-right">الجامعة / المؤسسة</th>
                          <th className="p-2 border border-slate-200 text-right">التخصص</th>
                          <th className="p-2 border border-slate-200 text-right">سنة التخرج</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.educations.map((edu, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border border-slate-200 font-bold">{edu.degree}</td>
                            <td className="p-2 border border-slate-200">{edu.institution}</td>
                            <td className="p-2 border border-slate-200">{edu.major}</td>
                            <td className="p-2 border border-slate-200 font-mono">{edu.gradDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SECTION 5: Previous Experience */}
                {sections.experience && employee.experiences && employee.experiences.length > 0 && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                      <span>5. الخبرات المهنية السابقة</span>
                    </div>
                    <table className="clean-table w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-2 border border-slate-200 text-right">الشركة / الجهة</th>
                          <th className="p-2 border border-slate-200 text-right">المسمى الوظيفي</th>
                          <th className="p-2 border border-slate-200 text-right">من</th>
                          <th className="p-2 border border-slate-200 text-right">إلى</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.experiences.map((exp, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border border-slate-200 font-bold">{exp.company}</td>
                            <td className="p-2 border border-slate-200">{exp.position}</td>
                            <td className="p-2 border border-slate-200 font-mono">{exp.startDate}</td>
                            <td className="p-2 border border-slate-200 font-mono">{exp.endDate || 'حتى الآن'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SECTION 6: Custody & Equipment */}
                {sections.equipment && employee.equipments && employee.equipments.length > 0 && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                      <span>6. العهد والأجهزة المسلمة للموظف</span>
                    </div>
                    <table className="clean-table w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="p-2 border border-slate-200 text-right">اسم الجهاز / العهدة</th>
                          <th className="p-2 border border-slate-200 text-right">الرقم التسلسلي (Serial No)</th>
                          <th className="p-2 border border-slate-200 text-right">تاريخ الاستلام</th>
                          <th className="p-2 border border-slate-200 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.equipments.map((eq, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border border-slate-200 font-bold">{eq.name}</td>
                            <td className="p-2 border border-slate-200 font-mono" dir="ltr">{eq.serialNo || '-'}</td>
                            <td className="p-2 border border-slate-200 font-mono">{eq.deliveryDate || '-'}</td>
                            <td className="p-2 border border-slate-200">{eq.status || 'جيد'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SECTION 7: Skills */}
                {sections.skills && employee.skills && employee.skills.length > 0 && (
                  <div className="section-box border border-slate-200 rounded-lg mb-4 overflow-hidden">
                    <div className="section-head bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-200">
                      <span>7. المهارات والكفاءات</span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {employee.skills.map((s, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs font-semibold text-slate-800">
                          {s.name} ({s.level || 'جيد'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures & Approvals Box */}
              {sections.signatures && (
                <div className="signatures-box grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-200 mt-6 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-700">توقيع الموظف</p>
                    <div className="sig-line border-t border-dashed border-slate-400 mt-10 pt-1">
                      {employee.fullName}
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-700">مسؤول شؤون الموظفين</p>
                    <div className="sig-line border-t border-dashed border-slate-400 mt-10 pt-1">
                      الاعتماد والتوقيع
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-700">ختم وتوقيع المدير العام</p>
                    <div className="sig-line border-t border-dashed border-slate-400 mt-10 pt-1">
                      الختم الرسمي للمركز
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Sticky Action Bar for quick printing while scrolling preview */}
            <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/25"
              >
                <Printer size={15} />
                <span>طباعة المستند (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleScrollToTop}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="الرجوع للأعلى"
              >
                <ChevronUp size={16} />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                <span>إغلاق وخروج</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
