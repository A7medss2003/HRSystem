import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Check, 
  Sparkles, 
  FileCheck, 
  RotateCw, 
  Upload, 
  Loader2, 
  CheckCircle2,
  Scan,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  Usb,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
  ClipboardPaste,
  RefreshCw,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Settings,
  Cpu,
  Activity
} from 'lucide-react';
import { saveDataUrlToLocal } from '../lib/fileStorage';
import { Document } from '../types';
import { toast } from './Toast';
import { scanningService, ScannerDevice, ScannerSystemStatus } from '../services/scanningService';
import { scannerService } from '../services/scannerService';
import ScannerSelector from './ScannerSelector';

interface DirectScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: Document) => void;
  employeeName: string;
}

interface ScannerOption {
  id: string;
  name: string;
  type: 'usb' | 'system' | 'network';
  status: 'متصل' | 'جاهز' | 'افتراضي';
}

const COMMON_DOC_SUGGESTIONS = [
  'شهادة ميلاد',
  'بطاقة هوية',
  'جواز سفر',
  'عقد عمل',
  'شهادة تخرج',
  'رخصة قيادة',
  'تقرير طبي',
  'شهادة خبرة'
];

const INITIAL_DEVICE: ScannerDevice = {
  id: 'actual-system-scanner',
  name: 'الماسح الضوئي الفعلي المتصل بالجهاز',
  vendor: 'نظام التشغيل',
  model: 'WIA Scanner',
  protocol: 'WIA',
  driverName: 'WIA / TWAIN Native',
  port: 'USB Port',
  status: 'online',
  isDefault: true,
  supportedResolutions: [150, 300, 600],
  supportedModes: ['color', 'grayscale', 'bw']
};

