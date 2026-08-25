const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// إعدادات التحديث التلقائي
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

// دالة للبحث عن التحديثات في الأقراص المحمولة (USB)
function checkForUSBUpdates() {
  // قائمة بحروف الأقراص المحتملة في نظام ويندوز
  const drives = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let updateFoundPath = null;

  for (const drive of drives) {
    // نبحث عن مجلد باسم HR_Update في الفلاشة
    const checkPath = `${drive}:\\HR_Update`;
    const ymlPath = path.join(checkPath, 'latest.yml');
    
    // إذا وجدنا ملف latest.yml داخل المجلد، فهذا يعني وجود تحديث
    if (fs.existsSync(ymlPath)) {
      updateFoundPath = checkPath;
      break; 
    }
  }

  if (updateFoundPath) {
    // توجيه برنامج التحديث ليقرأ من الفلاشة
    const feedUrl = `file:///${updateFoundPath.replace(/\\/g, '/')}`;
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: feedUrl
    });
    
    // بدء فحص وتنزيل التحديث
    autoUpdater.checkForUpdates();
  }
}

app.whenReady().then(() => {
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
    title: 'تحديث متاح عبر USB',
    message: `تم اكتشاف إصدار جديد (${info.version}) للبرنامج على الفلاشة.\nهل تريد تثبيته الآن؟`,
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
    title: 'اكتمل التحميل',
    message: 'تم تجهيز ملفات التحديث بنجاح. سيتم الآن إغلاق البرنامج لتثبيت التحديث.',
    buttons: ['موافق']
  }).then(() => {
    setImmediate(() => autoUpdater.quitAndInstall());
  });
});

autoUpdater.on('error', (err) => {
  console.error('Update error: ', err);
});
