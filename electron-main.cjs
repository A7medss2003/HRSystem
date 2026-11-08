const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

// إعداد هوية التطبيق في ويندوز لمنع تكرار أيقونات شريط المهام
app.setAppUserModelId('com.hrsystem.app');
app.setName('HR System');

// دالة لفحص وتصنيف كروت الشبكة وتمييز كرت الإيثرنت السلكي
function getNetworkInterfacesInfo() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    const list = nets[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) {
        const lowerName = name.toLowerCase();
        const isEthernet = lowerName.includes('ethernet') || 
                           lowerName.includes('eth') || 
                           lowerName.includes('en') || 
                           lowerName.includes('lan') || 
                           lowerName.includes('gigabit') ||
                           lowerName.includes('realtek') ||
                           lowerName.includes('intel') ||
                           lowerName.includes('سلكي') ||
                           lowerName.includes('ايثرنت');
        const isWifi = lowerName.includes('wi-fi') || 
                       lowerName.includes('wifi') || 
                       lowerName.includes('wireless') || 
                       lowerName.includes('wlan') ||
                       lowerName.includes('لاسلكي');

        results.push({
          name,
          ip: net.address,
          mac: net.mac,
          type: isEthernet ? 'ethernet' : (isWifi ? 'wifi' : 'other'),
          isEthernet
        });
      }
    }
  }

  const eth = results.find(r => r.isEthernet);
  const wifi = results.find(r => r.type === 'wifi');

  return {
    interfaces: results,
    ethernetIp: eth ? eth.ip : (results[0] ? results[0].ip : '192.168.1.1'),
    wifiIp: wifi ? wifi.ip : null,
    port: 3000,
    hostName: os.hostname(),
    isHost: true
  };
}

// دالة لتشغيل سيرفر مدمج خفيف لمشاركة المنظومة مع الجهاز المتصل بكابل الإيثرنت
let embeddedServer = null;
let centralDbCache = null;

function getCentralDbFile() {
  return path.join(app.getPath('userData'), 'hr-central-database.json');
}

// دوال آمنة لتحميل وحدات الخادم سواء في بيئة التطوير أو داخل حزمة Electron بعد التثبيت (app.asar)
function loadGitHubUpdater() {
  const candidates = [];
  try {
    const uData = app.getPath('userData');
    candidates.push(path.join(uData, 'app_update', 'src', 'server', 'githubUpdater.cjs'));
    candidates.push(path.join(uData, 'app_update', 'githubUpdater.cjs'));
  } catch (e) {}

  candidates.push(
    path.join(__dirname, 'src', 'server', 'githubUpdater.cjs'),
    path.join(__dirname, 'githubUpdater.cjs'),
    path.resolve(process.cwd(), 'src', 'server', 'githubUpdater.cjs'),
    path.resolve(process.cwd(), 'githubUpdater.cjs'),
    './src/server/githubUpdater.cjs',
    './githubUpdater.cjs'
  );

  for (const target of candidates) {
    try {
      if (typeof target === 'string' && (fs.existsSync(target) || !path.isAbsolute(target))) {
        return require(target);
      }
    } catch (e) {}
  }
  return require('./src/server/githubUpdater.cjs');
}

function loadScannerDriver() {
  const candidates = [];
  try {
    const uData = app.getPath('userData');
    candidates.push(path.join(uData, 'app_update', 'src', 'server', 'scannerDriver.cjs'));
    candidates.push(path.join(uData, 'app_update', 'scannerDriver.cjs'));
  } catch (e) {}

  candidates.push(
    path.join(__dirname, 'src', 'server', 'scannerDriver.cjs'),
    path.join(__dirname, 'scannerDriver.cjs'),
    path.resolve(process.cwd(), 'src', 'server', 'scannerDriver.cjs'),
    path.resolve(process.cwd(), 'scannerDriver.cjs'),
    './src/server/scannerDriver.cjs',
    './scannerDriver.cjs'
  );

  for (const target of candidates) {
    try {
      if (typeof target === 'string' && (fs.existsSync(target) || !path.isAbsolute(target))) {
        return require(target);
      }
    } catch (e) {}
  }
  return require('./src/server/scannerDriver.cjs');
}

function semverCompare(v1, v2) {
  const p1 = (v1 || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((p1[i] || 0) > (p2[i] || 0)) return 1;
    if ((p1[i] || 0) < (p2[i] || 0)) return -1;
  }
  return 0;
}

