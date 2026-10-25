import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import { githubUpdateService } from '../services/githubUpdateService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToOriginal = async () => {
    try {
      localStorage.removeItem('hr_installed_commit_sha');
      localStorage.removeItem('hr_last_update_date');
    } catch (e) {}
    await githubUpdateService.resetToOriginal();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-6 font-sans select-none" 
          dir="rtl"
          style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}
        >
          <div className="max-w-lg w-full bg-white text-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle size={36} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              واجهت الواجهة خطأً غير متوقع
            </h2>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              حدث تعارض أو نقص في ملفات التحديث. نظام الحماية الذاتي منع تجمّد المنظومة وقام بالحفاظ على جميع بيانات الموظفين وسجلاتك المركزية بأمان تام 100%.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-100 rounded-xl p-3 text-xs font-mono text-slate-700 text-left mb-6 overflow-x-auto max-h-24 border border-slate-200" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>إعادة تحميل المنظومة</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToOriginal}
                className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
              >
                <ShieldCheck size={14} />
                <span>استعادة النسخة الأصلية السليمة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
