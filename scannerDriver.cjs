/**
 * System Peripheral Scanner Driver Module (SANE / TWAIN / WIA)
 * Communicates with locally installed scanners (e.g., HP ScanJet 2400, Canon LiDE, Epson Perfection)
 * via native OS interfaces:
 * - Windows: WIA (Windows Image Acquisition) / TWAIN through PowerShell & COM automation
 * - Linux: SANE (Scanner Access Now Easy) through scanimage CLI
 * - Fallback: Hardware peripheral bridge with device parameter querying
 */

const { exec, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Detect locally installed scanners directly from the operating system
 * (Windows WIA / DeviceManager or Linux SANE) - NO hardcoded lists!
 */
async function detectLocalScanners() {
  const isWindows = os.platform() === 'win32';
  const isLinux = os.platform() === 'linux';

  let discovered = [];

  if (isWindows) {
    try {
      // Query Windows Image Acquisition (WIA) DeviceManager via PowerShell COM
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
  } else if (isLinux) {
    try {
      // Query Linux SANE backend via scanimage -L
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

  // إرجاع الأجهزة المتصلة فعلياً فقط بدون إضافة أسماء وهمية مسبقة
  return discovered;
}

/**
 * Execute real scan acquisition using WIA / SANE or driver emulation
 */
async function acquireScanFromDevice(options = {}) {
  const {
    deviceId = '',
    resolution = 300,
    colorMode = 'color',
    docType = 'وثيقة رسمية'
  } = options;

  const isWindows = os.platform() === 'win32';
  const isLinux = os.platform() === 'linux';

  // Find target device profile
  const devices = await detectLocalScanners();
  const targetDevice = (devices.find(d => d.id === deviceId) || devices[0]) || {
    id: 'scanner-device',
    name: 'الماسح الضوئي المحلي',
    driverName: 'WIA / SANE Driver'
  };

  const startTime = Date.now();

  // Attempt Real Native Windows WIA Scan if running on Windows
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
        exec(psScanScript, { timeout: 15000 }, (error, stdout) => {
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
        return {
          success: true,
          dataUrl: result,
          metadata: {
            deviceId: targetDevice.id,
            deviceName: targetDevice.name,
            protocol: 'WIA',
            driver: targetDevice.driverName,
            resolutionDpi: resolution,
            colorMode: colorMode,
            scanDurationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (e) {
      console.warn('Native WIA scan failed, falling back to driver bridge:', e.message);
    }
  }

  // Attempt Real Native Linux SANE Scan if scanimage is installed
  if (isLinux) {
    try {
      const tempOutPath = path.join(os.tmpdir(), `hr_scan_${Date.now()}.jpg`);
      const saneCmd = `scanimage --resolution ${resolution} --mode ${colorMode === 'bw' ? 'Lineart' : (colorMode === 'grayscale' ? 'Gray' : 'Color')} --format=jpeg > "${tempOutPath}"`;

      const saneSuccess = await new Promise((resolve) => {
        exec(saneCmd, { timeout: 15000 }, (error) => {
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
        return {
          success: true,
          dataUrl: `data:image/jpeg;base64,${buf.toString('base64')}`,
          metadata: {
            deviceId: targetDevice.id,
            deviceName: targetDevice.name,
            protocol: 'SANE',
            driver: targetDevice.driverName,
            resolutionDpi: resolution,
            colorMode: colorMode,
            scanDurationMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (e) {
      console.warn('Native SANE scan failed, falling back to driver bridge:', e.message);
    }
  }

  // في حال عدم توفر اتصال فعلي بالماسح الضوئي (WIA / SANE)، لا نقوم بتوليد أي وثيقة وهمية إطلاقاً
  return {
    success: false,
    error: 'تعذر سحب الصورة: لم يتم الكشف عن ماسح ضوئي متصل أو تعذر قراءة المستند من الجهاز. يرجى التأكد من توصيل كابل USB وتشغيل الماسح ووضع الورقة، أو استخدام الكاميرا لالتقاط صورة الورقة الحقيقية أو رفع ملفها.'
  };
}

module.exports = {
  detectLocalScanners,
  acquireScanFromDevice
};
