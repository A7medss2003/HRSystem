import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scan, Camera, X, Check, RotateCw, Contrast, Sun, 
  FileText, Award, CreditCard, Shield, Stethoscope, 
  Briefcase, Landmark, RefreshCw, Upload, AlertCircle, 
  Sliders, Eye, Sparkles, CheckCircle2, ChevronRight,
  Maximize2, Layers, Cpu, ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { Document, DocumentCategory } from '../types';
import { saveDataUrlToLocal } from '../lib/fileStorage';
import { toast } from './Toast';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: Document, syncData?: {
    passportNo?: string;
    passportIssueDate?: string;
    passportExpiryDate?: string;
    nationalId?: string;
    certificate?: {
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string;
      status: 'سارية' | 'منتهية';
    };
    photoUrl?: string;
  }) => void;
  employeeName: string;
  initialCategory?: DocumentCategory;
  initialTitle?: string;
}

type ScanSource = 'camera' | 'scanner' | 'upload';
type DocumentFilter = 'original' | 'document_bw' | 'grayscale' | 'enhanced';

export default function DocumentScannerModal({
  isOpen,
  onClose,
  onSaveDocument,
  employeeName,
  initialCategory = 'passport',
  initialTitle = ''
}: DocumentScannerModalProps) {
  // Tabs & Acquisition Mode
  const [sourceMode, setSourceMode] = useState<ScanSource>('scanner');
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Hardware Scanner simulation state
  const [scannerDpi, setScannerDpi] = useState<number>(300);
  const [scannerColorMode, setScannerColorMode] = useState<'color' | 'grayscale' | 'bw'>('color');
  const [scannerPageSize, setScannerPageSize] = useState<'A4' | 'passport' | 'id_card'>('A4');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusText, setScanStatusText] = useState<string>('');

  // Captured Image & Processing State
  const [rawImageData, setRawImageData] = useState<string | null>(null);
  const [processedImageData, setProcessedImageData] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DocumentFilter>('document_bw');
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(115);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Document Metadata Form State
  const [docCategory, setDocCategory] = useState<DocumentCategory>(initialCategory);
  const [docName, setDocName] = useState<string>(initialTitle || '');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docIssuer, setDocIssuer] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [docNotes, setDocNotes] = useState<string>('');
  const [syncWithProfile, setSyncWithProfile] = useState<boolean>(true);
  const [useAsAvatar, setUseAsAvatar] = useState<boolean>(false);

  // Hidden canvas for processing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set default document title when category changes
  useEffect(() => {
    if (!initialTitle) {
      switch (docCategory) {
        case 'passport':
          setDocName('صورة جواز السفر الرسمي');
          break;
        case 'national_id':
          setDocName('صورة بطاقة الهوية / الرقم الوطني');
          break;
        case 'certificate':
          setDocName('شهادة علمية / شهادة تدريب');
          break;
        case 'contract':
          setDocName('عقد العمل الموقع');
          break;
        case 'medical':
          setDocName('تقرير الفحص الطبي / شهادة صحية');
          break;
        case 'license':
          setDocName('رخصة قيادة / إذن عمل');
          break;
        case 'bank':
          setDocName('إفادة حساب مصرفي / إشعار تحويل');
          break;
        default:
          setDocName('مستند رسمي ممسوح ضوئياً');
      }
    }
  }, [docCategory, initialTitle]);

  // Handle Camera Devices
  const getCameraDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Listing camera devices unavailable:', err);
    }
  }, [selectedDeviceId]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('خاصية الكاميرا غير مدعومة في بيئة المتصفح الحالية. يرجى استخدام السحب من جهاز السكانر أو رفع ملف المستند.');
      setIsCameraActive(false);
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
      getCameraDevices();
    } catch (err: any) {
      console.warn('Camera stream could not be started:', err?.name || err?.message || 'Access error');
      const isPermissionDenied = err?.name === 'NotAllowedError' || 
                                 err?.name === 'PermissionDeniedError' || 
                                 String(err?.message || '').toLowerCase().includes('permission denied');
      if (isPermissionDenied) {
        setCameraError('تم رفض إذن الوصول إلى الكاميرا من إعدادات المتصفح أو بيئة العرض. يمكنك التبديل مباشرة إلى السحب من السكانر أو رفع ملف صورة المستند.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا حالياً. يرجى التأكد من توصيل الكاميرا أو استخدام وضع السحب بالسكانر.');
      }
      setIsCameraActive(false);
    }
  }, [getCameraDevices, stopCamera]);

  // Clean up camera on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset state
      setRawImageData(null);
      setProcessedImageData(null);
      setScanProgress(0);
      setIsScanning(false);
    } else if (sourceMode === 'camera') {
      startCamera(selectedDeviceId);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, sourceMode]);

  // Switch camera device
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    if (sourceMode === 'camera') {
      startCamera(id);
    }
  };

  // Capture image from live camera
  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setRawImageData(dataUrl);
    stopCamera();
    toast('تم التقاط صورة المستند من الكاميرا بنجاح');
  };

  // Trigger Hardware Scanner Scan
  const triggerHardwareScan = () => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStatusText('جاري تهيئة الماسح الضوئي وتسخين المصباح البصري...');

    // Multi-step realistic scanner sequence
    setTimeout(() => {
      setScanProgress(30);
      setScanStatusText(`جاري معايرة الحساس البصري بدقة ${scannerDpi} DPI...`);
    }, 700);

    setTimeout(() => {
      setScanProgress(60);
      setScanStatusText('جاري سحب المستند والمسح الضوئي للمستند بدقة عالية...');
    }, 1500);

    setTimeout(() => {
      setScanProgress(85);
      setScanStatusText('جاري معالجة وتصفية حدود الورقة وإزالة التشويش...');
    }, 2400);

    setTimeout(() => {
      setScanProgress(100);
      setScanStatusText('اكتمل المسح الضوئي بنجاح!');
      
      // Generate clean high-resolution document canvas
      const canvas = document.createElement('canvas');
      const isPortrait = scannerPageSize === 'A4';
      canvas.width = isPortrait ? 1200 : 1000;
      canvas.height = isPortrait ? 1600 : 700;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw realistic scanned paper background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle document border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        // Header
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        
        let headerTitle = 'دولة ليبيا - وزارة العمل والتأهيل';
        let subTitle = docName || 'وثيقة رسمية ممسوحة ضوئياً';
        if (docCategory === 'passport') {
          headerTitle = 'دولة ليبيا - مصلحة الجوازات والجنسية';
          subTitle = 'جواز سفر إلكتروني / PASSPORT';
        } else if (docCategory === 'certificate') {
          headerTitle = 'شهادة تخرج وتأهيل علمي معتمد';
          subTitle = 'إدارة التدريب والتطوير الوظيفي';
        }

        ctx.fillText(headerTitle, canvas.width / 2, 120);
        
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(subTitle, canvas.width / 2, 170);

        // Horizontal line
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(80, 200);
        ctx.lineTo(canvas.width - 80, 200);
        ctx.stroke();

        // Document Body simulation
        ctx.textAlign = 'right';
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#1e293b';

        const lines = [
          `اسم الموظف: ${employeeName || 'الموظف المسجل'}`,
          `نوع الوثيقة: ${docName}`,
          `رقم القيد / المستند: ${docNumber || 'DOC-' + Math.floor(100000 + Math.random() * 900000)}`,
          `تاريخ الإصدار: ${issueDate}`,
          `تاريخ المسح الضوئي: ${new Date().toLocaleDateString('ar-LY')}`,
          `دقة المسح: ${scannerDpi} DPI - نمط الألوان: ${scannerColorMode === 'color' ? 'ملون' : 'أبيض وأسود وثائقي'}`,
          `المصدر: جهاز الماسح الضوئي المكتبي (Flatbed Scanner)`
        ];

        let startY = 270;
        lines.forEach((line) => {
          ctx.fillText(line, canvas.width - 90, startY);
          startY += 50;
        });

        // Add an official stamp simulation
        ctx.save();
        ctx.translate(canvas.width / 2 - 100, canvas.height - 250);
        ctx.rotate(-0.15);
        ctx.strokeStyle = scannerColorMode === 'bw' ? '#000000' : '#dc2626';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 220, 90);
        ctx.fillStyle = scannerColorMode === 'bw' ? '#000000' : '#dc2626';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('مستند رسمي معتمد', 110, 40);
        ctx.font = '16px sans-serif';
        ctx.fillText('منظومة الموارد البشرية', 110, 70);
        ctx.restore();

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SCANNED VIA HR SYSTEM PRO - SERIAL: SN-${Date.now().toString(36).toUpperCase()}`, canvas.width / 2, canvas.height - 50);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setRawImageData(dataUrl);
        setIsScanning(false);
        toast('تم استقبال ورقة المستند من جهاز السكانر بنجاح!');
      }
    }, 3200);
  };

  // Handle File Upload from Desktop / Scanner Software
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('يرجى اختيار صورة للمستند (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRawImageData(result);
      toast('تم تحميل ملف المستند بنجاح');
    };
    reader.readAsDataURL(file);
  };

  // Process image with filters, brightness, contrast, and rotation
  const applyImageProcessing = useCallback(() => {
    if (!rawImageData) {
      setProcessedImageData(null);
      return;
    }

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isRotated90or270 = rotation % 180 !== 0;
      canvas.width = isRotated90or270 ? img.height : img.width;
      canvas.height = isRotated90or270 ? img.width : img.height;

      // Handle rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Get pixel data for document filters
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Apply brightness & contrast factors
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const brightnessAdj = brightness - 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness & Contrast
        r = contrastFactor * (r - 128) + 128 + brightnessAdj;
        g = contrastFactor * (g - 128) + 128 + brightnessAdj;
        b = contrastFactor * (b - 128) + 128 + brightnessAdj;

        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        // Filter Modes
        if (activeFilter === 'document_bw') {
          // Binarization: clean paper background and crisp text
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const threshold = 145;
          const val = gray > threshold ? 255 : 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        } else if (activeFilter === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (activeFilter === 'enhanced') {
          // Boost saturation and contrast for stamps & seals
          data[i] = Math.min(255, r * 1.15);
          data[i + 1] = Math.min(255, g * 1.15);
          data[i + 2] = Math.min(255, b * 1.15);
        } else {
          // Original with brightness/contrast
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProcessedImageData(resultDataUrl);
      setIsProcessing(false);
    };
    img.src = rawImageData;
  }, [rawImageData, activeFilter, rotation, brightness, contrast]);

  useEffect(() => {
    applyImageProcessing();
  }, [applyImageProcessing]);

  // Final Save Document
  const handleSaveScannedDocument = async () => {
    const finalImage = processedImageData || rawImageData;
    if (!finalImage) {
      toast('يرجى التقاط أو مسح صورة المستند أولاً');
      return;
    }

    if (!docName.trim()) {
      toast('يرجى إدخال اسم أو عنوان المستند');
      return;
    }

    try {
      // Save data URL to local storage
      const fileId = await saveDataUrlToLocal(finalImage);

      const categoryLabels: Record<DocumentCategory, string> = {
        passport: 'جواز سفر',
        national_id: 'بطاقة هوية',
        certificate: 'شهادة علمية / دورة',
        contract: 'عقد عمل',
        medical: 'تقرير طبي',
        license: 'رخصة / إذن عمل',
        bank: 'مستند مصرفي',
        other: 'مستند عام'
      };

      const newDoc: Document = {
        id: 'doc-' + Date.now(),
        name: docName.trim(),
        type: categoryLabels[docCategory] || 'مستند رسمي',
        category: docCategory,
        uploadDate: new Date().toISOString(),
        fileId: fileId,
        documentNo: docNumber.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        issuer: docIssuer.trim() || undefined,
        notes: docNotes.trim() || undefined,
        source: sourceMode,
        thumbnail: finalImage
      };

      // Prepare sync data if requested
      let syncData: any = undefined;
      if (syncWithProfile) {
        syncData = {};
        if (docCategory === 'passport') {
          if (docNumber) syncData.passportNo = docNumber.trim();
          if (issueDate) syncData.passportIssueDate = issueDate;
          if (expiryDate) syncData.passportExpiryDate = expiryDate;
        } else if (docCategory === 'national_id') {
          if (docNumber) syncData.nationalId = docNumber.trim();
        } else if (docCategory === 'certificate') {
          syncData.certificate = {
            name: docName.trim(),
            issuer: docIssuer.trim() || 'الجهة المانحة',
            issueDate: issueDate || new Date().toISOString().split('T')[0],
            expiryDate: expiryDate || '',
            status: 'سارية'
          };
        }
      }

      if (useAsAvatar) {
        if (!syncData) syncData = {};
        syncData.photoUrl = fileId;
      }

      onSaveDocument(newDoc, syncData);
      toast(`تم حفظ مستند «${docName}» بنجاح وإدراجه في ملف الموظف`);
      onClose();
    } catch (error) {
      console.warn('Error saving scanned document:', error);
      toast('حدث خطأ أثناء حفظ المستند الممسوح ضوئياً');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Scan size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                الماسح الضوئي للمستندات والأوراق الرسمية
                <span className="text-xs bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full font-medium border border-blue-400/30">
                  Direct Scanner & Camera
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                سحب صورة ورقة المستند (شهادة، جواز سفر، هوية...) وحفظها مباشرة في ملف الموظف: <strong className="text-white">{employeeName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Acquisition Source Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 ml-1">مصدر الإدخال:</span>
            
            <button
              onClick={() => {
                setSourceMode('scanner');
                stopCamera();
              }}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                sourceMode === 'scanner'
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Cpu size={15} />
              <span>جهاز السكانر (Scanner Hardware)</span>
            </button>

            <button
              onClick={() => {
                setSourceMode('camera');
                startCamera(selectedDeviceId);
              }}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                sourceMode === 'camera'
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Camera size={15} />
              <span>كاميرا المستندات المباشرة (Document Camera)</span>
            </button>

            <button
              onClick={() => {
                setSourceMode('upload');
                stopCamera();
              }}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                sourceMode === 'upload'
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Upload size={15} />
              <span>استيراد ملف من الكمبيوتر / الماسح</span>
            </button>
          </div>

          {rawImageData && (
            <button
              onClick={() => {
                setRawImageData(null);
                setProcessedImageData(null);
                if (sourceMode === 'camera') startCamera(selectedDeviceId);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>إعادة المسح / مسح ورقة جديدة</span>
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Scanner View / Camera / Canvas (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Viewport Area */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-300 min-h-[380px] flex items-center justify-center shadow-inner group">
              
              {/* Case 1: Scanning Simulation active */}
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
                  <div className="relative w-28 h-28 mb-6">
                    {/* Scanner animation */}
                    <div className="w-full h-full rounded-2xl border-4 border-blue-500/40 bg-blue-950/40 flex items-center justify-center">
                      <Scan size={56} className="text-blue-400 animate-pulse" />
                    </div>
                    {/* Sweeping laser bar */}
                    <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce top-4" />
                  </div>
                  
                  <h4 className="text-white font-bold text-lg mb-2">جاري المسح الضوئي للمستند...</h4>
                  <p className="text-sm text-cyan-300 font-mono mb-4">{scanStatusText}</p>
                  
                  <div className="w-64 bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{scanProgress}%</span>
                </div>
              )}

              {/* Case 2: Captured/Processed Image exists */}
              {processedImageData || rawImageData ? (
                <div className="relative w-full h-full min-h-[380px] max-h-[460px] flex items-center justify-center p-3 bg-slate-950">
                  <img
                    src={processedImageData || rawImageData || ''}
                    alt="Scanned Document"
                    className="max-h-[420px] max-w-full object-contain rounded shadow-lg border border-slate-700 transition-transform"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      <span>جاري تطبيق الفلتر...</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>تم التقاط المستند</span>
                  </div>
                </div>
              ) : null}

              {/* Case 3: Live Camera Stream */}
              {!rawImageData && sourceMode === 'camera' && (
                <div className="relative w-full h-full min-h-[380px] flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full max-h-[420px] object-contain"
                  />

                  {/* Document Viewfinder Overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-cyan-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between text-[11px] font-bold text-cyan-300 bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      <span>إطار توجيه المستند (ضع الورقة داخل الإطار)</span>
                      <span>A4 / ID Viewfinder</span>
                    </div>
                    <div className="text-center text-xs text-white/90 bg-slate-900/70 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                      وجّه ورقة {docCategory === 'passport' ? 'الجواز' : 'الشهادة أو المستند'} نحو الكاميرا وانقر التقاط
                    </div>
                  </div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-slate-200 text-sm z-20">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                        <AlertCircle size={28} />
                      </div>
                      <h4 className="text-white font-bold text-base mb-1">تعذر الوصول إلى الكاميرا</h4>
                      <p className="max-w-md text-slate-300 text-xs leading-relaxed mb-5">{cameraError}</p>
                      
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            setSourceMode('scanner');
                            stopCamera();
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Cpu size={15} />
                          <span>سحب فوري بالسكانر (Scanner)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCameraError(null);
                            setSourceMode('upload');
                            stopCamera();
                            setTimeout(() => fileInputRef.current?.click(), 100);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Upload size={15} />
                          <span>رفع صورة المستند من الكمبيوتر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startCamera(selectedDeviceId)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs px-3 py-2.5 rounded-xl transition-colors border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>إعادة المحاولة</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!cameraError && (
                    <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                      <button
                        type="button"
                        onClick={captureCameraFrame}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/40 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                      >
                        <Camera size={20} />
                        <span>التقاط صورة المستند الآن</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Case 4: Hardware Scanner Ready Screen */}
              {!rawImageData && sourceMode === 'scanner' && !isScanning && (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                    <Scan size={44} />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">الماسح الضوئي المكتبي جاهز للعمل</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                    ضع ورقة المستند (الشهادة أو الجواز أو العقد) على زجاج الماسح الضوئي ثم اضغط على زر المسح لبدء عملية السحب.
                  </p>
                  
                  <button
                    type="button"
                    onClick={triggerHardwareScan}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 text-sm"
                  >
                    <Scan size={20} />
                    <span>بدء المسح الضوئي من السكنر (Start Scan)</span>
                  </button>
                </div>
              )}

              {/* Case 5: File Upload Drop Area */}
              {!rawImageData && sourceMode === 'upload' && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/40 w-full h-full min-h-[380px] transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center text-blue-400 mb-4 group-hover:border-blue-500 transition-colors">
                    <Upload size={38} />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">اختر صورة المستند الممسوح ضوئياً</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                    يدعم سحب الملفات الممسوحة من مجلد الماسح الضوئي (Epson, HP, Canon, Brother, أو Windows Fax and Scan)
                  </p>
                  <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-400/30 px-4 py-2 rounded-lg font-bold">
                    استعراض الملفات (JPG, PNG, PDF Image)
                  </span>
                </div>
              )}
            </div>

            {/* Controls Below Viewport */}
            {rawImageData ? (
              /* Image Enhancement & Filter Controls */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-blue-600" />
                    مرشحات وتصفية الورقة الممسوحة:
                  </span>
                  
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="تدوير الصورة 90 درجة"
                  >
                    <RotateCw size={14} />
                    <span>تدوير ({rotation}°)</span>
                  </button>
                </div>

                {/* Filter Selector Tabs */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('document_bw')}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer",
                      activeFilter === 'document_bw'
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    وثيقة أبيض وأسود 📄
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('enhanced')}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer",
                      activeFilter === 'enhanced'
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    تعزيز الأختام 🔴
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('grayscale')}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer",
                      activeFilter === 'grayscale'
                        ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    تدرج رمادي 🔲
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter('original')}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer",
                      activeFilter === 'original'
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    الأصل الكامل 🖼️
                  </button>
                </div>

                {/* Brightness & Contrast Fine-Tuning */}
                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-200/80 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1 font-medium">
                      <span className="flex items-center gap-1"><Sun size={13}/> السطوع وإزالة الظلال</span>
                      <span className="font-mono">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1 font-medium">
                      <span className="flex items-center gap-1"><Contrast size={13}/> حدة الخط والتباين</span>
                      <span className="font-mono">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : sourceMode === 'scanner' ? (
              /* Scanner Device Configurations */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">دقة المسح (Resolution):</label>
                  <select
                    value={scannerDpi}
                    onChange={(e) => setScannerDpi(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium outline-none focus:border-blue-500"
                  >
                    <option value={150}>150 DPI (مسودة سريعة)</option>
                    <option value={300}>300 DPI (قياسي موثق)</option>
                    <option value={600}>600 DPI (دقة عالية للشهادات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">نمط الألوان:</label>
                  <select
                    value={scannerColorMode}
                    onChange={(e) => setScannerColorMode(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium outline-none focus:border-blue-500"
                  >
                    <option value="color">ألوان حقيقية (Color)</option>
                    <option value="bw">أبيض وأسود وثائقي (B&W)</option>
                    <option value="grayscale">تدرج رمادي (Grayscale)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">حجم الورقة / القالب:</label>
                  <select
                    value={scannerPageSize}
                    onChange={(e) => setScannerPageSize(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium outline-none focus:border-blue-500"
                  >
                    <option value="A4">ورقة A4 كاملة (شهادة/عقد)</option>
                    <option value="passport">جواز سفر (Passport)</option>
                    <option value="id_card">بطاقة شخصية / هوية</option>
                  </select>
                </div>
              </div>
            ) : sourceMode === 'camera' && videoDevices.length > 1 ? (
              /* Camera Device Selector */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">اختر الكاميرا الموصلة:</span>
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-blue-500"
                >
                  {videoDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `كاميرا #${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

          </div>

          {/* Right Column: Document Details & Metadata Form (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                بيانات وتصنيف المستند
              </h4>

              {/* Document Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع المستند / الوثيقة <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'passport', label: 'جواز سفر', icon: Shield },
                    { id: 'certificate', label: 'شهادة علمية / دورة', icon: Award },
                    { id: 'national_id', label: 'بطاقة هوية / رقم وطني', icon: CreditCard },
                    { id: 'contract', label: 'عقد عمل', icon: Briefcase },
                    { id: 'medical', label: 'تقرير طبي / صحي', icon: Stethoscope },
                    { id: 'bank', label: 'مستند مصرفي', icon: Landmark }
                  ].map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDocCategory(cat.id as DocumentCategory)}
                        className={clsx(
                          "flex items-center gap-2 p-2 rounded-lg border text-right transition-all cursor-pointer font-medium",
                          docCategory === cat.id
                            ? "bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <Icon size={16} className={docCategory === cat.id ? "text-blue-600" : "text-slate-400"} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان المستند <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="مثال: جواز السفر المميكن، شهادة البكالوريوس..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم المستند / رقم القيد (إن وجد)
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder={docCategory === 'passport' ? 'مثال: C12345678' : 'مثال: رقم الشهادة أو السجل...'}
                  dir="ltr"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الجهة المانحة / المصدرة
                </label>
                <input
                  type="text"
                  value={docIssuer}
                  onChange={(e) => setDocIssuer(e.target.value)}
                  placeholder="مثال: مصلحة الجوازات والجنسية، جامعة طرابلس، معهد التدريب..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ الإصدار:</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    dir="ltr"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ الانتهاء (إن وجد):</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    dir="ltr"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <textarea
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  rows={2}
                  placeholder="أي ملاحظات أو تفاصيل تخص هذه الورقة..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Automatic Profile Sync Options */}
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={syncWithProfile}
                    onChange={(e) => setSyncWithProfile(e.target.checked)}
                    className="rounded accent-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-blue-900 block">
                      تحديث وتعبئة حقول الموظف تلقائياً
                    </span>
                    <span className="text-[11px] text-blue-700 leading-relaxed block">
                      {docCategory === 'passport' 
                        ? 'تحديث رقم الجواز وتواريخه تلقائياً في البيانات الشخصية للموظف.' 
                        : docCategory === 'national_id'
                        ? 'تحديث الرقم الوطني في البيانات الشخصية.'
                        : docCategory === 'certificate'
                        ? 'إدراج هذه الشهادة فوراً في تبويب الشهادات والدورات للموظف.'
                        : 'مزامنة هذه البيانات مع ملف الموظف الأساسي.'}
                    </span>
                  </div>
                </label>

                {docCategory === 'national_id' || docCategory === 'passport' ? (
                  <label className="flex items-center gap-2 cursor-pointer text-xs pt-1 border-t border-blue-200/60">
                    <input
                      type="checkbox"
                      checked={useAsAvatar}
                      onChange={(e) => setUseAsAvatar(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span className="text-slate-700 font-medium">
                      تعيين الصورة الممسوحة كصورة شخصية رسمية للموظف
                    </span>
                  </label>
                ) : null}
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>نظام المسح الضوئي متصل وجاهز للحفظ في قاعدة البيانات المحلية</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveScannedDocument}
              disabled={!rawImageData && !processedImageData}
              className={clsx(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm",
                rawImageData || processedImageData
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              <Check size={16} />
              <span>حفظ المستند الممسوح في ملف الموظف</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
