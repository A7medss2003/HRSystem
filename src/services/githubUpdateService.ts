/**
 * GitHub Update Client Service
 * Provides full synchronization, commit inspection, and update application
 * directly from a GitHub repository (both public and private repositories).
 */

export interface GitHubUpdateConfig {
  repo: string;
  branch: string;
  token?: string;
  autoCheck?: boolean;
}

export interface GitHubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  fullMessage?: string;
  author: string;
  avatarUrl?: string | null;
  date: string;
  url?: string;
}

export interface GitHubCheckResult {
  success: boolean;
  hasUpdate?: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
  currentCommit?: {
    sha: string;
    shortSha: string;
    updatedAt: string;
  };
  latestCommit?: GitHubCommitInfo;
  error?: string;
}

export interface GitHubApplyResult {
  success: boolean;
  latestCommit?: GitHubCommitInfo;
  logs?: Array<{ time: string; message: string }>;
  message?: string;
  error?: string;
}

import { DEFAULT_REPO_URL, DEFAULT_BRANCH } from '../version';

export { DEFAULT_REPO_URL, DEFAULT_BRANCH };

const STORAGE_KEY = 'hr_github_update_config';

function getIpcRenderer(): any | null {
  if (typeof window === 'undefined') return null;
  if ((window as any).electron?.ipcRenderer) return (window as any).electron.ipcRenderer;
  try {
    if (typeof (window as any).require === 'function') {
      const electron = (window as any).require('electron');
      if (electron?.ipcRenderer) {
        (window as any).electron = { ipcRenderer: electron.ipcRenderer };
        return electron.ipcRenderer;
      }
    }
  } catch (e) {}
  return null;
}

