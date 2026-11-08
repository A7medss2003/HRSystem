const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function findNaps2CliPath() {
  const electronApp = app;
  let appPath = '';
  try {
    appPath = electronApp && typeof electronApp.getAppPath === 'function' ? electronApp.getAppPath() : process.cwd();
  } catch (e) {
    appPath = process.cwd();
  }

  const candidates = [
    path.join(__dirname, '..', 'bin', 'NAPS2.Console.exe'),
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

// 1. Fetch all connected WIA scanners dynamically (Pure Native WIA Architecture)
ipcMain.handle('get-scanners-list', async () => {
  return new Promise(async (resolve) => {
    const devicesSet = new Set();

    // Priority 1: Native Windows WIA DeviceManager COM ($info.Type -eq 1 for ScannerDeviceType)
    if (os.platform() === 'win32') {
      await new Promise((done) => {
        const psCommand = `
          $deviceManager = New-Object -ComObject WIA.DeviceManager;
          $devices = @();
          foreach ($info in $deviceManager.DeviceInfos) {
            if ($info.Type -eq 1) {
              $devices += $info.Properties("Name").Value;
            }
          }
          $devices | ConvertTo-Json -Compress
        `;

        exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/\r?\n/g, ' ')}"`, (error, stdout) => {
          if (!error && stdout && stdout.trim() !== '') {
            try {
              const parsed = JSON.parse(stdout.trim());
              const list = Array.isArray(parsed) ? parsed : [parsed];
              list.filter(Boolean).forEach(d => devicesSet.add(String(d).trim()));
            } catch (e) {}
          }
          done();
        });
      });

      // Priority 2: PnP / Printers fallback if WIA COM didn't find specific devices
      if (devicesSet.size === 0) {
        await new Promise((done) => {
          const psFallback = `powershell -NoProfile -ExecutionPolicy Bypass -Command "
            $devs = @();
            try {
              Get-CimInstance Win32_PnPEntity -ErrorAction SilentlyContinue | Where-Object { 
                $_.PNPClass -eq 'Image' -or $_.Service -like '*usbscan*' -or $_.Service -like '*wia*' 
              } | ForEach-Object { if ($_.Name) { $devs += $_.Name; } }
            } catch {}
            try {
              Get-CimInstance Win32_Printer -ErrorAction SilentlyContinue | ForEach-Object {
                if ($_.Name -and $_.Name -notlike '*OneNote*' -and $_.Name -notlike '*Fax*' -and $_.Name -notlike '*Microsoft Print*') {
                  $devs += $_.Name;
                }
              }
            } catch {}
            $devs | Sort-Object -Unique | ForEach-Object { Write-Output $_ };
          "`;
          exec(psFallback, { timeout: 4000 }, (err, stdout) => {
            if (!err && stdout) {
              stdout.split('\n').map(l => l.trim()).filter(Boolean).forEach(name => devicesSet.add(name));
            }
            done();
          });
        });
      }
    }

    // Priority 3: NAPS2 CLI if present
    const naps2Path = findNaps2CliPath();
    if (naps2Path && devicesSet.size === 0) {
      await new Promise((done) => {
        exec(`"${naps2Path}" --list`, { timeout: 4000 }, (error, stdout) => {
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

    resolve(Array.from(devicesSet));
  });
});

// 2. Scan document from the selected scanner and return Base64 JPEG (Native WIA Architecture)
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

        fallbackScan();
      });
      return;
    }

    fallbackScan();

    function fallbackScan() {
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
            } catch (e) {}
          }

          fallbackDriverScan();
        });
      } else {
        fallbackDriverScan();
      }
    }

    function fallbackDriverScan() {
      try {
        const scannerDriver = require(path.join(__dirname, '..', 'scannerDriver.cjs'));
        scannerDriver.acquireScanFromDevice({ deviceName: isGenericDefault ? '' : scannerName }).then(res => {
          if (res && res.success) resolve(res);
          else reject({ success: false, error: res?.error || 'تعذر الاتصال بالماسح الضوئي' });
        }).catch(err => reject({ success: false, error: err.message }));
      } catch (err) {
        reject({ success: false, error: 'تعذر تشغيل الماسح الضوئي' });
      }
    }
  });
});

function createWindow() {
  const preloadPath = path.join(__dirname, '..', 'preload.cjs');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'مركز البنيان - نظام إدارة الموارد البشرية',
    icon: path.join(__dirname, isDev ? "../public/logo.png" : "../dist/logo.png"),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined
    },
  });
  
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
