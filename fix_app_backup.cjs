const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const backupHook = `
  useEffect(() => {
    const handleAutoBackup = () => {
      const { backupPath, setLastBackupDate } = useStore.getState();
      if (!backupPath) return;

      const data = localStorage.getItem('hr-system-storage-v4');
      if (!data) return;

      try {
        if (isElectronEnv()) {
           const fs = (window as any).require('fs');
           const path = (window as any).require('path');
           const backupFile = path.join(backupPath, 'hr-backup-auto.json');
           fs.writeFileSync(backupFile, data, 'utf-8');
           setLastBackupDate(new Date().toISOString());
        }
      } catch (e) {
        console.error('Auto backup failed', e);
      }
    };

    // Auto-backup on open
    handleAutoBackup();

    // Auto-backup on close
    window.addEventListener('beforeunload', handleAutoBackup);
    
    // Auto-backup on visibility change (e.g. minimizing app or switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAutoBackup();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleAutoBackup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
`;

file = file.replace(
  /const isElectron = isElectronEnv\(\);/,
  "const isElectron = isElectronEnv();\n" + backupHook
);

if (!file.includes("import { useEffect")) {
  file = file.replace(/import React, \{ useState/g, "import React, { useState, useEffect");
}

fs.writeFileSync('src/App.tsx', file);
