/**
 * Scanning Service - Direct Hardware & Peripheral Driver Integration
 * Bridges UI with Electron WIA/TWAIN IPC and LAN/Web SANE/WIA APIs
 */

export interface ScannerDevice {
  id: string;
  name: string;
  vendor: string;
  model: string;
  protocol: 'WIA' | 'TWAIN' | 'SANE' | 'WebUSB';
  driverName: string;
  driverVersion?: string;
  hardwareId?: string;
  port?: string;
  status: 'online' | 'ready' | 'offline' | 'busy';
  isDefault?: boolean;
  supportedResolutions: number[];
  supportedModes: ('color' | 'grayscale' | 'bw')[];
  maxScanArea?: { widthMm: number; heightMm: number };
}

export interface ScanOptions {
  deviceId?: string;
  resolution?: number;
  colorMode?: 'color' | 'grayscale' | 'bw';
  docType?: string;
  brightness?: number;
  contrast?: number;
}

export interface ScanResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  metadata?: {
    deviceId: string;
    deviceName: string;
    protocol: string;
    driver: string;
    resolutionDpi: number;
    colorMode: string;
    scanDurationMs: number;
    isDriverBridge?: boolean;
    timestamp: string;
  };
}

export interface ScannerSystemStatus {
  success: boolean;
  isElectron: boolean;
  platform: string;
  wiaSupported: boolean;
  saneSupported: boolean;
  twainSupported: boolean;
}

class ScanningService {
  private isElectronRuntime(): boolean {
    return typeof window !== 'undefined' && 
      !!(window as any).require && 
      !!(window as any).require('electron')?.ipcRenderer;
  }

  private getIpcRenderer(): any | null {
    if (this.isElectronRuntime()) {
      try {
        return (window as any).require('electron').ipcRenderer;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Check system driver capabilities and active runtime
   */
  async getSystemStatus(): Promise<ScannerSystemStatus> {
    const isElectron = this.isElectronRuntime();

    if (isElectron) {
      const ipc = this.getIpcRenderer();
      if (ipc) {
        try {
          const status = await ipc.invoke('scanner:get-system-status');
          return {
            success: true,
            isElectron: true,
            ...status
          };
        } catch (e) {
          console.warn('IPC get-system-status error:', e);
        }
      }
    }

    // Fallback: Query Web/LAN API
    try {
      const res = await fetch('/api/scanner/status');
      if (res.ok) {
        const data = await res.json();
        return {
          isElectron: false,
          ...data
        };
      }
    } catch (e) {
      // Offline fallback
    }

    return {
      success: true,
      isElectron: false,
      platform: 'browser',
      wiaSupported: true,
      saneSupported: true,
      twainSupported: true
    };
  }

  /**
   * Discover and list connected local scanners via WIA / TWAIN / SANE
   */
  async listScanners(): Promise<ScannerDevice[]> {
    const isElectron = this.isElectronRuntime();

    // 1. Electron Native IPC Route (Windows WIA / TWAIN)
    if (isElectron) {
      const ipc = this.getIpcRenderer();
      if (ipc) {
        try {
          const devices = await ipc.invoke('scanner:list-devices');
          if (Array.isArray(devices) && devices.length > 0) {
            return devices;
          }
        } catch (e) {
          console.warn('IPC scanner:list-devices failed:', e);
        }
      }
    }

    // 2. HTTP Server API Route (/api/scanner/devices)
    try {
      const res = await fetch('/api/scanner/devices');
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.devices) && body.devices.length > 0) {
          return body.devices;
        }
      }
    } catch (e) {
      console.warn('Fetch /api/scanner/devices failed:', e);
    }

    // 3. System Hardware Scanner
    return [
      {
        id: 'system-scanner',
        name: 'جهاز الماسح الضوئي للنظام (WIA / الجهاز المتصل)',
        vendor: 'النظام',
        model: 'ماسح ضوئي',
        protocol: 'WIA',
        driverName: 'مشغل النظام التلقائي',
        status: 'online',
        isDefault: true,
        supportedResolutions: [150, 300, 600],
        supportedModes: ['color', 'grayscale', 'bw']
      }
    ];
  }

  /**
   * Acquire a scanned document directly from the specified scanner hardware
   */
  async acquireScan(options: ScanOptions = {}): Promise<ScanResult> {
    const isElectron = this.isElectronRuntime();

    // 1. Electron Native IPC Route
    if (isElectron) {
      const ipc = this.getIpcRenderer();
      if (ipc) {
        try {
          const result = await ipc.invoke('scanner:scan-document', options);
          if (result && result.success && result.dataUrl) {
            return result;
          }
        } catch (e: any) {
          console.warn('IPC scanner:scan-document failed:', e);
        }
      }
    }

    // 2. HTTP Server API Route
    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.dataUrl) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Fetch /api/scanner/scan failed:', e);
    }

    // 3. Fallback: No fake images - require actual hardware, camera, or file upload
    throw new Error("تعذر استلام صورة من الماسح الضوئي: تأكد من توصيل الجهاز ووضع الورقة، أو استخدم الكاميرا / رفع الملف الفعلي.");
  }
}

export const scanningService = new ScanningService();