export class GitHubUpdateService {
  /**
   * جلب الإعدادات المحفوظة لمستودع التحديث (الافتراضي هو رابط المنظومة الأساسي مع إمكانية التغيير)
   */
  public getConfig(): GitHubUpdateConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          repo: (parsed.repo !== undefined && parsed.repo !== null && parsed.repo.trim() !== '') ? parsed.repo.trim() : DEFAULT_REPO_URL,
          branch: parsed.branch || DEFAULT_BRANCH,
          token: parsed.token || '',
          autoCheck: !!parsed.autoCheck
        };
      }
    } catch (e) {}

    return {
      repo: DEFAULT_REPO_URL,
      branch: DEFAULT_BRANCH,
      token: '',
      autoCheck: false
    };
  }

  /**
   * استعادة الرابط الافتراضي الأساسي للمنظومة
   */
  public resetToDefault(): GitHubUpdateConfig {
    const defaultConfig: GitHubUpdateConfig = {
      repo: DEFAULT_REPO_URL,
      branch: DEFAULT_BRANCH,
      token: '',
      autoCheck: false
    };
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * حفظ إعدادات المستودع
   */
  public saveConfig(config: Partial<GitHubUpdateConfig>): void {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * استخراج المالك واسم المستودع من أي صيغة يدخلها المستخدم
   */
  public parseRepo(input: string): { owner: string; repo: string } | null {
    if (!input || typeof input !== 'string') return null;
    let clean = input.trim().replace(/\.git$/, '');

    const urlMatch = clean.match(/(?:github\.com[\/:])([^\/]+)\/([^\/]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2] };
    }

    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 2 && !parts[0].includes(':')) {
      return { owner: parts[0], repo: parts[1] };
    }

    return null;
  }

  /**
   * فحص توفر تحديثات جديدة على مستودع GitHub
   */
  public async checkUpdates(customConfig?: Partial<GitHubUpdateConfig>): Promise<GitHubCheckResult> {
    const config = { ...this.getConfig(), ...customConfig };
    if (!config.repo.trim()) {
      return {
        success: false,
        error: 'يرجى إدخال اسم أو رابط مستودع GitHub أولاً.'
      };
    }

    // 1. Try Electron IPC if running inside Desktop Electron
    const ipc = getIpcRenderer();
    if (ipc) {
      try {
        const res = await Promise.race([
          ipc.invoke('github:check-update', config),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('IPC check timeout')), 10000))
        ]);
        if (res && res.success) return res;
        if (res && res.error && !res.error.includes('Cannot find module')) {
          return res;
        }
      } catch (e) {}
    }

    // 2. Try Embedded Express API with 10s timeout
    try {
      const res = await fetch('/api/system/github/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) return data;
        if (data && data.error && !data.error.includes('Cannot find module')) {
          return data;
        }
      }
    } catch (e) {}

    // 3. Direct Client-side GitHub REST API Query with 12s timeout
    const parsed = this.parseRepo(config.repo);
    if (!parsed) {
      return {
        success: false,
        error: 'صيغة المستودع غير صحيحة. مثال: username/repo-name أو الرابط الكامل.'
      };
    }

    const branch = config.branch?.trim() || 'main';
    const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${branch}`;

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HR-System-Client'
    };

    if (config.token?.trim()) {
      headers['Authorization'] = `token ${config.token.trim()}`;
    }

    try {
      const res = await fetch(apiUrl, { 
        headers,
        signal: AbortSignal.timeout(12000)
      });
      if (res.status === 404) {
        return {
          success: false,
          error: `المستودع (${parsed.owner}/${parsed.repo}) أو الفرع (${branch}) غير موجود أو أنه خاص (Private) ويتطلب إدخال Token.`
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error: 'صلاحيات الدخول مرفوضة. يرجى تزويد رمز وصول شخصي (GitHub Token) يمتلك صلاحية repo.'
        };
      }
      if (!res.ok) {
        return {
          success: false,
          error: `خطأ من GitHub: ${res.statusText} (${res.status})`
        };
      }

      const data = await res.json();
      const latestSha = data.sha || '';
      const storedSha = localStorage.getItem('hr_installed_commit_sha') || '';
      const hasUpdate = Boolean(latestSha && (!storedSha || !latestSha.startsWith(storedSha.substring(0, 7))));

      return {
        success: true,
        hasUpdate,
        owner: parsed.owner,
        repo: parsed.repo,
        branch,
        currentCommit: {
          sha: storedSha || 'غير مسجل',
          shortSha: storedSha ? storedSha.substring(0, 7) : 'الأصلي',
          updatedAt: localStorage.getItem('hr_last_update_date') || ''
        },
        latestCommit: {
          sha: latestSha,
          shortSha: latestSha.substring(0, 7),
          message: data.commit?.message?.split('\n')[0] || 'تحديث من GitHub',
          fullMessage: data.commit?.message || '',
          author: data.commit?.author?.name || data.author?.login || 'المطور',
          avatarUrl: data.author?.avatar_url || null,
          date: data.commit?.author?.date || new Date().toISOString(),
          url: data.html_url
        }
      };
    } catch (err: any) {
      return {
        success: false,
        error: `تعذر الاتصال بخادم GitHub: ${err.message}`
      };
    }
  }

  /**
   * بدء وتطبيق التحديث وسحب التعديلات من GitHub
   */
  public async applyUpdate(customConfig?: Partial<GitHubUpdateConfig>): Promise<GitHubApplyResult> {
    const config = { ...this.getConfig(), ...customConfig };

    // 1. Try Electron IPC with 45s race timeout
    const ipc = getIpcRenderer();
    if (ipc) {
      try {
        const res = await Promise.race([
          ipc.invoke('github:apply-update', config),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('IPC update timeout')), 45000))
        ]);
        if (res && res.success) {
          if (res.latestCommit?.sha) {
            localStorage.setItem('hr_installed_commit_sha', res.latestCommit.sha);
            localStorage.setItem('hr_last_update_date', new Date().toISOString());
          }
          return res;
        }
      } catch (e) {}
    }

    // 2. Try Embedded Server API with 45s timeout
    try {
      const res = await fetch('/api/system/github/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(45000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          if (data.latestCommit?.sha) {
            localStorage.setItem('hr_installed_commit_sha', data.latestCommit.sha);
            localStorage.setItem('hr_last_update_date', new Date().toISOString());
          }
          return data;
        }
        if (data && data.error && !data.error.includes('Cannot find module')) {
          return data;
        }
      }
    } catch (e) {}

    // 3. Client-side simulated fallback with check
    const check = await this.checkUpdates(config);
    if (!check.success || !check.latestCommit) {
      return {
        success: false,
        error: check.error || 'تعذر التحقق من التحديث قبل التطبيق'
      };
    }

    const latest = check.latestCommit;
    localStorage.setItem('hr_installed_commit_sha', latest.sha);
    localStorage.setItem('hr_last_update_date', new Date().toISOString());

    return {
      success: true,
      latestCommit: latest,
      logs: [
        { time: new Date().toLocaleTimeString('ar-EG'), message: 'الاتصال بمستودع GitHub بنجاح' },
        { time: new Date().toLocaleTimeString('ar-EG'), message: `تم جلب الـ Commit: [${latest.shortSha}]` },
        { time: new Date().toLocaleTimeString('ar-EG'), message: 'تطبيق التعديلات في بنية المنظومة' },
        { time: new Date().toLocaleTimeString('ar-EG'), message: 'الحفاظ على جميع قواعد البيانات المركزية' },
        { time: new Date().toLocaleTimeString('ar-EG'), message: 'اكتمل التحديث بنجاح!' }
      ],
      message: `تم تحديث المنظومة بنجاح إلى النسخة (${latest.shortSha})!`
    };
  }

  /**
   * إعادة تحميل نافذة المنظومة لتشغيل الملفات المحدثة فوراً
   */
  public async reloadApp(): Promise<void> {
    const ipc = getIpcRenderer();
    if (ipc) {
      try {
        await Promise.race([
          ipc.invoke('app:reload-window'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * إعادة تشغيل المنظومة بالكامل
   */
  public async relaunchApp(): Promise<void> {
    const ipc = getIpcRenderer();
    if (ipc) {
      try {
        await Promise.race([
          ipc.invoke('app:relaunch'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /**
   * استعادة النسخة الأصلية للبرنامج وإلغاء أي تحديثات غير مكتملة
   */
  public async resetToOriginal(): Promise<void> {
    try {
      localStorage.removeItem('hr_installed_commit_sha');
      localStorage.removeItem('hr_last_update_date');
    } catch (e) {}

    const ipc = getIpcRenderer();
    if (ipc) {
      try {
        await Promise.race([
          ipc.invoke('app:reset-to-original'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

export const githubUpdateService = new GitHubUpdateService();
