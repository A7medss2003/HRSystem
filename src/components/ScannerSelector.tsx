import React, { useState, useEffect, useCallback } from 'react';
import { Printer, RefreshCw, AlertCircle, ChevronDown, CheckCircle2, X, Edit3, Monitor, Save } from 'lucide-react';
import { ScannerService } from '../services/scannerService';
import { toast } from './Toast';

export interface ScannerSelectorProps {
  selectedScanner: string;
  onSelectScanner: (scannerName: string) => void;
  className?: string;
  disabled?: boolean;
  onScannersCountChange?: (count: number) => void;
  darkMode?: boolean;
}

const UNIVERSAL_STANDARD_DRIVERS = [
  'الماسح الضوئي الافتراضي لنظام التشغيل (WIA / TWAIN Default)',
  'ماسح ضوئي متصل عبر منفذ USB (Plug & Play)',
  'سكانر الطابعة متعددة الوظائف المتصلة'
];

/**
 * مكون ScannerSelector العالمي:
 * يتعرف تلقائياً على الماسحات والطابعات بمختلف البروتوكولات (NAPS2 / WIA / TWAIN / SANE / Registry / PnP)
 * مع إمكانية استدعاء نافذة ويندوز الرسمية (Windows Native WIA Dialog) لاختيار أي جهاز معرف في النظام مباشرة،
 * وتثبيت وحفظ طراز الماسح الضوئي المفضل للمستخدم.
 */
