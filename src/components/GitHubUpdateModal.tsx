import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Globe, 
  Terminal, 
  ExternalLink, 
  Sparkles, 
  X, 
  ShieldCheck, 
  ArrowLeft,
  Lock,
  GitCommit,
  User,
  Clock,
  RotateCcw
} from 'lucide-react';
import { githubUpdateService, GitHubCheckResult, GitHubApplyResult } from '../services/githubUpdateService';
import { toast } from './Toast';

export interface GitHubUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export default function GitHubUpdateModal({ isOpen, onClose, onUpdateSuccess }: GitHubUpdateModalProps) {
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [token, setToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<GitHubCheckResult | null>(null);
  const [updateLogs, setUpdateLogs] = useState<Array<{ time: string; message: string }>>([]);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Load stored config on mount
  useEffect(() => {
    if (!isOpen) return;
    const config = githubUpdateService.getConfig();
    setRepo(config.repo || '');
    setBranch(config.branch || 'main');
    setToken(config.token || '');
    if (config.token) setShowTokenInput(true);

    // Initial check if repo is already configured
    if (config.repo) {
      handleCheck(config.repo, config.branch, config.token);
    }
  }, [isOpen]);

  const handleSaveConfig = () => {
    if (!repo.trim()) {
      toast('يرجى إدخال اسم أو رابط مستودع GitHub', 'warning');
      return;
    }
    githubUpdateService.saveConfig({
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      token: token.trim()
    });
    toast('تم حفظ إعدادات مستودع GitHub بنجاح', 'success');
  };

  const handleCheck = async (customRepo?: string, customBranch?: string, customToken?: string) => {
    const targetRepo = (customRepo ?? repo).trim();
    const targetBranch = (customBranch ?? branch).trim() || 'main';
    const targetToken = customToken ?? token;

    if (!targetRepo) {
      toast('يرجى تحديد مستودع GitHub أولاً', 'warning');
      return;
    }

    setIsChecking(true);
    setUpdateSuccess(false);

    try {
      const res = await githubUpdateService.checkUpdates({
        repo: targetRepo,
        branch: targetBranch,
        token: targetToken
      });

      setCheckResult(res);

      if (res.success) {
        if (res.hasUpdate) {
          toast(`يوجد تحديث جديد متاح على GitHub [${res.latestCommit?.shortSha}] 🚀`, 'info');
        } else {
          toast('المنظومة محدثة بالكامل لأحدث نسخة متوفرة على GitHub ✅', 'success');
        }
      } else {
        toast(res.error || 'تعذر فحص التحديثات من GitHub', 'error');
      }
    } catch (e: any) {
      toast('حدث خطأ أثناء الاتصال بخادم GitHub', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = async () => {
    if (isUpdating) return;

    handleSaveConfig();
    setIsUpdating(true);
    setUpdateLogs([
      { time: new Date().toLocaleTimeString('ar-EG'), message: 'بدء الاتصال بمستودع GitHub والتحقق من الصلاحيات...' }
    ]);

    try {
      const res = await githubUpdateService.applyUpdate({
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        token: token.trim()
      });

      if (res.logs && res.logs.length > 0) {
        setUpdateLogs(res.logs);
      }

      if (res.success) {
        setUpdateSuccess(true);
        toast('اكتمل التحديث وتطبيق التعديلات بنجاح! 🚀', 'success');
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        toast(res.error || 'تعذر استكمال التحديث', 'error');
        setUpdateLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('ar-EG'), message: `خطأ: ${res.error || 'فشل التحديث'}` }
        ]);
      }
    } catch (err: any) {
      toast(`خطأ أثناء تطبيق التحديث: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <GitBranch size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>تحديث المنظومة عبر GitHub</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-mono">
                  Git In-App Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                مزامنة وتطبيق أحدث التعديلات المرفوعة على المستودع بنقرة زر واحدة
              </p>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* 1. Configuration Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Globe size={15} className="text-blue-600" />
                <span>إعدادات مستودع GitHub المستهدف:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Key size={12} />
                <span>{showTokenInput ? 'إخفاء حقل الـ Token' : 'مستودع خاص (Private Repo)؟'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  اسم أو رابط المستودع:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="username/repository أو https://github.com/..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  الفرع (Branch):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Optional Personal Access Token for private repos */}
            {showTokenInput && (
              <div className="pt-2 border-t border-slate-200/80 space-y-1 animate-in fade-in duration-200">
                <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Lock size={12} className="text-amber-600" />
                  <span>رمز الوصول الشخصي (GitHub Personal Access Token) للمستودعات الخاصة:</span>
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  مطلوب فقط إذا كان المستودع خاصاً (Private)، لتمكين المنظومة من قراءة وسحب التحديثات بأمان.
                </p>
              </div>
            )}
          </div>

          {/* 2. Version Comparison & Live Status */}
          {checkResult && checkResult.success && checkResult.latestCommit && (
            <div className={`border rounded-xl p-4 space-y-3 ${
              checkResult.hasUpdate 
                ? 'bg-blue-50/70 border-blue-200' 
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {checkResult.hasUpdate ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  )}
                  <h4 className="font-bold text-slate-900 text-xs">
                    {checkResult.hasUpdate 
                      ? '🚀 يتوفر إصدار جديد مرفوع على GitHub وجاهز للتثبيت!' 
                      : '✅ المنظومة محدثة بالكامل لأحدث نسخة على GitHub'}
                  </h4>
                </div>

                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                  {checkResult.branch} @ {checkResult.owner}/{checkResult.repo}
                </span>
              </div>

              {/* Commit Details Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <GitCommit size={14} className="text-blue-600" />
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {checkResult.latestCommit.shortSha}
                      </span>
                      <span className="font-bold text-slate-800">
                        {checkResult.latestCommit.message}
                      </span>
                    </div>
                    {checkResult.latestCommit.fullMessage && checkResult.latestCommit.fullMessage !== checkResult.latestCommit.message && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mr-6">
                        {checkResult.latestCommit.fullMessage}
                      </p>
                    )}
                  </div>

                  {checkResult.latestCommit.url && (
                    <a
                      href={checkResult.latestCommit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-bold shrink-0"
                    >
                      <span>عرض في GitHub</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    <span>الكاتب: <strong className="text-slate-600">{checkResult.latestCommit.author}</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>التاريخ: {new Date(checkResult.latestCommit.date).toLocaleString('ar-EG')}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {checkResult && !checkResult.success && checkResult.error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">تعذر الوصول إلى التحديثات:</p>
                <p className="text-[11px] leading-relaxed text-rose-700">{checkResult.error}</p>
              </div>
            </div>
          )}

          {/* 3. Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => handleCheck()}
              disabled={isChecking || isUpdating}
              className="w-full sm:flex-1 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs disabled:opacity-50"
            >
              <RefreshCw size={15} className={isChecking ? 'animate-spin text-blue-600' : 'text-blue-600'} />
              <span>{isChecking ? 'جاري فحص GitHub...' : 'التحقق من التحديثات'}</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isChecking || isUpdating || !repo.trim()}
              className={`w-full sm:flex-1 py-3 px-4 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50 ${
                checkResult?.hasUpdate
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {isUpdating ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-white" />
                  <span>جاري تطبيق التحديث والمزامنة...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={16} />
                  <span>تحميل وتثبيت الملفات الجديدة</span>
                </>
              )}
            </button>
          </div>

          {/* 4. Update Execution Logs Terminal */}
          {updateLogs.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span className="flex items-center gap-1.5">
                  <Terminal size={14} className="text-slate-500" />
                  <span>سجل تنفيذ التحديث المباشر:</span>
                </span>
                {updateSuccess && (
                  <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>اكتملت العملية 100%</span>
                  </span>
                )}
              </div>

              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto" dir="ltr">
                {updateLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 select-none">[{log.time}]</span>
                    <span className="text-emerald-400">»</span>
                    <span className="text-slate-100 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>

              {updateSuccess && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>إعادة تحميل المنظومة الآن</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Safety Guarantee Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 text-[11px]">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span>
              <strong>أمان تام:</strong> عملية التحديث تقوم بتحديث ملفات وشاشات المنظومة فقط دون أي مساس ببيانات الموظفين أو قواعد البيانات المركزية والنسخ الاحتياطية.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            يمكنك رفع تعديلاتك على GitHub ثم الضغط هنا في أي وقت للتحديث
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
