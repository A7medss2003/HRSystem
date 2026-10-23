/**
 * محرك النسخ الاحتياطي التلقائي المزدوج (Dual-Redundant Live Auto-Backup)
 * يقوم بحفظ وتحديث نسخة احتياطية فورية في المسار المعتمد/المختار مسبقاً
 * مع كل عملية إضافة أو تعديل أو حفظ في المنظومة بشكل صامت ومستمر،
 * دون الحاجة لأي تدخل يدوي من المستخدم أو المدير.
 */

export const DEFAULT_BACKUP_PATH = 'D:\\HR_Backup';

export function isElectronEnv(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).require);
}

export function getStoredBackupPath(): string {
  try {
    const raw = localStorage.getItem('hr-backup-path-saved');
    if (raw && raw.trim()) return raw.trim();

    // Check zustand storage
    const zustandData = localStorage.getItem('hr-system-storage-v4');
    if (zustandData) {
      const parsed = JSON.parse(zustandData);
      if (parsed?.state?.backupPath) return parsed.state.backupPath;
    }
  } catch (e) {}

  return DEFAULT_BACKUP_PATH;
}

export function setStoredBackupPath(pathStr: string) {
  if (!pathStr) return;
  try {
    localStorage.setItem('hr-backup-path-saved', pathStr.trim());
  } catch (e) {}
}

/**
 * تنفيذ النسخ الاحتياطي المتزامن في نفس اللحظة
 */
export function executeLiveAutoBackup(store: any): { success: boolean; path: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  let targetPath = DEFAULT_BACKUP_PATH;

  try {
    const state = typeof store.getState === 'function' ? store.getState() : store;
    targetPath = state?.backupPath || getStoredBackupPath() || DEFAULT_BACKUP_PATH;
    setStoredBackupPath(targetPath);

    // 1. Get complete serialized data
    const rawStorage = localStorage.getItem('hr-system-storage-v4');
    const backupContent = rawStorage || JSON.stringify({ state, version: 4 }, null, 2);

    // 2. Save redundant snapshot in browser localStorage
    try {
      localStorage.setItem('hr-backup-mirror-v4', backupContent);
      localStorage.setItem('hr-last-auto-backup-time', timestamp);
    } catch (lsErr) {}

    // 3. If running in Electron Desktop App, write directly to local file system
    if (isElectronEnv()) {
      try {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');

        // Ensure directory exists
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }

        // Write primary auto-backup file
        const mainBackupFile = path.join(targetPath, 'hr-backup-auto.json');
        fs.writeFileSync(mainBackupFile, backupContent, 'utf-8');

        // Write rolling daily backup file
        const dateStr = timestamp.split('T')[0];
        const dailyFile = path.join(targetPath, `hr-backup-${dateStr}.json`);
        fs.writeFileSync(dailyFile, backupContent, 'utf-8');

        // Also write internal app backup in userData as second safety net
        try {
          const { app } = (window as any).require('@electron/remote') || (window as any).require('electron');
          if (app && app.getPath) {
            const internalDir = path.join(app.getPath('userData'), 'backups');
            if (!fs.existsSync(internalDir)) fs.mkdirSync(internalDir, { recursive: true });
            fs.writeFileSync(path.join(internalDir, 'hr-backup-auto.json'), backupContent, 'utf-8');
          }
        } catch (e) {}
      } catch (fsErr) {
        console.warn('Direct Electron disk backup write warning:', fsErr);
      }
    }

    // 4. Update last backup date in store silently without disrupting UI
    if (typeof state?.setLastBackupDate === 'function') {
      state.setLastBackupDate(timestamp);
    }

    return { success: true, path: targetPath, timestamp };
  } catch (err) {
    console.error('executeLiveAutoBackup error:', err);
    return { success: false, path: targetPath, timestamp };
  }
}
