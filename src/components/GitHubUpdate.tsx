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
  ShieldCheck,
  Lock,
  GitCommit,
  User,
  Clock,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Info,
  Server,
  Copy,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';
import { githubUpdateService, GitHubCheckResult, GitHubApplyResult, GitHubUpdateConfig } from '../services/githubUpdateService';
import { toast } from './Toast';
import { APP_VERSION, APP_RELEASE_DATE, DEFAULT_REPO_URL, DEFAULT_BRANCH } from '../version';

interface GitHubUpdateProps {
  className?: string;
  onUpdateCompleted?: () => void;
  compact?: boolean;
}

export const GitHubUpdate: React.FC<GitHubUpdateProps> = ({
  className = '',
  onUpdateCompleted,
  compact = false
}) => {
  const [repo, setRepo] = useState<string>(DEFAULT_REPO_URL);
  const [branch, setBranch] = useState<string>(DEFAULT_BRANCH);
  const [token, setToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [hasSavedConfig, setHasSavedConfig] = useState<boolean>(false);

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [checkResult, setCheckResult] = useState<GitHubCheckResult | null>(null);
  const [updateLogs, setUpdateLogs] = useState<Array<{ time: string; message: string }>>([]);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'manager' | 'logs'>('manager');
  const [showPushGuide, setShowPushGuide] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);

  const effectiveRepoUrl = repo.trim().startsWith('http') 
    ? (repo.trim().endsWith('.git') ? repo.trim() : `${repo.trim()}.git`)
    : (repo.trim() ? `https://github.com/${repo.trim()}.git` : 'https://github.com/USERNAME/HR-SYSTEM.git');

  const gitBashScript = `# 1. الانتقال لمجلد المنظومة وتهيئة Git
git init
git add .
git commit -m "النسخة الأولية لمنظومة الموارد البشرية v${APP_VERSION}"

# 2. تعيين اسم الفرع الرئيسي
git branch -M ${branch.trim() || 'main'}

# 3. ربط المستودع على GitHub
git remote add origin ${effectiveRepoUrl}

# 4. رفع الملفات إلى المستودع
git push -u origin ${branch.trim() || 'main'}`;

  const copyPushCommands = () => {
    try {
      navigator.clipboard.writeText(gitBashScript);
      setCopiedCommand(true);
      toast('تم نسخ أوامر Git إلى الحافظة بنجاح! 📋', 'success');
      setTimeout(() => setCopiedCommand(false), 3000);
    } catch (e) {
      toast('تعذر النسخ التلقائي، يمكنك تحديد النص ونسخه يدوياً');
    }
  };

  // تحميل الإعدادات المحفوظة عند فتح الواجهة
  useEffect(() => {
    const config = githubUpdateService.getConfig();
    setRepo(config.repo || DEFAULT_REPO_URL);
    setBranch(config.branch || DEFAULT_BRANCH);
    setHasSavedConfig(true);

    if (config.token) {
      setToken(config.token);
      setShowTokenInput(true);
    }

    // جلب معلومات الإصدار المحلي المخزن
    const storedSha = localStorage.getItem('hr_installed_commit_sha');
    const storedDate = localStorage.getItem('hr_last_update_date');
    if (!checkResult) {
      setCheckResult({
        success: true,
        hasUpdate: false,
        currentCommit: {
          sha: storedSha || 'النسخة الأصلية',
          shortSha: storedSha ? storedSha.substring(0, 7) : 'v' + APP_VERSION,
          updatedAt: storedDate || APP_RELEASE_DATE
        }
      });
    }
  }, []);

  const handleResetToDefault = () => {
    const def = githubUpdateService.resetToDefault();
    setRepo(def.repo);
    setBranch(def.branch);
    setToken('');
    setShowTokenInput(false);
    toast('تمت استعادة رابط المستودع الأساسي للمنظومة بنجاح', 'success');
  };

  const handleSaveConfig = () => {
    const targetRepo = repo.trim() || DEFAULT_REPO_URL;
    const targetBranch = branch.trim() || DEFAULT_BRANCH;
    githubUpdateService.saveConfig({
      repo: targetRepo,
      branch: targetBranch,
      token: token.trim()
    });
    setRepo(targetRepo);
    setBranch(targetBranch);
    setHasSavedConfig(true);
    toast('تم حفظ وتثبيت رابط المستودع بنجاح', 'success');
  };

  /**
   * زر 'التحقق من التحديثات':
   * يقوم بمقارنة إصدار النظام المحلي مع أحدث إصدار في المستودع
   */
  const handleCheckUpdates = async () => {
    const targetRepo = repo.trim();
    const targetBranch = branch.trim() || 'main';
    const targetToken = token.trim();

    if (!targetRepo) {
      toast('يرجى إدخال رابط أو اسم مستودع GitHub', 'warning');
      return;
    }

    // حفظ الإعدادات تلقائياً
    githubUpdateService.saveConfig({
      repo: targetRepo,
      branch: targetBranch,
      token: targetToken
    });
    setHasSavedConfig(true);

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
          toast(`يوجد إصدار جديد على GitHub جاهز للتحديث [${res.latestCommit?.shortSha}] 🚀`, 'info');
        } else {
          toast('المنظومة محدثة بالكامل ومطابقة لأحدث إصدار في المستودع ✅', 'success');
        }
      } else {
        toast(res.error || 'تعذر فحص التحديثات من مستودع GitHub', 'error');
      }
    } catch (e: any) {
      toast(`خطأ أثناء الاتصال بـ GitHub: ${e.message || 'فشل الاتصال'}`, 'error');
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * تحميل وتثبيت الملفات الجديدة
   */
  const handleDownloadAndApply = async () => {
    if (isUpdating) return;

    if (!repo.trim()) {
      toast('يرجى إدخال رابط مستودع GitHub أولاً', 'warning');
      return;
    }

    setIsUpdating(true);
    setProgressPercent(15);
    setActiveTab('logs');
    setUpdateLogs([
      { time: new Date().toLocaleTimeString('ar-EG'), message: 'بدء الاتصال بمستودع GitHub والتحقق من الصلاحيات...' }
    ]);

    try {
      // محاكاة خطوات التقدم لراحة المستخدم
      const timer1 = setTimeout(() => {
        setProgressPercent(40);
        setUpdateLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('ar-EG'), message: 'جاري فحص شجرة الملفات الجديدة والمعدلة في المستودع...' }
        ]);
      }, 700);

      const timer2 = setTimeout(() => {
        setProgressPercent(75);
        setUpdateLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('ar-EG'), message: 'جاري تحميل حزم التحديث مع تأمين قواعد البيانات المحلية...' }
        ]);
      }, 1500);

      const res = await githubUpdateService.applyUpdate({
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        token: token.trim()
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setProgressPercent(100);

      if (res.logs && res.logs.length > 0) {
        setUpdateLogs(res.logs);
      }

      if (res.success) {
        setUpdateSuccess(true);
        toast('تم تحميل الملفات الجديدة وتحديث المنظومة بنجاح! 🚀', 'success');
        
        // تحديث حالة العرض لتعكس النسخة الجديدة
        if (res.latestCommit) {
          setCheckResult(prev => ({
            ...prev,
            success: true,
            hasUpdate: false,
            currentCommit: {
              sha: res.latestCommit!.sha,
              shortSha: res.latestCommit!.shortSha,
              updatedAt: new Date().toISOString()
            },
            latestCommit: res.latestCommit
          }));
        }

        if (onUpdateCompleted) {
          onUpdateCompleted();
        }
      } else {
        toast(res.error || 'فشل تحميل وتطبيق الملفات الجديدة', 'error');
        setUpdateLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString('ar-EG'), message: `خطأ أثناء التحديث: ${res.error || 'غير معروف'}` }
        ]);
      }
    } catch (err: any) {
      toast(`خطأ أثناء التحديث: ${err.message}`, 'error');
      setUpdateLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString('ar-EG'), message: `خطأ فادح: ${err.message}` }
      ]);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentShaDisplay = checkResult?.currentCommit?.shortSha || ('v' + APP_VERSION);
  const latestShaDisplay = checkResult?.latestCommit?.shortSha || '---';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-right ${className}`} dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs">
              <RefreshCw className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold">تحديث المنظومة عبر الإنترنت</h3>
                <span className="text-[11px] bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-mono">
                  Online Update
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                فحص وتحميل أحدث التحديثات مباشرة بنقرة زر مع الحفاظ التام على بياناتك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>ترقية آمنة في نفس المسار</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        
        {/* Section 1: Repository Configuration Inputs */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Globe size={18} className="text-blue-600" />
              <span>إعدادات التحديث عبر الإنترنت:</span>
            </div>
            
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Key size={13} className="text-blue-500" />
              <span>{showTokenInput ? 'إخفاء مفتاح الوصول' : 'مستودع خاص (Private)؟'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Repo Input */}
            <div className="md:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  رابط مستودع التحديث:
                </label>
                {repo.trim() === DEFAULT_REPO_URL ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    المستودع الأساسي للمنظومة (الافتراضي)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={11} />
                    <span>استعادة المستودع الأساسي</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder={DEFAULT_REPO_URL}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    repo.trim() === DEFAULT_REPO_URL
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-300'
                  }`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {repo.trim() === DEFAULT_REPO_URL ? 'الأساسي' : 'مخصص'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {repo.trim() === DEFAULT_REPO_URL
                  ? 'هذا هو المستودع الأساسي المعتمد للمنظومة، ويمكنك تغييره لأي مستودع آخر عند الحاجة.'
                  : 'تم تعيين مستودع مخصص، يمكنك حفظه أو استعادة المستودع الأساسي بنقرة زر.'}
              </p>
            </div>

            {/* Branch Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                الفرع المستهدف (Branch):
              </label>
              <input
                type="text"
                dir="ltr"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-500">
                الفرع الافتراضي هو <code className="font-mono text-slate-700">main</code> أو <code className="font-mono text-slate-700">master</code>.
              </p>
            </div>
          </div>

          {/* Token Input for Private Repositories */}
          {showTokenInput && (
            <div className="pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-600" />
                  <span>رمز الوصول الشخصي للمستودع الخاص (Personal Access Token):</span>
                </label>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <span>إنشاء Token من GitHub</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                dir="ltr"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-amber-700 leading-relaxed bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                🔒 <strong>ملاحظة هامة:</strong> إذا كان مستودع GitHub خاصاً بمؤسستك (Private)، يتطلب GitHub رمز وصول شخصي (Classic Token أو Fine-grained) يحتوي على صلاحية <code className="font-mono font-bold">repo</code> لقراءة وسحب التعديلات.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowPushGuide(!showPushGuide)}
              className="w-full sm:w-auto text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <HelpCircle size={14} className="text-indigo-600" />
              <span>كيف أرفع المنظومة لأول مرة إلى مستودعي على GitHub؟</span>
              {showPushGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {repo.trim() !== DEFAULT_REPO_URL && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="w-full sm:w-auto text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <RotateCcw size={13} />
                  <span>استعادة المستودع الأساسي</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveConfig}
                className="w-full sm:w-auto text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Save size={13} />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>

          {/* Interactive First Push Step-by-Step Guide */}
          {showPushGuide && (
            <div className="mt-3 p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl space-y-3.5 border border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-blue-400" />
                  <span className="font-bold text-xs text-white">
                    خطوات رفع المنظومة إلى مستودع GitHub الخاص بك لأول مرة:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyPushCommands}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  {copiedCommand ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                  <span>{copiedCommand ? 'تم نسخ الأوامر!' : 'نسخ الأوامر بنقرة واحدة'}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                  <p>
                    ادخل إلى موقع <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">GitHub.com/new</a> وأنشئ مستودعاً جديداً (اتركه فارغاً دون إضافة README).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                  <p>
                    افتح موجه الأوامر (Terminal أو Git Bash) داخل مجلد المنظومة، وقم بلصق الأوامر التالية مباشرة:
                  </p>
                </div>
              </div>

              {/* Ready-to-copy Terminal block */}
              <div className="relative bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto" dir="ltr">
                <pre className="whitespace-pre">{gitBashScript}</pre>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-white/5 p-2.5 rounded-lg border border-white/10">
                <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>بعد الرفع:</strong> عند قيامك بأي تعديل مستقبلي، فقط قم بعمل <code className="text-blue-300 font-mono font-bold">git commit</code> و <code className="text-blue-300 font-mono font-bold">git push</code>، ثم افتح هذه الشاشة واضغط زر <strong>'التحقق من التحديثات'</strong> وسيتم سحب التحديثات وتطبيقها فورياً بنقرة زر!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Version Comparison Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Server size={14} className="text-blue-600" />
              <span>مقارنة الإصدار المحلي مع أحدث إصدار على GitHub:</span>
            </span>

            {checkResult?.hasUpdate !== undefined && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                checkResult.hasUpdate
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                {checkResult.hasUpdate ? 'يوجد تحديثات جديدة متوفرة' : 'الإصدار متطابق ومُحدّث'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Local Version Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>الإصدار المحلي المثبت حالياً</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  LOCAL INSTALLED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم إصدار المنظومة:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    v{APP_VERSION}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">معرّف الـ Commit المحلي:</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {currentShaDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">آخر تحديث أو تثبيت:</span>
                  <span className="text-slate-700">
                    {checkResult?.currentCommit?.updatedAt
                      ? new Date(checkResult.currentCommit.updatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                      : APP_RELEASE_DATE}
                  </span>
                </div>
              </div>
            </div>

            {/* Remote GitHub Version Card */}
            <div className={`border rounded-xl p-4 shadow-2xs relative transition-all ${
              checkResult?.latestCommit
                ? checkResult.hasUpdate
                  ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10'
                  : 'bg-emerald-50/40 border-emerald-300'
                : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    checkResult?.latestCommit 
                      ? checkResult.hasUpdate ? 'bg-blue-600 animate-ping' : 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`} />
                  <span>أحدث إصدار في مستودع GitHub</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  checkResult?.latestCommit
                    ? checkResult.hasUpdate ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {checkResult?.branch ? `BRANCH: ${checkResult.branch}` : 'REMOTE'}
                </span>
              </div>

              {checkResult?.latestCommit ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">أحدث Commit:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <GitCommit size={12} />
                      {latestShaDisplay}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 text-[11px] block">عنوان التعديل الأخير:</span>
                    <p className="font-bold text-slate-800 bg-white/80 p-1.5 rounded border border-slate-200/70 text-[11px] line-clamp-2">
                      {checkResult.latestCommit.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      <span>المطور: <strong>{checkResult.latestCommit.author}</strong></span>
                    </span>

                    {checkResult.latestCommit.url && (
                      <a
                        href={checkResult.latestCommit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                      >
                        <span>عرض على GitHub</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 space-y-1">
                  <p className="text-xs">لم يتم الفحص بعد</p>
                  <p className="text-[11px]">اضغط على زر <strong>'التحقق من التحديثات'</strong> أدناه لقراءة المستودع</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Error notification banner if any */}
        {checkResult && !checkResult.success && checkResult.error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 flex items-start gap-3 animate-in fade-in duration-150">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold">تعذر الوصول إلى التحديثات من GitHub:</p>
              <p className="text-rose-700 leading-relaxed">{checkResult.error}</p>
            </div>
          </div>
        )}

        {/* Progress Bar (Visible during update) */}
        {isUpdating && (
          <div className="space-y-2 bg-blue-50/80 border border-blue-200 rounded-xl p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>جاري تحميل الملفات الجديدة ومزامنة المنظومة...</span>
              </span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            
            <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Section 3: Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          
          {/* Main Requested Button: 'التحقق من التحديثات' */}
          <button
            type="button"
            onClick={handleCheckUpdates}
            disabled={isChecking || isUpdating}
            className="w-full sm:flex-1 py-3.5 px-5 bg-white hover:bg-slate-50 border-2 border-blue-600 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-xs disabled:opacity-50 text-sm hover:shadow-md"
          >
            <RefreshCw size={17} className={isChecking ? 'animate-spin text-blue-600' : 'text-blue-600'} />
            <span>{isChecking ? 'جاري التحقق من GitHub...' : 'التحقق من التحديثات'}</span>
          </button>

          {/* Action Button: Download & Apply New Files */}
          <button
            type="button"
            onClick={handleDownloadAndApply}
            disabled={isChecking || isUpdating || !repo.trim()}
            className={`w-full sm:flex-1 py-3.5 px-5 font-bold rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-md disabled:opacity-50 text-sm ${
              checkResult?.hasUpdate
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white ring-4 ring-blue-500/20'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {isUpdating ? (
              <>
                <RefreshCw size={17} className="animate-spin text-white" />
                <span>جاري تحميل وتثبيت الملفات...</span>
              </>
            ) : (
              <>
                <DownloadCloud size={18} />
                <span>تحميل وتثبيت الملفات الجديدة</span>
              </>
            )}
          </button>
        </div>

        {/* Update Logs Terminal / Execution History */}
        {updateLogs.length > 0 && (
          <div className="space-y-2 pt-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Terminal size={14} className="text-slate-500" />
                <span>سجل تحميل وتطبيق الملفات المباشر:</span>
              </span>
              {updateSuccess && (
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>اكتملت العملية بنجاح 100%</span>
                </span>
              )}
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto border border-slate-800 shadow-inner" dir="ltr">
              {updateLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-slate-500 select-none">[{log.time}]</span>
                  <span className="text-emerald-400">»</span>
                  <span className="text-slate-100 flex-1">{log.message}</span>
                </div>
              ))}
            </div>

            {updateSuccess && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>تم تطبيق كافة الملفات الجديدة بنجاح! يُنصح بإعادة تحميل الصفحة لتفعيل التغييرات.</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>إعادة تحميل المنظومة الآن</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Safety & Integrity Guarantee Footer */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 flex items-start sm:items-center gap-3 text-emerald-900 text-xs">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="leading-relaxed">
            <strong>ضمان سلامة البيانات:</strong> عملية تحديث المنظومة تتم بأمان تام في نفس المسار، ولا تمس إطلاقاً سجلات الموظفين أو قواعد البيانات أو النسخ الاحتياطية الخاصة بك.
          </div>
        </div>

      </div>
    </div>
  );
};

export default GitHubUpdate;