export default function DirectScannerModal({
  isOpen,
  onClose,
  onSaveDocument,
  employeeName
}: DirectScannerModalProps) {
  // Scanner devices list - takes ONLY actual available devices detected from OS
  const [scannersList, setScannersList] = useState<ScannerDevice[]>([]);
  const [selectedScannerId, setSelectedScannerId] = useState<string>('');
  const [selectedScannerName, setSelectedScannerName] = useState<string>('');
  const [customModelInput, setCustomModelInput] = useState<string>('');
  const [isScanningDevices, setIsScanningDevices] = useState<boolean>(false);
  
  // Scanning parameters
  const [scanDpi, setScanDpi] = useState<number>(300);
  const [scanColorMode, setScanColorMode] = useState<'color' | 'grayscale' | 'bw'>('color');
  const [isHardwareScanning, setIsHardwareScanning] = useState<boolean>(false);
  const [hardwareScanStep, setHardwareScanStep] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<ScannerSystemStatus | null>(null);

  // WebUSB Detection State
  const [isUsbSupported, setIsUsbSupported] = useState<boolean>(false);
  const [isDetectingUsb, setIsDetectingUsb] = useState<boolean>(false);

  // Document State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>('شهادة ميلاد');
  const [scannedImageUrl, setScannedImageUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isBwFilter, setIsBwFilter] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Enlarged Preview / Lightbox Modal State
  const [showEnlargedPreview, setShowEnlargedPreview] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Camera acquisition state
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subscriptions to ScannerService (Observables & IPC from user's working system)
  useEffect(() => {
    if (!isOpen) return;

    // Listen to scan progress (0 - 100%)
    const subProgress = scannerService.getScanProgress().subscribe((progress) => {
      setScanProgress(progress);
      if (progress > 0 && progress < 35) {
        setHardwareScanStep('إرسال أمر التشغيل للماسح الضوئي (WIA / TWAIN)...');
      } else if (progress >= 35 && progress < 75) {
        setHardwareScanStep('تشغيل رأس الماسح الضوئي وسحب الورقة وقراءة البيانات...');
      } else if (progress >= 75 && progress < 100) {
        setHardwareScanStep('معالجة واستلام صورة المستند الممسوح بدقة عالية...');
      } else if (progress === 100) {
        setHardwareScanStep('اكتمل سحب واستلام المستند بنجاح!');
      }
    });

    // Listen to scan complete
    const subComplete = scannerService.onScanComplete().subscribe((filePaths) => {
      if (filePaths && filePaths[0]) {
        setScannedImageUrl(filePaths[0]);
        setIsHardwareScanning(false);
        const resolvedName = selectedScannerId === 'custom-scanner' 
          ? (customModelInput.trim() || 'الماسح المخصص') 
          : selectedScannerName;
        toast(`تم مسح المستند بنجاح من جهاز [${resolvedName.split('(')[0].trim()}] ✅`);
      }
    });

    // Listen to scan error
    const subError = scannerService.onScanError().subscribe((errorMsg) => {
      setIsHardwareScanning(false);
      setHardwareScanStep('');
      toast(`خطأ أثناء تشغيل الماسح: ${errorMsg}`);
    });

    // Listen to isScanning state
    const subScanning = scannerService.getIsScanning().subscribe((scanning) => {
      setIsHardwareScanning(scanning);
    });

    // Auto-detect and populate ONLY actual available scanners on open
    scannerService.getAvailableScanners().then(names => {
      if (names && names.length > 0) {
        const detected: ScannerDevice[] = names.map((name, idx) => ({
          id: `dev-${idx}`,
          name: name,
          vendor: 'System Peripheral',
          model: name,
          protocol: 'WIA',
          driverName: 'WIA / TWAIN Native Driver',
          status: 'online',
          supportedResolutions: [150, 300, 600],
          supportedModes: ['color', 'grayscale', 'bw']
        }));

        setScannersList(detected);
        setSelectedScannerId(detected[0].id);
        setSelectedScannerName(detected[0].name);
      }
    });

    scanningService.getSystemStatus().then(status => {
      setSystemStatus(status);
    });

    const hasUsb = typeof navigator !== 'undefined' && 'usb' in navigator;
    setIsUsbSupported(hasUsb);

    return () => {
      subProgress.unsubscribe();
      subComplete.unsubscribe();
      subError.unsubscribe();
      subScanning.unsubscribe();
    };
  }, [isOpen, selectedScannerName, selectedScannerId, customModelInput]);

  // Scan & detect scanners explicitly using getAvailableScanners()
  const handleDetectScanners = async () => {
    setIsScanningDevices(true);
    toast('جاري فحص الجهاز والتعرف على الماسح المتصل...');

    try {
      const names = await scannerService.getAvailableScanners();
      if (names && names.length > 0) {
        const detected: ScannerDevice[] = names.map((name, idx) => ({
          id: `dev-${idx}`,
          name: name,
          vendor: 'System Peripheral',
          model: name,
          protocol: 'WIA',
          driverName: 'WIA / TWAIN Native Driver',
          status: 'online',
          supportedResolutions: [150, 300, 600],
          supportedModes: ['color', 'grayscale', 'bw']
        }));

        setScannersList(detected);
        const active = detected[0];
        setSelectedScannerId(active.id);
        setSelectedScannerName(active.name);
        toast(`تم اكتشاف الماسح المتصل: [${active.name.split('(')[0].trim()}] بنجاح ✅`);
      } else {
        toast('تم فحص منافذ الجهاز بنجاح');
      }
    } catch (e) {
      toast('اكتمل فحص أجهزة النظام');
    } finally {
      setIsScanningDevices(false);
    }
  };

  // Start Scanning document matching user's reference implementation
  const startScanning = async () => {
    if (isHardwareScanning) return;
    setIsHardwareScanning(true);
    setErrorMessage(null);
    setScanProgress(15);
    setHardwareScanStep('جاري الاتصال بالسكانر وسحب الملف...');

    try {
      const response = await scannerService.scanDocument({
        deviceId: selectedScannerId || '',
        dpi: scanDpi,
        colorMode: scanColorMode,
        format: 'pdf'
      });

      if (response && response.success && (response.dataUrl || response.data)) {
        const finalUrl = response.dataUrl || `data:${response.mimeType || 'application/pdf'};base64,${response.data}`;
        setScannedImageUrl(finalUrl);
        setScanProgress(100);
        setHardwareScanStep('اكتمل سحب واستلام المستند بنجاح!');
        toast('تم سحب المستند بنجاح من الماسح الضوئي! ✅');
      } else {
        const msg = response?.error || 'تعذر الاتصال بالماسح الضوئي. يرجى التأكد من توصيل الجهاز وتثبيت برامج التشغيل.';
        setErrorMessage(msg);
      }
    } catch (error: any) {
      console.error('Scan Request Failed:', error);
      setErrorMessage('تعذر الاتصال بالماسح الضوئي. يرجى التأكد من توصيل الجهاز وتثبيت برامج التشغيل.');
    } finally {
      setIsHardwareScanning(false);
    }
  };

  const handleDirectHardwareScan = async (isTest: boolean = false) => {
    await startScanning();
  };

  // Listen for Clipboard Paste (Ctrl+V) to receive scanned image
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              setScannedImageUrl(result);
              toast('تم استقبال الورقة الممسوحة من الحافظة (Paste) بنجاح! ✅');
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Listen for Escape key to close modal / go back
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up camera stream on close
  useEffect(() => {
    if (!isOpen && cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setShowCamera(false);
    }
  }, [isOpen, cameraStream]);

  if (!isOpen) return null;

  // WebUSB Scanner Discovery
  const handleDetectUsbScanner = async () => {
    if (!isUsbSupported) {
      toast('متصفحك لا يدعم WebUSB المباشر، يمكنك اختيار صورة المسح من جهازك أو لصقها مباشرة');
      return;
    }

    setIsDetectingUsb(true);
    try {
      // Request USB Scanner device from browser
      const device = await (navigator as any).usb.requestDevice({
        filters: [
          { vendorId: 0x03f0 }, // HP (Hewlett-Packard ScanJet)
          { vendorId: 0x04a9 }, // Canon
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x04f9 }, // Brother
        ]
      });

      const detectedName = device.productName || `HP ScanJet (معرف المنتج: ${device.productId})`;
      const newOption: ScannerDevice = {
        id: `usb-${device.productId || Date.now()}`,
        name: `${detectedName} (متصل الآن)`,
        vendor: device.vendorId ? `Vendor ${device.vendorId}` : 'USB Scanner',
        model: detectedName,
        protocol: 'WebUSB',
        driverName: 'Direct WebUSB Hardware Driver',
        status: 'ready',
        supportedResolutions: [150, 300, 600],
        supportedModes: ['color', 'grayscale', 'bw']
      };

      setScannersList(prev => [newOption, ...prev.filter(p => p.id !== newOption.id)]);
      setSelectedScannerId(newOption.id);
      setSelectedScannerName(newOption.name);
      toast(`تم التعرف على جهاز الماسح الضوئي: ${detectedName} وإضافته للقائمة بنجاح ✅`);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        try {
          const anyDevice = await (navigator as any).usb.requestDevice({ filters: [] });
          const detectedName = anyDevice.productName || 'ماسح ضوئي USB';
          const newOption: ScannerDevice = {
            id: `usb-${Date.now()}`,
            name: `${detectedName} (متصل)`,
            vendor: 'USB Scanner',
            model: detectedName,
            protocol: 'WebUSB',
            driverName: 'Generic WebUSB Driver',
            status: 'ready',
            supportedResolutions: [150, 300, 600],
            supportedModes: ['color', 'grayscale', 'bw']
          };
          setScannersList(prev => [newOption, ...prev]);
          setSelectedScannerId(newOption.id);
          setSelectedScannerName(newOption.name);
          toast(`تم التعرف على الجهاز: ${detectedName} ✅`);
        } catch {
          // User cancelled
        }
      } else {
        toast('تعذر العثور على أجهزة USB، يمكنك اختيار الماسح من القائمة المنسدلة');
      }
    } finally {
      setIsDetectingUsb(false);
    }
  };

  // Handle Real File Selection from Scanner
  const handleRealFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setScannedImageUrl(result);
        if (!docName || docName === 'شهادة ميلاد') {
          const rawName = file.name.replace(/\.[^/.]+$/, "");
          if (!rawName.toLowerCase().startsWith('scan')) {
            setDocName(rawName);
          }
        }
        toast('تم سحب الورقة الحقيقية من السكانر بنجاح! ✅');
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop support for real scan files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.includes('pdf'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setScannedImageUrl(result);
        toast('تم إدراج الورقة الممسوحة بنجاح! ✅');
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Camera Document Capture
  const handleStartCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast('تعذر تشغيل الكاميرا، يرجى التأكد من توصيلها ومنح الإذن');
      setShowCamera(false);
    }
  };

  // Capture Photo from Camera
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setScannedImageUrl(dataUrl);
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setShowCamera(false);
      toast('تم التقاط الورقة بنجاح! ✅');
    }
  };

  // Save Document
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scannedImageUrl) {
      toast('يرجى سحب أو إدراج الورقة الممسوحة من السكانر أولاً');
      return;
    }

    try {
      let finalDataUrl = scannedImageUrl;
      const isPdf = scannedImageUrl.startsWith('data:application/pdf');

      if (!isPdf && (rotation !== 0 || isBwFilter)) {
        const img = new Image();
        img.src = scannedImageUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        if (rotation % 180 !== 0) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          if (isBwFilter) {
            ctx.filter = 'grayscale(100%) contrast(140%) brightness(105%)';
          }
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        }
      }

      const fileId = await saveDataUrlToLocal(finalDataUrl);
      const finalName = docName.trim() || 'شهادة ميلاد';

      let category = 'other';
      const lower = finalName.toLowerCase();
      if (lower.includes('ميلاد') || lower.includes('شهادة')) category = 'certificate';
      else if (lower.includes('هوية') || lower.includes('بطاقة') || lower.includes('وطني')) category = 'national_id';
      else if (lower.includes('جواز')) category = 'passport';
      else if (lower.includes('عقد')) category = 'contract';

      const resolvedScannerName = selectedScannerId === 'custom-scanner' 
        ? (customModelInput.trim() || 'ماسح ضوئي مخصص') 
        : selectedScannerName;

      const newDoc: Document = {
        id: 'doc-' + Date.now(),
        name: finalName,
        type: isPdf ? 'مستند PDF ممسوح ضوئياً' : 'مستند ممسوح ضوئياً',
        category: category as any,
        uploadDate: new Date().toISOString(),
        fileId: fileId,
        thumbnail: finalDataUrl,
        source: 'scanner',
        notes: `تم السحب من جهاز الماسح الضوئي: ${resolvedScannerName}${notes ? ' - ' + notes : ''}`
      };

      onSaveDocument(newDoc);
      setShowEnlargedPreview(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast('حدث خطأ أثناء حفظ المستند');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Printer size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                قسم سحب وأرشفة وثائق الموظفين
              </h3>
              <p className="text-[11px] text-slate-500">
                سحب المستندات عبر السكانر وحفظها مباشرة في ملف الموظف
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="تسكير القائمة والعودة"
            >
              <X size={15} />
              <span>تسكير القائمة</span>
            </button>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* شريط المساعدة وأزرار التراجع وتسكير القائمة */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50/90 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">أزرار مساعدة سريعة للتحكم:</span>
            </div>

            <div className="flex items-center gap-2">
              {scannedImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setScannedImageUrl(null);
                    setRotation(0);
                    setIsBwFilter(false);
                    toast('تم التراجع وإلغاء المستند المسحوب بنجاح ✅');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title="التراجع عن المسح الحالي والبدء من جديد"
                >
                  <RotateCw size={13} />
                  <span>تراجع عن السحب</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="تسكير القائمة والرجوع"
              >
                <X size={14} />
                <span>تسكير القائمة</span>
              </button>
            </div>
          </div>
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600 font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* مكون ScannerSelector لاختيار الماسح المتصل الفعلي وعرض التنبيه في حال عدم وجود جهاز */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <ScannerSelector
              selectedScanner={selectedScannerName}
              onSelectScanner={(name) => {
                setSelectedScannerName(name);
                setSelectedScannerId(name);
              }}
              disabled={isHardwareScanning}
            />

            {/* خيارات الدقة واللون مدمجة ومختصرة */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold">الدقة:</span>
                {[150, 300, 600].map((dpi) => (
                  <button
                    key={dpi}
                    type="button"
                    onClick={() => setScanDpi(dpi)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      scanDpi === dpi ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dpi} DPI
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold">اللون:</span>
                {[
                  { id: 'color', label: 'ملون' },
                  { id: 'grayscale', label: 'رمادي' },
                  { id: 'bw', label: 'أبيض/أسود' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setScanColorMode(mode.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      scanColorMode === mode.id ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* زر بدء المسح وزر اختبار الميزة السريع */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startScanning}
                disabled={isHardwareScanning}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isHardwareScanning ? (
                  <div className="w-full flex flex-col items-center gap-1.5 py-0.5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin text-white shrink-0" />
                        <span className="text-xs font-bold">{hardwareScanStep || 'جاري الاتصال بالسكانر وسحب الملف...'}</span>
                      </div>
                      <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded text-white">
                        {scanProgress}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/25 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-white h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(8, scanProgress))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Printer size={18} />
                    <span>اضغط هنا لبدء السحب من السكانر</span>
                  </>
                )}
              </button>
            </div>

            {/* خيارات سريعة مختصرة */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-0.5">
              <button
                type="button"
                onClick={handleStartCamera}
                disabled={isHardwareScanning}
                className="hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Camera size={13} />
                <span>الكاميرا</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isHardwareScanning}
                className="hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Upload size={13} />
                <span>رفع ملف ممسوح</span>
              </button>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 flex items-center gap-1">
                <ClipboardPaste size={13} />
                <span>لصق (Ctrl+V)</span>
              </span>
            </div>

            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleRealFileSelect}
            />
          </div>

          {/* Camera View Modal Area */}
          {showCamera && (
            <div className="border border-blue-300 rounded-xl p-4 bg-slate-900 text-white relative animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold flex items-center gap-1.5 text-blue-300">
                  <Camera size={15} />
                  <span>وجه الكاميرا نحو الورقة أو الوثيقة:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
                    setCameraStream(null);
                    setShowCamera(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  إغلاق الكاميرا
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-black max-h-64 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="max-h-64 w-auto object-contain" />
              </div>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleCaptureCamera}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} />
                  <span>التقاط صورة الورقة</span>
                </button>
              </div>
            </div>
          )}

          {/* معاينة المستند الممسوح */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">معاينة المستند الممسوح</h4>
            </div>
            {scannedImageUrl && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                جاهز للحفظ
              </span>
            )}
          </div>

          {/* Scanned Real Document Display with Preview Action */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center min-h-[220px] ${
              scannedImageUrl 
                ? 'border-emerald-300 bg-emerald-50/20' 
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
            }`}
            onClick={() => !scannedImageUrl && fileInputRef.current?.click()}
          >
            {scannedImageUrl ? (
              <div className="w-full flex flex-col items-center">
                
                {scannedImageUrl.startsWith('data:application/pdf') ? (
                  /* PDF Document Preview Card */
                  <div 
                    onClick={() => setShowEnlargedPreview(true)}
                    className="relative group w-full h-64 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50 cursor-pointer hover:border-blue-400 transition-all flex flex-col"
                    title="انقر لتكبير ملف PDF وعرضه ملء الشاشة قبل الحفظ"
                  >
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0">
                      <span className="font-bold flex items-center gap-1.5 text-red-600">
                        <FileText size={15} />
                        <span>وثيقة PDF ممسوحة ضوئياً</span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        جاهز للأرشفة
                      </span>
                    </div>

                    <iframe 
                      src={scannedImageUrl} 
                      title="معاينة PDF"
                      className="w-full flex-1 border-0 pointer-events-none"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs rounded-xl">
                      <span className="bg-white/95 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                        <Eye size={15} className="text-blue-600" />
                        عرض وتكبير ملف PDF قبل الحفظ
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Real Document Interactive Preview Card (Image) */
                  <div 
                    onClick={() => setShowEnlargedPreview(true)}
                    className="relative group max-h-60 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white p-2 cursor-pointer hover:border-blue-400 transition-all"
                    title="انقر لتكبير المستند وعرضه ملء الشاشة قبل الحفظ"
                  >
                    <img 
                      src={scannedImageUrl} 
                      alt="Real Scanned Document" 
                      style={{ 
                        transform: `rotate(${rotation}deg)`,
                        filter: isBwFilter ? 'grayscale(100%) contrast(140%) brightness(105%)' : 'none'
                      }}
                      className="max-h-52 w-auto object-contain transition-all duration-200 rounded group-hover:scale-102"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <CheckCircle2 size={12} />
                      <span>ورقة حقيقية ممسوحة</span>
                    </div>

                    {/* Hover Overlay with Eye to View Scanned Document */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs rounded-xl">
                      <span className="bg-white/95 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                        <Eye size={15} className="text-blue-600" />
                        عرض وتكبير المستند قبل الحفظ
                      </span>
                    </div>
                  </div>
                )}

                {/* Scanned Image Action Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                  
                  {/* Dedicated View/Preview Button */}
                  <button
                    type="button"
                    onClick={() => setShowEnlargedPreview(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="عرض المستند بالحجم الكامل وتكبيره"
                  >
                    <Eye size={14} />
                    <span>عرض وتكبير المستند</span>
                  </button>

                  {!scannedImageUrl.startsWith('data:application/pdf') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRotation(prev => (prev + 90) % 360)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="تدوير الورقة 90 درجة"
                      >
                        <RotateCw size={13} />
                        <span>تدوير</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsBwFilter(prev => !prev)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ${
                          isBwFilter 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title="توضيح المستند وأبيض/أسود عالي الوضوح"
                      >
                        <span>{isBwFilter ? 'إلغاء التوضيح' : 'توضيح النصوص'}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw size={13} />
                    <span>تغيير الورقة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                  <Printer size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    لم يتم مسح مستند بعد
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    اضغط على <strong className="text-blue-700">"بدء المسح من الجهاز"</strong> أو <strong className="text-emerald-700">"اختبار المسح"</strong> بالأعلى
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* اسم المستند واختصارات سريعة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              اسم المستند:
            </label>
            <input 
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="مثال: شهادة ميلاد، عقد عمل، بطاقة هوية..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {/* اختصارات أسماء المستندات بنقرة واحدة */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {COMMON_DOC_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDocName(suggestion)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    docName === suggestion
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  {docName === suggestion && <Check size={11} />}
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات إضافية (اختياري)
            </label>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: نسخة أصلية من السكانر، تاريخ الإصدار..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>الموظف:</span>
              <strong className="text-slate-800">{employeeName}</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تسكير القائمة والتراجع للخلف"
              >
                <X size={14} />
                <span>تسكير / تراجع</span>
              </button>
              <button
                type="submit"
                disabled={!scannedImageUrl}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
              >
                <FileCheck size={16} />
                <span>حفظ ورفع لملف الموظف</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Enlarged Fullscreen Preview Modal (Lightbox) */}
      {showEnlargedPreview && scannedImageUrl && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Lightbox Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Eye size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    معاينة المستند الممسوح ضوئياً قبل الحفظ
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    الاسم: <strong>{docName || 'مستند بدون اسم'}</strong> • الماسح: {selectedScannerName.split('(')[0].trim()}
                  </p>
                </div>
              </div>

              {/* Lightbox Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.max(prev - 25, 50))}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-bold text-slate-700 min-w-10 text-center" dir="ltr">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.min(prev + 25, 250))}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="إعادة ضبط الحجم"
                >
                  100%
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1"></div>

                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                  title="تدوير"
                >
                  <RotateCw size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsBwFilter(prev => !prev)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                    isBwFilter 
                      ? 'bg-slate-800 text-white border-slate-800' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="توضيح المستند"
                >
                  توضيح النصوص
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnlargedPreview(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Container with Scroll & Zoom */}
            <div className="flex-1 overflow-auto bg-slate-900/95 p-6 flex items-center justify-center min-h-[400px]">
              {scannedImageUrl.startsWith('data:application/pdf') ? (
                <iframe 
                  src={scannedImageUrl} 
                  title="معاينة PDF بالحجم الكامل"
                  className="w-full h-[75vh] border-0 rounded-lg shadow-2xl bg-white"
                />
              ) : (
                <div 
                  style={{ 
                    transform: `scale(${previewZoom / 100})`, 
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="max-w-full flex items-center justify-center shadow-2xl"
                >
                  <img 
                    src={scannedImageUrl} 
                    alt="Scanned Preview Enlarged" 
                    style={{ 
                      transform: `rotate(${rotation}deg)`,
                      filter: isBwFilter ? 'grayscale(100%) contrast(140%) brightness(105%)' : 'none'
                    }}
                    className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl transition-all duration-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Lightbox Footer with Direct Save */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                المستند جاهز بدقة عالية • انقر زر الحفظ لإدراجه مباشرة في ملف الموظف
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnlargedPreview(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  العودة للنافذة السابقة
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
                >
                  <FileCheck size={16} />
                  <span>تأكيد الحفظ وإدراج في المستندات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