export default function ScannerSelector({
  selectedScanner,
  onSelectScanner,
  className = '',
  disabled = false,
  onScannersCountChange,
  darkMode = true
}: ScannerSelectorProps) {
  const [scanners, setScanners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpeningDialog, setIsOpeningDialog] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [manualScannerName, setManualScannerName] = useState<string>('');

  /**
   * جلب قائمة الماسحات الضوئية المتصلة فعلياً بالنظام
   */
  const loadAvailableScanners = useCallback(async (isUserTriggered: boolean = false) => {
    setIsLoading(true);

    if (isUserTriggered) {
      toast('جاري فحص جميع أجهزة الماسح الضوئي ومنافذ النظام...', 'info');
    }

    try {
      const list = await ScannerService.getAvailableScanners();
      const actualScanners = Array.isArray(list) ? list.filter(Boolean) : [];
      
      // دمج الأجهزة المكتشفة مع التعريفات العامة المعتمدة
      const mergedList = Array.from(new Set([...actualScanners, ...UNIVERSAL_STANDARD_DRIVERS]));
      
      setScanners(mergedList);
      setHasSearched(true);
      if (onScannersCountChange) {
        onScannersCountChange(mergedList.length);
      }

      // إذا لم يكن هناك تحديد، نحدد أول جهاز فعلي أو الجهاز المحفوظ
      const savedPref = localStorage.getItem('preferred_hardware_scanner');
      if (savedPref && mergedList.includes(savedPref)) {
        onSelectScanner(savedPref);
      } else if (!selectedScanner || !mergedList.includes(selectedScanner)) {
        onSelectScanner(mergedList[0]);
      }

      if (isUserTriggered) {
        toast(`تم تحديث قائمة الأجهزة بنجاح (${mergedList.length} جهاز/مشغل متاح) ✅`, 'success');
      }
    } catch (err: any) {
      // في حال الخطأ نضمن بقاء المشغلات العامة متاحة دائماً
      setScanners(UNIVERSAL_STANDARD_DRIVERS);
      if (!selectedScanner) {
        onSelectScanner(UNIVERSAL_STANDARD_DRIVERS[0]);
      }
      if (isUserTriggered) {
        toast('تم تفعيل المشغلات الافتراضية العامة للاتصال بالماسح', 'info');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedScanner, onSelectScanner, onScannersCountChange]);

  // الجلب التلقائي الأولي عند تحميل المكون
  useEffect(() => {
    loadAvailableScanners(false);
  }, []);

  /**
   * استدعاء نافذة ويندوز الرسمية لاختيار السكانر (WIA CommonDialog)
   */
  const handleOpenWindowsPicker = async () => {
    setIsOpeningDialog(true);
    toast('جاري فتح نافذة أجهزة ويندوز الرسمية...', 'info');

    try {
      const pickedName = await ScannerService.selectScannerViaWindowsDialog();
      if (pickedName) {
        // إضافة الجهاز للقائمة فوراً واختياره
        setScanners(prev => Array.from(new Set([pickedName, ...prev])));
        onSelectScanner(pickedName);
        try { localStorage.setItem('preferred_hardware_scanner', pickedName); } catch (e) {}
        toast(`تم اختيار الجهاز بنجاح من ويندوز: [${pickedName}] ✅`, 'success');
      } else {
        // إذا لم يكن في بيئة ويندوز إلكترون أو ألغى التحديد
        toast('يمكنك اختيار مشغل ويندوز الافتراضي أو كتابة طراز جهازك وسيتصل به النظام فوراً', 'info');
      }
    } catch (e: any) {
      toast('تعذر فتح نافذة ويندوز، يرجى التأكد من توصيل كابل USB للسكانر وتشغيله', 'warning');
    } finally {
      setIsOpeningDialog(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsManualInput(true);
    } else {
      setIsManualInput(false);
      onSelectScanner(val);
      try { localStorage.setItem('preferred_hardware_scanner', val); } catch (e) {}
    }
  };

  const handleSaveManualDevice = () => {
    const trimmed = manualScannerName.trim();
    if (!trimmed) {
      toast('الرجاء كتابة اسم أو طراز الماسح أولاً', 'warning');
      return;
    }
    setScanners(prev => Array.from(new Set([trimmed, ...prev])));
    onSelectScanner(trimmed);
    try { localStorage.setItem('preferred_hardware_scanner', trimmed); } catch (e) {}
    setIsManualInput(false);
    toast(`تم تثبيت وحفظ الجهاز: [${trimmed}] كجهاز نشط للمنظومة ✅`, 'success');
  };

  // تصنيف الأجهزة
  const specificDevices = scanners.filter(s => !UNIVERSAL_STANDARD_DRIVERS.includes(s));
  const standardDrivers = scanners.filter(s => UNIVERSAL_STANDARD_DRIVERS.includes(s));

  return (
    <div className={`space-y-2.5 ${className}`} dir="rtl">
      {/* شريط العنوان وأزرار الفحص السريع والنافذة الرسمية */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className={`text-xs font-bold flex items-center gap-1.5 flex-wrap ${darkMode ? 'text-[#e0e0e6]' : 'text-slate-800'}`}>
          <Printer size={15} className="text-[#00adb5]" />
          <span>اختر جهاز السكانر النشط (أو الطابعة المتصلة):</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            darkMode 
              ? 'text-[#00adb5] bg-[#00adb5]/15 border-[#00adb5]/30' 
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00adb5] animate-pulse"></span>
            <span>{scanners.length} خيارات متاحة</span>
          </span>
        </label>

        <div className="flex items-center gap-1.5">
          {/* زر استدعاء نافذة ويندوز الرسمية لاختيار السكانر */}
          <button
            type="button"
            onClick={handleOpenWindowsPicker}
            disabled={isOpeningDialog || disabled}
            className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs ${
              darkMode 
                ? 'bg-[#141419] hover:bg-[#22222a] text-[#e0e0e6] border border-[#444450]' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
            }`}
            title="فتح نافذة نظام ويندوز الرسمية لاكتشاف واختيار جهاز السكانر المتصل بالحاسوب"
          >
            <Monitor size={13} className={isOpeningDialog ? 'animate-bounce text-[#00adb5]' : 'text-[#00adb5]'} />
            <span>{isOpeningDialog ? 'جاري الفتح...' : '🖥️ نافذة ويندوز (WIA)'}</span>
          </button>

          {/* زر تحديث القائمة الشامل */}
          <button
            type="button"
            onClick={() => loadAvailableScanners(true)}
            disabled={isLoading || disabled}
            className={`btn-refresh text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs ${
              darkMode 
                ? 'bg-[#141419] hover:bg-[#22222a] text-[#00adb5] border border-[#00adb5]/40' 
                : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200'
            }`}
            title="تحديث والبحث عن كافة الأجهزة المتصلة الآن"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#00adb5]' : 'text-[#00adb5]'} />
            <span>{isLoading ? 'جاري الفحص...' : '🔄 تحديث القائمة'}</span>
          </button>
        </div>
      </div>

      {/* قائمة الاختيار (Dropdown) للأجهزة المتصلة مع تصنيف قياسي */}
      <div className="relative">
        <select
          id="scannersDropdown"
          value={isManualInput ? '__custom__' : selectedScanner}
          onChange={handleSelectChange}
          disabled={disabled || isLoading}
          className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 shadow-2xs ${
            darkMode 
              ? 'bg-[#141419] border border-[#444450] hover:border-[#00adb5] focus:border-[#00adb5] text-[#e0e0e6] focus:ring-[#00adb5]' 
              : 'bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 text-slate-900 focus:ring-blue-500'
          }`}
        >
          {specificDevices.length > 0 && (
            <optgroup label="── أجهزة الماسح الضوئي المكتشفة بالجهاز ──">
              {specificDevices.map((name, idx) => (
                <option key={`spec-${name}-${idx}`} value={name} className={darkMode ? 'bg-[#141419] text-[#e0e0e6]' : ''}>
                  🖨️ {name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="── المشغلات العامة القياسية (WIA / TWAIN / USB) ──">
            {standardDrivers.map((name, idx) => (
              <option key={`std-${name}-${idx}`} value={name} className={darkMode ? 'bg-[#141419] text-[#e0e0e6]' : ''}>
                ⚡ {name}
              </option>
            ))}
          </optgroup>

          <optgroup label="── خيارات إضافية ──">
            <option value="__custom__" className={darkMode ? 'bg-[#141419] text-[#00adb5]' : ''}>➕ إدخال طراز الماسح وتثبيته يدوياً...</option>
          </optgroup>
        </select>
        <ChevronDown size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} />
      </div>

      {/* حقل إدخال الطراز يدوياً وتثبيته */}
      {isManualInput && (
        <div className={`p-3 rounded-xl space-y-2 animate-in fade-in duration-150 border ${
          darkMode ? 'bg-[#141419] border-[#00adb5]/40 text-[#e0e0e6]' : 'bg-blue-50/80 border-blue-200 text-blue-900'
        }`}>
          <label className="text-[11px] font-bold block">
            اكتب اسم أو طراز الماسح الضوئي المتصل بحاسوبك (مثال: HP ScanJet 200 أو Canon LiDE 300):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualScannerName}
              onChange={e => setManualScannerName(e.target.value)}
              placeholder="اكتب اسم السكانر كما هو مكتوب عليه أو في ويندوز..."
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 ${
                darkMode 
                  ? 'bg-[#1e1e24] border border-[#444450] text-[#e0e0e6] focus:border-[#00adb5] focus:ring-[#00adb5]' 
                  : 'bg-white border border-blue-300 text-slate-900 focus:ring-blue-500'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveManualDevice}
              className="px-3 py-2 bg-[#00adb5] hover:bg-[#00989f] text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Save size={13} />
              <span>تثبيت وحفظ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsManualInput(false)}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                darkMode ? 'bg-[#1e1e24] hover:bg-[#252530] text-slate-300 border-[#444450]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* تلميح إرشادي توضيحي ذكي */}
      <div className={`text-[11px] rounded-lg px-3 py-2 flex items-center justify-between gap-2 border ${
        darkMode ? 'bg-[#141419] border-[#2d2d35] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#00adb5] shrink-0" />
          <span>
            {selectedScanner.includes('الافتراضي') 
              ? 'تم اختيار مشغل ويندوز التلقائي: سيتم السحب فوراً من أي ماسح ضوئي أو طابعة متصلة بجهازك.'
              : `الجهاز النشط حالياً: [${selectedScanner}]`}
          </span>
        </span>
        <button
          type="button"
          onClick={handleOpenWindowsPicker}
          className="text-[#00adb5] hover:underline font-bold cursor-pointer shrink-0 text-[10px]"
        >
          فحص ويندوز WIA
        </button>
      </div>
    </div>
  );
}

