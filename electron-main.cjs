const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
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
  const candidates = [
    path.join(__dirname, 'src', 'server', 'githubUpdater.cjs'),
    path.join(__dirname, 'githubUpdater.cjs'),
    path.resolve(process.cwd(), 'src', 'server', 'githubUpdater.cjs'),
    path.resolve(process.cwd(), 'githubUpdater.cjs'),
    './src/server/githubUpdater.cjs',
    './githubUpdater.cjs'
  ];

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
  const candidates = [
    path.join(__dirname, 'src', 'server', 'scannerDriver.cjs'),
    path.join(__dirname, 'scannerDriver.cjs'),
    path.resolve(process.cwd(), 'src', 'server', 'scannerDriver.cjs'),
    path.resolve(process.cwd(), 'scannerDriver.cjs'),
    './src/server/scannerDriver.cjs',
    './scannerDriver.cjs'
  ];

  for (const target of candidates) {
    try {
      if (typeof target === 'string' && (fs.existsSync(target) || !path.isAbsolute(target))) {
        return require(target);
      }
    } catch (e) {}
  }
  return require('./src/server/scannerDriver.cjs');
}

function getAppDistPath() {
  try {
    const updatedDist = path.join(app.getPath('userData'), 'app_update', 'dist');
    const updatedIndex = path.join(updatedDist, 'index.html');
    if (fs.existsSync(updatedIndex)) {
      console.log('Running from user downloaded update dist:', updatedDist);
      return updatedDist;
    }
  } catch (e) {}
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
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // إزالة الشريط العلوي تماماً
  mainWindow.setMenuBarVisibility(false);
  mainWindow.maximize(); // جعلها ملء الشاشة

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const distPath = getAppDistPath();
    mainWindow.loadFile(path.join(distPath, 'index.html'));
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

ipcMain.handle('app:reload-window', async () => {
  try {
    if (mainWindow) {
      if (process.env.NODE_ENV === 'development') {
        mainWindow.reload();
      } else {
        const distPath = getAppDistPath();
        const targetIndex = path.join(distPath, 'index.html');
        console.log('Reloading active window from:', targetIndex);
        try {
          await mainWindow.webContents.session.clearCache();
        } catch (cErr) {}
        mainWindow.loadFile(targetIndex);
      }
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
    app.exit(0);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- Exact IPC Handlers from User's Working System ---
ipcMain.handle('get-scanners-list', async () => {
  try {
    const { detectLocalScanners } = loadScannerDriver();
    const devices = await detectLocalScanners();
    return devices.map(d => d.name);
  } catch (err) {
    console.error('IPC get-scanners-list error:', err);
    return ['HP ScanJet 2400 Series (WIA / USB)'];
  }
});

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
