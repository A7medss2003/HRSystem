import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  Sparkles,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

interface NameAndUploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSave: (docData: { name: string; type: string; category?: string; notes?: string }) => void;
}

const COMMON_DOC_SUGGESTIONS = [
  'شهادة ميلاد',
  'بطاقة هوية',
  'جواز سفر',
  'عقد عمل',
  'شهادة تخرج / مؤهل علمي',
  'رخصة قيادة',
  'تقرير طبي / كشف طبي',
  'شهادة خبرة',
  'إقامة / تأشيرة',
  'صحيفة الحالة الجنائية'
];

export default function NameAndUploadDocumentModal({
  isOpen,
  onClose,
  file,
  onSave
}: NameAndUploadDocumentModalProps) {
  const [docName, setDocName] = useState('');
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      // Default to empty or clean filename without extension if convenient
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      setDocName('');
      setNotes('');

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = docName.trim() || file.name.replace(/\.[^/.]+$/, "") || 'مستند مرفق';
    
    // Auto category mapping based on name
    let category = 'other';
    const lower = finalName.toLowerCase();
    if (lower.includes('ميلاد') || lower.includes('شهادة')) category = 'certificate';
    else if (lower.includes('هوية') || lower.includes('بطاقة') || lower.includes('وطني')) category = 'national_id';
    else if (lower.includes('جواز')) category = 'passport';
    else if (lower.includes('عقد')) category = 'contract';

    onSave({
      name: finalName,
      type: file.type || 'ملف',
      category,
      notes: notes.trim()
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">رفع وتسمية المستند</h3>
              <p className="text-xs text-slate-500">قم بتسمية المستند لحفظه في ملف الموظف</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Card Info */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl flex items-center gap-3.5">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-14 h-14 object-cover rounded-lg border border-blue-200 shrink-0" 
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  ملف مرفق
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 truncate mt-1" dir="ltr" title={file.name}>
                {file.name}
              </p>
            </div>
          </div>

          {/* Document Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              اسم المستند <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              autoFocus
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="مثال: شهادة ميلاد، عقد عمل، بطاقة هوية..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>اختر اسماً جاهزاً بنقرة واحدة:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DOC_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDocName(suggestion)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    docName === suggestion
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  {docName === suggestion && <Check size={12} />}
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات أو تفاصيل إضافية (اختياري)
            </label>
            <input 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: النسخة الأصلية مصدقة، تاريخ الإصدار..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
            >
              <FileCheck size={16} />
              <span>حفظ وإدراج في المستندات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
