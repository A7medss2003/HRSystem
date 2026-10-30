/**
 * System Peripheral Scanner Driver Module (NAPS2 / WIA / TWAIN / SANE)
 * Communicates with locally connected scanners (HP ScanJet, Canon LiDE, Epson, Brother, etc.)
 * via:
 * 1. NAPS2.Console.exe (Universal scanner CLI supporting any WIA/TWAIN scanner to PDF/JPEG)
 * 2. Windows WIA (Windows Image Acquisition via PowerShell COM automation)
 * 3. Linux SANE (Scanner Access Now Easy through scanimage CLI)
 */

const { exec, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

function getElectronApp() {
  try {
    const electron = require('electron');
    return electron.app || (electron.remote && electron.remote.app) || null;
  } catch (e) {
    return null;
  }
}

/**
 * Searches for NAPS2.Console.exe in all standard and portable locations
 */
function findNaps2Path() {
  const electronApp = getElectronApp();
  const appPath = electronApp && typeof electronApp.getAppPath === 'function' ? electronApp.getAppPath() : process.cwd();

  const candidates = [
    path.join(__dirname, 'bin', 'NAPS2.Console.exe'),
    path.join(__dirname, '..', '..', 'bin', 'NAPS2.Console.exe'),
    path.join(process.cwd(), 'bin', 'NAPS2.Console.exe'),
    path.join(appPath, 'bin', 'NAPS2.Console.exe'),
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

/**
 * Detect locally installed scanners directly from the operating system
 */
async function detectLocalScanners() {
  const isWindows = os.platform() === 'win32';
  const isLinux = os.platform() === 'linux';

  let discovered = [];

  // 1. Check if NAPS2 is available for device enumeration
  const naps2Path = findNaps2Path();
  if (naps2Path) {
    try {
      const naps2List = await new Promise((resolve) => {
        exec(`"${naps2Path}" --listdevices`, { timeout: 4000 }, (err, stdout) => {
          if (err || !stdout) return resolve([]);
          const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
          const devices = lines.map((name, idx) => ({
            id: `naps2-${idx}`,
            name: name,
            vendor: 'Universal Scanner',
            model: name,
            protocol: 'TWAIN / WIA',
            driverName: 'NAPS2.Console CLI Driver',
            status: 'online',
            isDefault: idx === 0,
            supportedResolutions: [150, 200, 300, 600],
            supportedModes: ['color', 'grayscale', 'bw']
          }));
          resolve(devices);
        });
      });

      if (naps2List && naps2List.length > 0) {
        discovered = naps2List;
      }
    } catch (e) {}
  }

  // 2. Query Windows WIA DeviceManager
  if (discovered.length === 0 && isWindows) {
    try {
      const psCommand = `powershell -NoProfile -Command "
        try {
          $devMgr = New-Object -ComObject WIA.DeviceManager;
          $list = @();
          foreach ($info in $devMgr.DeviceInfos) {
            $list += [PSCustomObject]@{
              Id = $info.DeviceID;
              Name = $info.Properties.Item('Name').Value;
              Manufacturer = $info.Properties.Item('Manufacturer').Value;
              Type = $info.Type;
            };
          }
          $list | ConvertTo-Json -Compress;
        } catch {
          Write-Output '[]';
        }
      "`;

      const result = await new Promise((resolve) => {
        exec(psCommand, { timeout: 3500 }, (error, stdout) => {
          if (error || !stdout.trim()) return resolve([]);
          try {
            const parsed = JSON.parse(stdout.trim());
            resolve(Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []));
          } catch (e) {
            resolve([]);
          }
        });
      });

      if (result && result.length > 0) {
        discovered = result.map((dev, idx) => ({
          id: `wia-${dev.Id || idx}`,
          name: dev.Name || 'ماسح ضوئي محلي (WIA)',
          vendor: dev.Manufacturer || 'WIA Device',
          model: dev.Name || 'Scanner',
          protocol: 'WIA',
          driverName: 'wiaaut.dll (Windows Image Acquisition)',
          driverVersion: 'WIA 2.0 Native',
          hardwareId: dev.Id || 'USB\\UNKNOWN_SCANNER',
          port: `WIA_${idx + 1}`,
          status: 'online',
          isDefault: idx === 0,
          supportedResolutions: [150, 200, 300, 600],
          supportedModes: ['color', 'grayscale', 'bw'],
          maxScanArea: { widthMm: 216, heightMm: 297 }
        }));
      }
    } catch (e) {
      console.warn('WIA scanner detection error:', e.message);
    }
  }

  // 3. Query Linux SANE
  if (discovered.length === 0 && isLinux) {
    try {
      const saneResult = await new Promise((resolve) => {
        exec('scanimage -L', { timeout: 3000 }, (error, stdout) => {
          if (error || !stdout) return resolve([]);
          const lines = stdout.split('\n');
          const found = [];
          for (const line of lines) {
            const match = line.match(/device `([^']+)' is a ([^ ]+) (.*)/i);
            if (match) {
              found.push({
                device: match[1],
                vendor: match[2],
                model: match[3]
              });
            }
          }
          resolve(found);
        });
      });

      if (saneResult && saneResult.length > 0) {
        discovered = saneResult.map((d, idx) => ({
          id: `sane-${d.device}`,
          name: `${d.vendor} ${d.model}`,
          vendor: d.vendor,
          model: d.model,
          protocol: 'SANE',
          driverName: `libsane-${d.device.split(':')[0]}`,
          driverVersion: 'SANE 1.2.1',
          hardwareId: d.device,
          port: d.device,
          status: 'online',
          isDefault: idx === 0,
          supportedResolutions: [150, 300, 600, 1200],
          supportedModes: ['color', 'grayscale', 'bw'],
          maxScanArea: { widthMm: 216, heightMm: 297 }
        }));
      }
    } catch (e) {
      console.warn('SANE detection error:', e.message);
    }
  }

  return discovered;
}

/**
 * Executes scanner capture via NAPS2.Console CLI (Reference Implementation)
 * Auto-detects any connected scanner, saves as PDF or JPEG, and converts to Base64
 */
async function scanWithNaps2(options = {}) {
  const naps2Path = findNaps2Path();
  if (!naps2Path) return null;

  const electronApp = getElectronApp();
  const baseDir = electronApp ? electronApp.getPath('userData') : os.tmpdir();
  const format = options.format === 'jpg' || options.format === 'jpeg' ? 'jpg' : 'pdf';
  const outputFilePath = path.join(baseDir, `scan_${Date.now()}.${format}`);

  let command = `"${naps2Path}" -o "${outputFilePath}" --force`;
  if (options.dpi || options.resolution) {
    command += ` --dpi ${options.dpi || options.resolution}`;
  }
  if (options.deviceName && !options.deviceName.includes('(')) {
    command += ` --device "${options.deviceName}"`;
  }

  return new Promise((resolve) => {
    exec(command, { timeout: 45000 }, (error, stdout, stderr) => {
      if (error) {
        console.warn(`NAPS2 Scan Notice: ${error.message}`);
        return resolve(null);
      }

      if (fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 200) {
        try {
          const fileBuffer = fs.readFileSync(outputFilePath);
          fs.unlinkSync(outputFilePath); // Clean up temp file

          const mimeType = format === 'pdf' ? 'application/pdf' : 'image/jpeg';
          const base64Data = fileBuffer.toString('base64');
          return resolve({
            success: true,
            data: base64Data,
            mimeType,
            dataUrl: `data:${mimeType};base64,${base64Data}`,
            driver: 'NAPS2.Console.exe',
            metadata: {
              driver: 'NAPS2 Auto-Detecting Scanner CLI',
              format,
              sizeBytes: fileBuffer.length,
              timestamp: new Date().toISOString()
            }
          });
        } catch (readErr) {
          console.warn('Error reading NAPS2 output file:', readErr);
          return resolve(null);
        }
      }
      resolve(null);
    });
  });
}

/**
 * Execute real scan acquisition using NAPS2, Windows WIA, or Linux SANE
 */
async function acquireScanFromDevice(options = {}) {
  const {
    deviceId = '',
    resolution = 300,
    colorMode = 'color',
    docType = 'وثيقة رسمية',
    format = 'pdf'
  } = options;

  const isWindows = os.platform() === 'win32';
  const isLinux = os.platform() === 'linux';
  const startTime = Date.now();

  // 1. Primary Strategy: Try NAPS2.Console.exe (Fast, Auto-detects all scanners, direct PDF/JPEG output)
  try {
    const naps2Result = await scanWithNaps2({
      dpi: resolution,
      colorMode,
      format,
      deviceId
    });
    if (naps2Result && naps2Result.success) {
      return naps2Result;
    }
  } catch (naps2Err) {
    console.warn('NAPS2 execution fell back to native driver:', naps2Err.message);
  }

  // 2. Secondary Strategy: Native Windows WIA PowerShell Automation
  if (isWindows) {
    try {
      const tempOutPath = path.join(os.tmpdir(), `hr_scan_${Date.now()}.jpg`);
      const psScanScript = `powershell -NoProfile -Command "
        try {
          $devMgr = New-Object -ComObject WIA.DeviceManager;
          $device = $devMgr.DeviceInfos.Item(1).Connect();
          $item = $device.Items.Item(1);
          $img = $item.Transfer('{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}');
          $img.SaveFile('${tempOutPath.replace(/\\/g, '\\\\')}');
          Write-Output 'SUCCESS';
        } catch {
          Write-Output ('ERROR: ' + $_.Exception.Message);
        }
      "`;

      const result = await new Promise((resolve) => {
        exec(psScanScript, { timeout: 20000 }, (error, stdout) => {
          if (!error && stdout.includes('SUCCESS') && fs.existsSync(tempOutPath)) {
            const buf = fs.readFileSync(tempOutPath);
            fs.unlinkSync(tempOutPath);
            resolve(`data:image/jpeg;base64,${buf.toString('base64')}`);
          } else {
            resolve(null);
          }
        });
      });

      if (result) {
        const rawBase64 = result.split(',')[1] || '';
        return {
          success: true,
          data: rawBase64,
          mimeType: 'image/jpeg',
          dataUrl: result,
          metadata: {
            deviceId: 'wia-device',
            deviceName: 'الماسح الضوئي (Windows WIA)',
            protocol: 'WIA',
            driver: 'wiaaut.dll (Windows Image Acquisition)',
            resolutionDpi: resolution,
            colorMode: colorMode,
            scanDurationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (e) {
      console.warn('Native WIA scan notice:', e.message);
    }
  }

  // 3. Tertiary Strategy: Native Linux SANE scanimage
  if (isLinux) {
    try {
      const tempOutPath = path.join(os.tmpdir(), `hr_scan_${Date.now()}.jpg`);
      const saneCmd = `scanimage --resolution ${resolution} --mode ${colorMode === 'bw' ? 'Lineart' : (colorMode === 'grayscale' ? 'Gray' : 'Color')} --format=jpeg > "${tempOutPath}"`;

      const saneSuccess = await new Promise((resolve) => {
        exec(saneCmd, { timeout: 20000 }, (error) => {
          if (!error && fs.existsSync(tempOutPath) && fs.statSync(tempOutPath).size > 100) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });

      if (saneSuccess) {
        const buf = fs.readFileSync(tempOutPath);
        fs.unlinkSync(tempOutPath);
        const rawBase64 = buf.toString('base64');
        return {
          success: true,
          data: rawBase64,
          mimeType: 'image/jpeg',
          dataUrl: `data:image/jpeg;base64,${rawBase64}`,
          metadata: {
            deviceId: 'sane-device',
            deviceName: 'الماسح الضوئي (Linux SANE)',
            protocol: 'SANE',
            resolutionDpi: resolution,
            colorMode: colorMode,
            scanDurationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (e) {
      console.warn('Native SANE scan notice:', e.message);
    }
  }

  // Graceful response when no physical scanner responds
  return {
    success: false,
    error: 'تعذر الاتصال بالماسح الضوئي: يرجى التأكد من توصيل كابل USB أو كابل الشبكة بالماسح، وتشغيل الجهاز، أو استخدام خيار سحب الملف الممسوح أو التقاطه بالكاميرا.'
  };
}

module.exports = {
  findNaps2Path,
  scanWithNaps2,
  detectLocalScanners,
  acquireScanFromDevice
};
