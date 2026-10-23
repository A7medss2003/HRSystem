import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Download, Trash2, ZoomIn, ZoomOut, 
  RotateCw, Calendar, FileText, Shield, Award, 
  CreditCard, Briefcase, Stethoscope, Landmark, 
  Clock, AlertTriangle, CheckCircle, Maximize2, Minimize2
} from 'lucide-react';
import { Document } from '../types';
import { getFileFromLocal } from '../lib/fileStorage';
import { toast } from './Toast';
import clsx from 'clsx';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  employeeName: string;
  onDelete?: (docId: string) => void;
  readOnly?: boolean;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document: doc,
  employeeName,
  onDelete,
  readOnly = false
}: DocumentViewerModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Load document image from local storage
  useEffect(() => {
    if (isOpen && doc) {
      setIsLoading(true);
      setZoomLevel(1);
      setRotation(0);

      if (doc.thumbnail) {
        setImageUrl(doc.thumbnail);
        setIsLoading(false);
      } else if (doc.fileId) {
        getFileFromLocal(doc.fileId)
          .then((data) => {
            setImageUrl(data);
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('Warning loading document file:', err);
            setIsLoading(false);
          });
      } else {
        setImageUrl(null);
        setIsLoading(false);
      }
    } else {
      setImageUrl(null);
    }
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  // Check Expiry
  const getExpiryStatus = () => {
    if (!doc.expiryDate) return null;
    const exp = new Date(doc.expiryDate);
    if (isNaN(exp.getTime())) return null;
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { isExpired: true, text: `منتهي الصلاحية منذ ${Math.abs(diffDays)} يوم` };
    }
    if (diffDays <= 30) {
      return { isExpiring: true, text: `ينتهي قريباً خلال ${diffDays} يوم` };
    }
    return { isValid: true, text: `ساري الصلاحية (متبقي ${diffDays} يوم)` };
  };

  const expiryStatus = getExpiryStatus();

  // Print Document
  const handlePrintDocument = () => {
    if (!imageUrl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>طباعة مستند - ${doc.name} - ${employeeName}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .meta {
            font-size: 13px;
            color: #64748b;
          }
          .image-box {
            text-align: center;
            margin: 20px auto;
            max-width: 100%;
          }
          .image-box img {
            max-width: 100%;
            max-height: 230mm;
            object-fit: contain;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
          }
          .footer {
            margin-top: 15px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${doc.name}</div>
            <div class="meta">الموظف: ${employeeName} | نوع المستند: ${doc.type || 'وثيقة رسمية'}</div>
          </div>
          <div style="text-align: left; font-size: 12px; color: #475569;">
            ${doc.documentNo ? `رقم المستند: <strong>${doc.documentNo}</strong><br/>` : ''}
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar-LY')}
          </div>
        </div>
        
        <div class="image-box">
          <img src="${imageUrl}" alt="${doc.name}" />
        </div>

        <div class="footer">
          <span>نظام إدارة الموارد البشرية - مصلحة شؤون الموظفين</span>
          <span>مستند مؤرشف إلكترونياً ومطابق للأصل الممسوح ضوئياً</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Download Document
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = window.document.createElement('a');
    a.href = imageUrl;
    a.download = `${doc.name || 'document'}-${employeeName}.jpg`;
    a.click();
    toast('جاري تنزيل ملف المستند');
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{doc.name}</h3>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
                  {doc.type}
                </span>
                {doc.source === 'scanner' && (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    ممسوح ضوئياً 📠
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                الموظف: <strong className="text-slate-200">{employeeName}</strong>
                {doc.uploadDate && ` | تاريخ الإدراج: ${new Date(doc.uploadDate).toLocaleDateString('ar-LY')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDocument}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="طباعة المستند"
            >
              <Printer size={15} />
              <span>طباعة المستند</span>
            </button>

            {imageUrl && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                title="تنزيل الملف"
              >
                <Download size={15} />
                <span>تنزيل</span>
              </button>
            )}

            {!readOnly && onDelete && (
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) {
                    onDelete(doc.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="حذف المستند"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          
          {/* Main Document Viewer Canvas (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col items-center justify-between relative select-none">
            
            {/* Zoom & Rotate Floating Toolbar */}
            <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xl pointer-events-auto">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn size={16} />
                </button>
                <span className="text-xs font-mono text-slate-300 px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut size={16} />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="تدوير 90°"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>

            {/* Image Container with Zoom & Rotation */}
            <div className="w-full flex-1 flex items-center justify-center overflow-auto p-4 min-h-[400px]">
              {isLoading ? (
                <div className="text-slate-400 text-sm flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل صورة المستند...</span>
                </div>
              ) : imageUrl ? (
                <div 
                  className="transition-transform duration-200 origin-center max-w-full"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={doc.name}
                    className="max-h-[500px] max-w-full object-contain rounded shadow-2xl border border-slate-700 bg-white"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <FileText size={48} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">لا تتوفر معاينة مرئية لهذا المستند</p>
                  <p className="text-xs text-slate-500 mt-1">قد يكون الملف مسجلاً بدون صورة أو تم حذفه</p>
                </div>
              )}
            </div>

            {/* Document Bottom Status */}
            <div className="w-full text-center text-[11px] text-slate-400 py-1 border-t border-slate-800/80">
              دقة العرض الأصلية | انقر أزرار التحكم للتكبير أو التدوير
            </div>

          </div>

          {/* Right Sidebar: Document Metadata (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-5 space-y-5 flex flex-col justify-between">
            
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2">
                بطاقة تفاصيل المستند
              </h4>

              {/* Status Alert if expiring */}
              {expiryStatus && (
                <div className={clsx(
                  "p-3 rounded-xl border text-xs flex items-center gap-2 font-medium",
                  expiryStatus.isExpired
                    ? "bg-red-50 text-red-800 border-red-200"
                    : expiryStatus.isExpiring
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                )}>
                  {expiryStatus.isExpired ? (
                    <AlertTriangle size={18} className="text-red-600 shrink-0" />
                  ) : expiryStatus.isExpiring ? (
                    <Clock size={18} className="text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  )}
                  <span>{expiryStatus.text}</span>
                </div>
              )}

              {/* Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">اسم المستند:</span>
                  <span className="font-bold text-slate-800">{doc.name}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">التصنيف:</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {doc.type}
                  </span>
                </div>

                {doc.documentNo && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">رقم القيد / المستند:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">
                      {doc.documentNo}
                    </span>
                  </div>
                )}

                {doc.issuer && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">الجهة المانحة / المصدرة:</span>
                    <span className="font-medium text-slate-700">{doc.issuer}</span>
                  </div>
                )}

                {doc.issueDate && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">تاريخ الإصدار:</span>
                    <span className="font-mono text-slate-700" dir="ltr">{doc.issueDate}</span>
                  </div>
                )}

                {doc.expiryDate && (
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">تاريخ الانتهاء:</span>
                    <span className="font-mono font-semibold text-slate-800" dir="ltr">{doc.expiryDate}</span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">طريقة الإدخال:</span>
                  <span className="font-medium text-slate-700">
                    {doc.source === 'scanner' ? 'مسح ضوئي مباشر (Scanner)' : doc.source === 'camera' ? 'كاميرا المستندات' : 'ملف مستورد'}
                  </span>
                </div>

                {doc.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">الملاحظات:</span>
                    <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                      {doc.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrintDocument}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Printer size={16} />
                <span>طباعة نسخة مطابقة للأصل</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
