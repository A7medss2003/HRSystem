import React, { useState, useEffect, useCallback } from 'react';
import { Printer, RefreshCw, AlertCircle, ChevronDown, CheckCircle2, X, Edit3 } from 'lucide-react';
import { ScannerService } from '../services/scannerService';
import { toast } from './Toast';

export interface ScannerSelectorProps {
  selectedScanner: string;
  onSelectScanner: (scannerName: string) => void;
  className?: string;
  disabled?: boolean;
  onScannersCountChange?: (count: number) => void;
}

/**
 * مكون ScannerSelector:
 * يجلب قائمة الماسحات الضوئية المتصلة فعلياً بالجهاز باستخدام ScannerService.getAvailableScanners()
 * ويعرضها في قائمة اختيار (Dropdown) بسيطة، مع تحديث القائمة تلقائياً عند طلب المستخدم.
 * إشعارات وتنبيهات منضبطة وقابلة للإغلاق دون إزعاج.
 */
export default function ScannerSelector({
  selectedScanner,
  onSelectScanner,
  className = '',
  disabled = false,
  onScannersCountChange
}: ScannerSelectorProps) {
  const [scanners, setScanners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [noScannersFound, setNoScannersFound] = useState<boolean>(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [manualScannerName, setManualScannerName] = useState<string>('');

  /**
   * جلب قائمة الماسحات الضوئية المتصلة فعلياً بالنظام
   */
  const loadAvailableScanners = useCallback(async (isUserTriggered: boolean = false) => {
    setIsLoading(true);
    setIsAlertDismissed(false); // إعادة إظهار التنبيه إذا كان الفحص يدوياً بطلب المستخدم

    if (isUserTriggered) {
      toast('جاري البحث عن الماسحات الضوئية المتصلة بالجهاز...', 'info');
    }

    try {
      const list = await ScannerService.getAvailableScanners();
      const actualScanners = Array.isArray(list) ? list.filter(Boolean) : [];
      
      setScanners(actualScanners);
      setHasSearched(true);
      if (onScannersCountChange) {
        onScannersCountChange(actualScanners.length);
      }

      if (actualScanners.length > 0) {
        setNoScannersFound(false);
        // اختيار أول ماسح متاح إذا لم يكن هناك تحديد مسبق
        if (!selectedScanner || !actualScanners.includes(selectedScanner)) {
          onSelectScanner(actualScanners[0]);
        }
        if (isUserTriggered) {
          toast(`تم التعرف على الماسح المتصل: [${actualScanners[0]}] بنجاح ✅`, 'success');
        }
      } else {
        setNoScannersFound(true);
        // لا نظهر toast إلا إذا كان الفحص بطلب صريح من المستخدم حتى لا نزعجه عند الفتح
        if (isUserTriggered) {
          toast('إخطار: لم يتم العثور على أي ماسح ضوئي متصل بالجهاز', 'warning');
        }
      }
    } catch (err: any) {
      setNoScannersFound(true);
      if (isUserTriggered) {
        toast('تعذر فحص أجهزة الماسح الضوئي', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedScanner, onSelectScanner, onScannersCountChange]);

  // الجلب التلقائي الأولي عند تحميل المكون بهدوء
  useEffect(() => {
    loadAvailableScanners(false);
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsManualInput(true);
    } else {
      setIsManualInput(false);
      onSelectScanner(val);
    }
  };

  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualScannerName(val);
    onSelectScanner(val.trim() || 'ماسح ضوئي مخصص');
  };

  return (
    <div className={`space-y-2.5 ${className}`} dir="rtl">
      {/* شريط العنوان وزر التحديث */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Printer size={15} className="text-blue-600" />
          <span>الماسح الضوئي:</span>
          {scanners.length > 0 && !noScannersFound && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>متصل وجاهز</span>
            </span>
          )}
        </label>

        {/* زر تحديث القائمة بناءً على طلب المستخدم */}
        <button
          type="button"
          onClick={() => loadAvailableScanners(true)}
          disabled={isLoading || disabled}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          title="تحديث والبحث عن الأجهزة المتصلة الآن"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-blue-600' : 'text-blue-600'} />
          <span>{isLoading ? 'جاري الفحص...' : 'تحديث القائمة'}</span>
        </button>
      </div>

      {/* قائمة الاختيار (Dropdown) البسيطة */}
      <div className="relative">
        <select
          value={isManualInput ? '__custom__' : selectedScanner}
          onChange={handleSelectChange}
          disabled={disabled || isLoading}
          className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs font-bold transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
            noScannersFound 
              ? 'border-amber-300 text-amber-900 bg-amber-50/30 focus:ring-amber-400' 
              : 'border-slate-300 text-slate-800 focus:ring-blue-500 hover:border-slate-400'
          }`}
        >
          {scanners.length > 0 ? (
            scanners.map((name, idx) => (
              <option key={`${name}-${idx}`} value={name}>
                {name}
              </option>
            ))
          ) : (
            <option value="">
              {isLoading ? 'جاري فحص الأجهزة المتصلة...' : '-- لا يوجد ماسح ضوئي متصل حالياً --'}
            </option>
          )}
          <option value="__custom__">➕ إدخال طراز الماسح يدوياً...</option>
        </select>
        <ChevronDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* حقل إدخال الطراز يدوياً عند اختياره */}
      {isManualInput && (
        <div className="pt-0.5 animate-in fade-in duration-150">
          <input
            type="text"
            value={manualScannerName}
            onChange={handleManualNameChange}
            placeholder="اكتب طراز الماسح الضوئي (مثال: HP ScanJet 2400)..."
            className="w-full px-3.5 py-2 bg-white border border-blue-400 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}

      {/* إخطار وتنبيه قابل للإغلاق في حال عدم العثور على أي ماسح متصل */}
      {hasSearched && noScannersFound && scanners.length === 0 && !isAlertDismissed && (
        <div className="bg-amber-50/95 border border-amber-300/80 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 relative shadow-2xs">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1 pl-6">
            <p className="font-bold flex items-center justify-between">
              <span>إخطار: لم يتم العثور على أي ماسح ضوئي متصل بالجهاز</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              يرجى التأكد من توصيل كابل USB وتشغيل الماسح، ثم الضغط على زر <strong className="font-bold underline cursor-pointer" onClick={() => loadAvailableScanners(true)}>"تحديث القائمة"</strong> أو إدخال الطراز يدوياً.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => loadAvailableScanners(true)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                <span>إعادة الفحص الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManualInput(true)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit3 size={11} />
                <span>إدخال يدوي</span>
              </button>
            </div>
          </div>
          {/* زر إغلاق التنبيه */}
          <button
            type="button"
            onClick={() => setIsAlertDismissed(true)}
            className="absolute left-2.5 top-2.5 p-1 text-amber-600 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            title="إخفاء الإخطار"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