function isValidDist(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return false;
    const indexPath = path.join(dirPath, 'index.html');
    if (!fs.existsSync(indexPath)) return false;
    const stat = fs.statSync(indexPath);
    if (stat.size < 200) return false;

    // Verify all scripts referenced in index.html physically exist and are non-empty
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const scriptMatches = indexContent.match(/src=["']([^"']+\.js)["']/g) || [];
    for (const match of scriptMatches) {
      const src = match.replace(/src=["']/, '').replace(/["']$/, '');
      const cleanSrc = src.replace(/^\.\//, '').replace(/^\//, '');
      const jsPath = path.join(dirPath, cleanSrc);
      if (!fs.existsSync(jsPath) || fs.statSync(jsPath).size < 1000) {
        console.warn('isValidDist: script referenced in index.html is missing or empty:', jsPath);
        return false;
      }
    }

    const assetsPath = path.join(dirPath, 'assets');
    if (!fs.existsSync(assetsPath)) return false;
    const files = fs.readdirSync(assetsPath);
    const hasJsBundle = files.some(f => f.endsWith('.js') && fs.statSync(path.join(assetsPath, f)).size > 20000);
    return hasJsBundle;
  } catch (e) {
    return false;
  }
}

function getAppDistPath() {
  try {
    const updateBase = path.join(app.getPath('userData'), 'app_update');
    const updatedDist = path.join(updateBase, 'dist');
    const localDist = path.join(__dirname, 'dist');
    const isLocalValid = isValidDist(localDist);

    // Read version metadata of current packaged binary
    let currentAppVersion = '1.3.0';
    try {
      currentAppVersion = app.getVersion();
    } catch (e) {}

    // Check version metadata of update folder if exists
    let updateVersion = null;
    const versionFile = path.join(updateBase, 'version.json');
    if (fs.existsSync(versionFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
        updateVersion = meta.version;
      } catch (e) {}
    }

    // CRITICAL: If the installed app version is >= update cache, or if the update folder has no valid version metadata,
    // then the newly installed app is newer! Purge the old update folder to avoid running stale or broken files.
    if (fs.existsSync(updateBase) && isLocalValid) {
      if (!updateVersion || semverCompare(currentAppVersion, updateVersion) >= 0) {
        console.log(`Installed app (${currentAppVersion}) >= update folder (${updateVersion || 'none'}). Clearing obsolete update cache...`);
        try { fs.rmSync(updateBase, { recursive: true, force: true }); } catch (e) {}
        return localDist;
      }
    }

    const isUpdatedValid = isValidDist(updatedDist);

    if (isUpdatedValid && isLocalValid) {
      if (updateVersion && semverCompare(updateVersion, currentAppVersion) > 0) {
        console.log(`Running from newer in-place update (${updateVersion}):`, updatedDist);
        return updatedDist;
      }
      return localDist;
    } else if (isLocalValid) {
      if (fs.existsSync(updateBase)) {
        console.warn('Update dist invalid or corrupt. Purging broken update folder...');
        try { fs.rmSync(updateBase, { recursive: true, force: true }); } catch (rmErr) {}
      }
      return localDist;
    } else if (isUpdatedValid) {
      return updatedDist;
    }
  } catch (e) {
    console.error('Error determining dist path:', e);
  }
  return path.join(__dirname, 'dist');
}

function startLanServer(port = 3000) {
  try {
    const express = require('express');
    const serverApp = express();
    serverApp.use(express.json({ limit: '50mb' }));

    serverApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    serverApp.get('/api/network-interfaces', (req, res) => {
      res.json(getNetworkInterfacesInfo());
    });

    serverApp.get('/api/server-status', (req, res) => {
      res.json({
        running: true,
        port: port,
        hostName: os.hostname(),
        role: 'host',
        lastSync: new Date().toISOString()
      });
    });

    // Native Scanner Hardware Interface Endpoints (WIA / TWAIN / SANE)
    serverApp.get('/api/scanner/devices', async (req, res) => {
      try {
        const { detectLocalScanners } = loadScannerDriver();
        const devices = await detectLocalScanners();
        res.json({ success: true, devices });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    serverApp.post('/api/scanner/scan', async (req, res) => {
      try {
        const { acquireScanFromDevice } = loadScannerDriver();
        const result = await acquireScanFromDevice(req.body);
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    serverApp.get('/api/scanner/status', (req, res) => {
      res.json({
        success: true,
        platform: os.platform(),
        wiaSupported: os.platform() === 'win32',
        saneSupported: os.platform() === 'linux',
        twainSupported: true
      });
    });

    // GitHub In-App System Updater Endpoints
    serverApp.post('/api/system/github/check', async (req, res) => {
      try {
        const { checkGitHubUpdate } = loadGitHubUpdater();
        const result = await checkGitHubUpdate(req.body || {});
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    serverApp.post('/api/system/github/apply', async (req, res) => {
      try {
        const { applyGitHubUpdate } = loadGitHubUpdater();
        const result = await applyGitHubUpdate(req.body || {});
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    serverApp.get('/api/system/github/version', (req, res) => {
      try {
        const { getStoredVersion } = loadGitHubUpdater();
        res.json({ success: true, version: getStoredVersion() });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    serverApp.get('/api/sync/data', (req, res) => {
      res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
      try {
        const p = getCentralDbFile();
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          return res.json({ success: true, data: JSON.parse(content), timestamp: new Date().toISOString() });
        }
      } catch (e) {}
      res.json({ success: true, data: centralDbCache, timestamp: new Date().toISOString() });
    });

    serverApp.post('/api/sync/data', (req, res) => {
      try {
        const payload = req.body;
        centralDbCache = payload;
        const p = getCentralDbFile();
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(payload, null, 2), 'utf8');

        // Automatic mirror backup to previously selected backupPath
        const bPath = payload.backupPath || (payload.state && payload.state.backupPath);
        if (bPath && typeof bPath === 'string') {
          try {
            if (!fs.existsSync(bPath)) {
              fs.mkdirSync(bPath, { recursive: true });
            }
            const autoBackupFile = path.join(bPath, 'hr-backup-auto.json');
            fs.writeFileSync(autoBackupFile, JSON.stringify(payload, null, 2), 'utf8');
            
            const dateStr = new Date().toISOString().split('T')[0];
            const dailyBackupFile = path.join(bPath, `hr-backup-${dateStr}.json`);
            fs.writeFileSync(dailyBackupFile, JSON.stringify(payload, null, 2), 'utf8');
          } catch (bErr) {
            console.warn('Mirror backup write to path failed:', bErr.message);
          }
        }

        // Secondary internal safety backup in userData/backups
        try {
          const fallbackBackupDir = path.join(app.getPath('userData'), 'backups');
          if (!fs.existsSync(fallbackBackupDir)) {
            fs.mkdirSync(fallbackBackupDir, { recursive: true });
          }
          fs.writeFileSync(path.join(fallbackBackupDir, 'hr-backup-auto.json'), JSON.stringify(payload, null, 2), 'utf8');
        } catch (fbErr) {}

        return res.json({ success: true, timestamp: new Date().toISOString() });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    });

    serverApp.use((req, res, next) => {
      const activeDist = getAppDistPath();
      if (fs.existsSync(activeDist)) {
        express.static(activeDist, {
          etag: false,
          maxAge: 0,
          setHeaders: (r) => {
            r.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          }
        })(req, res, next);
      } else {
        next();
      }
    });

    serverApp.get('*', (req, res) => {
      const activeDist = getAppDistPath();
      if (fs.existsSync(path.join(activeDist, 'index.html'))) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.sendFile(path.join(activeDist, 'index.html'));
      }
      res.status(404).send('HR System Frontend Not Ready');
    });

    embeddedServer = serverApp.listen(port, '0.0.0.0', () => {
      console.log(`HR System Ethernet LAN Server running at http://0.0.0.0:${port}`);
    });

    embeddedServer.on('error', (err) => {
      console.warn(`LAN Server port ${port} busy or error:`, err.message);
    });
  } catch (err) {
    console.error('Failed to start embedded LAN server:', err);
  }
}

// حماية التشغيل الأحادي: منع فتح نسختين من البرنامج في نفس الوقت
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  // إذا كان البرنامج مفتوحاً مسبقاً، نغلق النسخة الجديدة ونكتفي بتنشيط النسخة المفتوحة
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// دالة لترحيل البيانات من المجلدات القديمة إن وجدت
function migrateOldUserData() {
  try {
    const currentDataPath = app.getPath('userData');
    const roaming = path.dirname(currentDataPath);
    const oldDataPath = path.join(roaming, 'react-example');
    
    if (fs.existsSync(oldDataPath) && oldDataPath !== currentDataPath) {
      const oldStorage = path.join(oldDataPath, 'Local Storage');
      const newStorage = path.join(currentDataPath, 'Local Storage');
      if (fs.existsSync(oldStorage) && !fs.existsSync(newStorage)) {
        fs.cpSync(oldDataPath, currentDataPath, { recursive: true });
        console.log('Successfully migrated old user data to HR System');
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// إعدادات التحديث التلقائي
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    autoHideMenuBar: true,
    transparent: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: true
    }
  });
  
  // إزالة الشريط العلوي تماماً
  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize(); // جعلها ملء الشاشة

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // تمكين اختصارات الدعم الفني: F12 لفتح أدوات المطورين، و Ctrl+F5 لإعادة التحميل التام
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if ((input.control && input.key.toLowerCase() === 'r') || input.key === 'F5') {
      mainWindow.webContents.reload();
      event.preventDefault();
    }
    // Ctrl+Shift+R: تنظيف ذاكرة التحديث واستعادة النسخة الأصلية فوراً
    if (input.control && input.shift && input.key.toLowerCase() === 'r') {
      console.log('Emergency reset triggered via shortcut...');
      try {
        const updateBase = path.join(app.getPath('userData'), 'app_update');
        if (fs.existsSync(updateBase)) {
          fs.rmSync(updateBase, { recursive: true, force: true });
        }
      } catch (e) {}
      const fallbackPath = path.join(__dirname, 'dist', 'index.html');
      mainWindow.loadFile(fallbackPath);
      event.preventDefault();
    }
  });

  // الحماية القصوى من الشاشة البيضاء: عند فشل تحميل الواجهة من مجلد التحديثات
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`Window failed to load (${errorCode}): ${errorDescription}. Purging update cache and falling back to pristine local dist...`);
    try {
      const updateBase = path.join(app.getPath('userData'), 'app_update');
      if (fs.existsSync(updateBase)) {
        fs.rmSync(updateBase, { recursive: true, force: true });
      }
    } catch (e) {}
    const fallbackPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(fallbackPath) && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(fallbackPath);
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.warn('Renderer process crashed or terminated:', details);
    try {
      const updateBase = path.join(app.getPath('userData'), 'app_update');
      if (fs.existsSync(updateBase)) {
        fs.rmSync(updateBase, { recursive: true, force: true });
      }
    } catch (e) {}
    const fallbackPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(fallbackPath) && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(fallbackPath);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const distPath = getAppDistPath();
    const targetHtml = path.join(distPath, 'index.html');
    mainWindow.loadFile(targetHtml).catch(err => {
      console.warn('Failed to load target index.html, loading pristine local dist:', err.message);
      const fallbackPath = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(fallbackPath)) {
        mainWindow.loadFile(fallbackPath);
      }
    });
  }
}


// دالة للبحث عن التحديثات في الأقراص المحمولة (USB)
function checkForUSBUpdates(isManual = false) {
  const drives = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let updateFoundPath = null;

  for (const drive of drives) {
    const checkPath = `${drive}:\\HR_Update`;
    const ymlPath = path.join(checkPath, 'latest.yml');
    
    if (fs.existsSync(ymlPath)) {
      updateFoundPath = checkPath;
      break; 
    }
  }

  if (updateFoundPath) {
    const feedUrl = `file:///${updateFoundPath.replace(/\\/g, '/')}`;
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: feedUrl
    });
    
    autoUpdater.checkForUpdates().catch(err => {
      if (isManual) {
        dialog.showMessageBox({
          type: 'warning',
          title: 'تنبيه التحديث',
          message: `تعذر فحص التحديثات: ${err.message || 'حدث خطأ غير متوقع'}`,
          buttons: ['موافق']
        });
      }
    });
  } else if (isManual) {
    dialog.showMessageBox({
      type: 'info',
      title: 'فحص التحديثات من الفلاشة',
      message: 'لم يتم العثور على قرص USB يحتوي على مجلد HR_Update مع ملف latest.yml.\n\nيرجى توصيل الفلاشة والتأكد من نسخ مجلد التحديثات بداخلها ثم المحاولة مرة أخرى.',
      buttons: ['موافق']
    });
  }
}

// IPC Handlers for window controls and update check
ipcMain.on('check-for-updates', () => {
  checkForUSBUpdates(true);
});

ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('window-min', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-max', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('get-network-interfaces-info', () => {
  return getNetworkInterfacesInfo();
});

ipcMain.handle('print-html-document', async (event, { html, title }) => {
  return new Promise((resolve) => {
    let printWin = new BrowserWindow({
      show: false,
      title: title || 'طباعة ملف الموظف',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    printWin.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        if (!printWin || printWin.isDestroyed()) {
          return resolve({ success: false });
        }
        printWin.webContents.print(
          {
            silent: false,
            printBackground: true,
            color: true,
            margins: { marginType: 'none' }
          },
          (success, failureReason) => {
            if (printWin && !printWin.isDestroyed()) {
              printWin.close();
            }
            printWin = null;
            resolve({ success, failureReason });
          }
        );
      }, 400);
    });

    printWin.webContents.on('did-fail-load', () => {
      if (printWin && !printWin.isDestroyed()) printWin.close();
      printWin = null;
      resolve({ success: false, failureReason: 'فشل تحميل محتوى الطباعة' });
    });
  });
});

// Helper to locate NAPS2.Console.exe in all standard and portable locations
function findNaps2CliPath() {
  const electronApp = app;
  let appPath = '';
  try {
    appPath = electronApp && typeof electronApp.getAppPath === 'function' ? electronApp.getAppPath() : process.cwd();
  } catch (e) {
    appPath = process.cwd();
  }

  const candidates = [
    path.join(__dirname, 'bin', 'NAPS2.Console.exe'),
    path.join(process.cwd(), 'bin', 'NAPS2.Console.exe'),
    path.join(appPath, 'bin', 'NAPS2.Console.exe'),
    path.join(process.resourcesPath || '', 'bin', 'NAPS2.Console.exe'),
    'C:\\Program Files\\NAPS2\\NAPS2.Console.exe',
    'C:\\Program Files (x86)\\NAPS2\\NAPS2.Console.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'NAPS2', 'NAPS2.Console.exe')
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (e) {}
  }
  return null;
}

// 1. IPC Handler to list all connected scanners & printers dynamically (Global Standard Architecture)
ipcMain.handle('get-scanners-list', async () => {
  return new Promise(async (resolve) => {
    const devicesSet = new Set();
    const naps2Path = findNaps2CliPath();

    // Strategy 1: NAPS2.Console.exe CLI (--list, --driver wia --list, --driver twain --list)
    if (naps2Path) {
      await new Promise((done) => {
        exec(`"${naps2Path}" --list`, { timeout: 5000 }, (error, stdout) => {
          if (!error && stdout) {
            stdout.split('\n')
              .map(l => l.trim())
              .filter(l => l.length > 0 && !l.startsWith('Driver') && !l.startsWith('-'))
              .forEach(name => devicesSet.add(name));
          }
          done();
        });
      });
    }

    // Strategy 2: Multi-layer Windows Scanning Hardware Discovery (WIA, TWAIN 32/64, PnP, Registry, Printers)
    if (os.platform() === 'win32') {
      await new Promise((done) => {
        const psScript = `powershell -NoProfile -ExecutionPolicy Bypass -Command "
          $devs = @();
          
          # 1. WIA DeviceManager
          try {
            $wia = New-Object -ComObject WIA.DeviceManager;
            foreach ($d in $wia.DeviceInfos) {
              $name = $d.Properties.Item('Name').Value;
              if ($name) { $devs += $name; }
            }
          } catch {}

          # 2. Windows TWAIN Drivers in System32 / Windows
          try {
            if (Test-Path 'C:\\Windows\\twain_32') {
              Get-ChildItem -Path 'C:\\Windows\\twain_32' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                if ($_.Name -and $_.Name -ne 'wiatwain') { $devs += $_.Name; }
              }
            }
            if (Test-Path 'C:\\Windows\\twain_64') {
              Get-ChildItem -Path 'C:\\Windows\\twain_64' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                if ($_.Name) { $devs += $_.Name; }
              }
            }
          } catch {}

          # 3. Windows Imaging Devices Hardware Class Registry
          try {
            $regPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{6bdd1fc6-810f-11d0-bec7-08002be2092f}';
            if (Test-Path $regPath) {
              Get-ChildItem -Path $regPath -ErrorAction SilentlyContinue | ForEach-Object {
                $desc = (Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue).DriverDesc;
                if ($desc) { $devs += $desc; }
              }
            }
          } catch {}

          # 4. Plug and Play Imaging & USB Scanners
          try {
            Get-CimInstance Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object { 
              $_.PNPClass -eq 'Image' -or $_.Service -like '*usbscan*' -or $_.Service -like '*wia*' 
            } | ForEach-Object {
              if ($_.Name) { $devs += $_.Name; }
            }
          } catch {}

          # 5. Connected Printers & Multifunction Scan Devices
          try {
            Get-CimInstance Win32_Printer -ErrorAction SilentlyContinue | ForEach-Object {
              if ($_.Name -and $_.Name -notlike '*OneNote*' -and $_.Name -notlike '*Fax*' -and $_.Name -notlike '*Microsoft Print*') {
                $devs += $_.Name;
              }
            }
          } catch {}

          $devs | Sort-Object -Unique | ForEach-Object { Write-Output $_ };
        "`;

        exec(psScript, { timeout: 6000 }, (error, stdout) => {
          if (!error && stdout) {
            stdout.split('\n')
              .map(l => l.trim())
              .filter(Boolean)
              .forEach(name => devicesSet.add(name));
          }
          done();
        });
      });
    } else if (os.platform() === 'linux') {
      // SANE scanimage
      await new Promise((done) => {
        exec('scanimage -L', { timeout: 4000 }, (error, stdout) => {
          if (!error && stdout) {
            const matches = stdout.match(/device `([^']+)' is a ([^ \r\n]+) ([^\r\n]+)/g);
            if (matches) {
              matches.forEach(m => {
                const parts = m.match(/device `([^']+)' is a ([^ \r\n]+) ([^\r\n]+)/);
                if (parts) devicesSet.add(`${parts[2]} ${parts[3]}`);
              });
            }
          }
          done();
        });
      });
    }

    // Always include universal standard hardware targets so user is never locked out
    const finalDevices = Array.from(devicesSet);
    resolve(finalDevices);
  });
});

// 2. IPC Handler to invoke the Windows Native CommonDialog Scanner Picker
ipcMain.handle('select-scanner-dialog', async () => {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      return resolve({ success: false, error: 'نافذة ويندوز الرسمية متاحة فقط على أنظمة Windows' });
    }

    const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "
      try {
        $dialog = New-Object -ComObject WIA.CommonDialog;
        $device = $dialog.ShowSelectDevice(1, $true);
        if ($device) {
          $name = $device.Properties.Item('Name').Value;
          Write-Output ('SELECTED:' + $name);
        } else {
          Write-Output 'CANCELED';
        }
      } catch {
        Write-Output ('ERROR:' + $_.Exception.Message);
      }
    "`;

    exec(psCmd, { timeout: 60000 }, (error, stdout) => {
      if (stdout && stdout.includes('SELECTED:')) {
        const scannerName = stdout.split('SELECTED:')[1].trim().split('\n')[0].trim();
        return resolve({ success: true, scannerName });
      }
      if (stdout && stdout.includes('CANCELED')) {
        return resolve({ success: false, canceled: true, error: 'تم إلغاء الاختيار من نافذة ويندوز' });
      }
      return resolve({ success: false, error: 'تعذر فتح نافذة ويندوز (تأكد من توصيل كابل السكانر وتشغيله)' });
    });
  });
});

// 3. IPC Handler to execute scanning using a SPECIFIC device name selected by user (Pure Native WIA Architecture)
ipcMain.handle('scan-from-device', async (event, scannerName) => {
  return new Promise(async (resolve, reject) => {
    const isGenericDefault = !scannerName || 
      scannerName.includes('الافتراضي') || 
      scannerName.toLowerCase().includes('default') ||
      scannerName.includes('منفذ USB') ||
      scannerName.includes('طابعة متعددة');

    // Strategy 1: Pure Native WIA via PowerShell COM (Direct Windows Image Acquisition)
    if (os.platform() === 'win32') {
      const outputPath = path.join(app.getPath('temp') || os.tmpdir(), `hr_scan_${Date.now()}.jpg`);
      const escapedPath = outputPath.replace(/\\/g, '\\\\');
      const escapedName = (scannerName || '').replace(/"/g, '`"');

      const psCommand = `
        $deviceManager = New-Object -ComObject WIA.DeviceManager;
        $targetDevice = $null;

        if ("${isGenericDefault ? '' : escapedName}" -ne "") {
          foreach ($info in $deviceManager.DeviceInfos) {
            if ($info.Properties("Name").Value -eq "${escapedName}" -or $info.Properties.Item("Name").Value -eq "${escapedName}") {
              $targetDevice = $info.Connect();
              break;
            }
          }
        }

        # Fallback to first available WIA Scanner if not found by exact name or generic default selected
        if (-not $targetDevice) {
          foreach ($info in $deviceManager.DeviceInfos) {
            if ($info.Type -eq 1) {
              $targetDevice = $info.Connect();
              break;
            }
          }
        }

        if (-not $targetDevice) {
          Write-Error "Scanner device not found or disconnected";
          exit 1;
        }

        $item = $targetDevice.Items[1];
        $image = $item.Transfer("{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}");
        $image.SaveFile("${escapedPath}");
      `;

      exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/\r?\n/g, ' ')}"`, { timeout: 60000 }, (error, stdout, stderr) => {
        if (!error && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 100) {
          try {
            const fileBuffer = fs.readFileSync(outputPath);
            try { fs.unlinkSync(outputPath); } catch(e) {}
            return resolve({
              success: true,
              data: fileBuffer.toString('base64'),
              mimeType: 'image/jpeg',
              dataUrl: `data:image/jpeg;base64,${fileBuffer.toString('base64')}`
            });
          } catch (readErr) {
            console.error('Error reading scanned JPEG:', readErr);
          }
        }

        // Secondary fallback to NAPS2 / scannerDriver if native WIA PowerShell had an issue
        runFallbackScanners();
      });
      return;
    }

    runFallbackScanners();

    async function runFallbackScanners() {
      const naps2Path = findNaps2CliPath();
      const outputFilePath = path.join(app.getPath('userData') || os.tmpdir(), `scan_${Date.now()}.pdf`);

      if (naps2Path) {
        const command = !isGenericDefault
          ? `"${naps2Path}" -n "${scannerName}" -o "${outputFilePath}" --force`
          : `"${naps2Path}" -o "${outputFilePath}" --force`;

        exec(command, { timeout: 45000 }, (error, stdout, stderr) => {
          if (!error && fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 100) {
            try {
              const fileBuffer = fs.readFileSync(outputFilePath);
              try { fs.unlinkSync(outputFilePath); } catch (e) {}
              return resolve({
                success: true,
                data: fileBuffer.toString('base64'),
                mimeType: 'application/pdf',
                dataUrl: `data:application/pdf;base64,${fileBuffer.toString('base64')}`
              });
            } catch (readErr) {}
          }
          fallbackDriverScan();
        });
      } else {
        fallbackDriverScan();
      }
    }

    async function fallbackDriverScan() {
      try {
        const { acquireScanFromDevice } = loadScannerDriver();
        const res = await acquireScanFromDevice({ 
          deviceName: isGenericDefault ? '' : scannerName 
        });
        if (res && res.success) {
          return resolve(res);
        } else {
          return reject({ 
            success: false, 
            error: res?.error || 'فشل الاتصال بالجهاز المحدد. تأكد من توصيل كابل USB وتشغيل الماسح وتثبيت تعريفاته.' 
          });
        }
      } catch (err) {
        return reject({ 
          success: false, 
          error: err.message || 'فشل الاتصال بجهاز الماسح الضوئي.' 
        });
      }
    }
  });
});

