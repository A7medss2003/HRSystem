const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(
  /const handleLogout = \(\) => \{/,
  `const handleLogout = () => {
    // Auto-backup on logout
    const { backupPath, setLastBackupDate } = useStore.getState();
    if (backupPath && isElectronEnv()) {
      try {
        const data = localStorage.getItem('hr-system-storage-v4');
        if (data) {
           const fs = (window as any).require('fs');
           const path = (window as any).require('path');
           const backupFile = path.join(backupPath, 'hr-backup-auto.json');
           fs.writeFileSync(backupFile, data, 'utf-8');
           setLastBackupDate(new Date().toISOString());
        }
      } catch(e) {}
    }`
);

fs.writeFileSync('src/App.tsx', file);