// IPC Handlers for System Peripheral Scanner Driver (WIA / TWAIN / SANE)
ipcMain.handle('scanner:list-devices', async () => {
  try {
    const { detectLocalScanners } = loadScannerDriver();
    return await detectLocalScanners();
  } catch (err) {
    console.error('IPC scanner:list-devices error:', err);
    return [];
  }
});

ipcMain.handle('scanner:scan-document', async (event, options) => {
  try {
    const { acquireScanFromDevice } = loadScannerDriver();
    return await acquireScanFromDevice(options);
  } catch (err) {
    console.error('IPC scanner:scan-document error:', err);
    return { success: false, error: err.message };
  }
});

// Exact IPC Handler from User's Reference Specification ('scan-document')
ipcMain.handle('scan-document', async (event, options = {}) => {
  try {
    const { acquireScanFromDevice } = loadScannerDriver();
    const result = await acquireScanFromDevice({
      deviceId: options.deviceId,
      resolution: options.dpi || 300,
      colorMode: options.colorMode || 'color',
      format: options.format || 'pdf'
    });

    if (result && result.success) {
      return {
        success: true,
        data: result.data,
        mimeType: result.mimeType || 'application/pdf',
        dataUrl: result.dataUrl
      };
    } else {
      return {
        success: false,
        error: result?.error || 'تعذر الاتصال بالماسح الضوئي. يرجى التأكد من توصيل الجهاز وتثبيت برامج التشغيل.'
      };
    }
  } catch (err) {
    console.error('IPC scan-document error:', err);
    return {
      success: false,
      error: err.message || 'حدث خطأ أثناء تشغيل الماسح الضوئي'
    };
  }
});

ipcMain.handle('scanner:get-system-status', () => {
  return {
    platform: os.platform(),
    wiaSupported: os.platform() === 'win32',
    saneSupported: os.platform() === 'linux',
    twainSupported: true
  };
});

// --- GitHub In-App Updater IPC Handlers ---
ipcMain.handle('github:check-update', async (event, config) => {
  try {
    const { checkGitHubUpdate } = loadGitHubUpdater();
    return await checkGitHubUpdate(config || {});
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:apply-update', async (event, config) => {
  try {
    const { applyGitHubUpdate } = loadGitHubUpdater();
    return await applyGitHubUpdate(config || {});
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('github:get-version', () => {
  try {
    const { getStoredVersion } = loadGitHubUpdater();
    return getStoredVersion();
  } catch (err) {
    return null;
  }
});

ipcMain.handle('app:reload-window', () => {
  try {
    if (mainWindow) {
      setTimeout(async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            mainWindow.reload();
          } else {
            const distPath = getAppDistPath();
            const targetIndex = path.join(distPath, 'index.html');
            console.log('Reloading active window from:', targetIndex);
            try {
              await mainWindow.webContents.session.clearCache();
              await mainWindow.webContents.session.clearStorageData({ storages: ['cachestorage', 'appcache', 'shadercache'] });
            } catch (cErr) {}
            mainWindow.loadFile(targetIndex);
          }
        } catch (e) {
          mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        }
      }, 100);
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
  return { success: false };
});

ipcMain.handle('app:relaunch', () => {
  try {
    app.relaunch();
    setTimeout(() => {
      app.exit(0);
    }, 200);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:reset-to-original', () => {
  try {
    const updateDir = path.join(app.getPath('userData'), 'app_update');
    if (fs.existsSync(updateDir)) {
      try { fs.rmSync(updateDir, { recursive: true, force: true }); } catch (e) {}
    }
    const versionFile = path.join(app.getPath('userData'), 'github-version.json');
    if (fs.existsSync(versionFile)) {
      try { fs.rmSync(versionFile, { force: true }); } catch (e) {}
    }
    if (mainWindow) {
      setTimeout(async () => {
        try {
          await mainWindow.webContents.session.clearCache();
          await mainWindow.webContents.session.clearStorageData({ storages: ['cachestorage', 'appcache', 'shadercache'] });
        } catch (e) {}
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }, 100);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Note: 'get-scanners-list' and 'scan-from-device' are handled dynamically above (lines 592-690)

ipcMain.on('trigger-scan', async (event, options = {}) => {
  const sender = event.sender;
  try {
    sender.send('scan-started');
    sender.send('scan-progress', 15);

    const { acquireScanFromDevice } = loadScannerDriver();

    const pTimer1 = setTimeout(() => {
      try { sender.send('scan-progress', 50); } catch (e) {}
    }, 450);

    const pTimer2 = setTimeout(() => {
      try { sender.send('scan-progress', 85); } catch (e) {}
    }, 950);

    const result = await acquireScanFromDevice({
      deviceId: options.deviceId,
      resolution: options.dpi || 300,
      colorMode: options.colorMode || 'color',
      docType: options.format || 'مستند ممسوح'
    });

    clearTimeout(pTimer1);
    clearTimeout(pTimer2);

    if (result && result.success && result.dataUrl) {
      sender.send('scan-progress', 100);
      sender.send('scan-completed', [result.dataUrl]);
    } else {
      sender.send('scan-error', result?.error || 'فشل استلام بيانات المسح من الجهاز');
    }
  } catch (err) {
    sender.send('scan-error', err.message || 'حدث خطأ أثناء الاتصال بالماسح الضوئي');
  }
});

app.whenReady().then(() => {
  migrateOldUserData();
  startLanServer(3000);
  createWindow();

  if (process.env.NODE_ENV !== 'development') {
    // ننتظر 3 ثواني بعد فتح البرنامج لضمان التحميل، ثم نفحص الفلاشة
    setTimeout(checkForUSBUpdates, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- أحداث التحديث التلقائي ---

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث متاح للمنظومة',
    message: `تم اكتشاف إصدار جديد (${info.version}) للبرنامج على الفلاشة.\n\nسيتم تحديث وترقية النسخة الحالية في نفس المكان مباشرة مع الحفاظ التام على جميع بياناتك.\n\nهل تريد البدء بالتحديث الآن؟`,
    buttons: ['نعم، حدّث الآن', 'لا، لاحقاً']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'اكتمل تجهيز التحديث',
    message: 'تم تجهيز ملفات التحديث بنجاح.\nسيتم الآن إغلاق البرنامج وإعادة تشغيله بالنسخة المحدثة فوراً مع الحفاظ على كافة البيانات.',
    buttons: ['موافق، إعادة التشغيل الآن']
  }).then(() => {
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
  });
});

autoUpdater.on('error', (err) => {
  console.error('Update error: ', err);
});
