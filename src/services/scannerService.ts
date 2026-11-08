/**
 * Scanner Service - Adapted from User's Working Electron Architecture
 * Provides RxJS-compatible BehaviorSubject / Observable interface for React
 * Communicates with Electron IPC channels: 'trigger-scan', 'get-scanners-list'
 * and listens to 'scan-started', 'scan-progress', 'scan-completed', 'scan-error'.
 */

export interface Subscription {
  unsubscribe: () => void;
}

export class Observable<T> {
  constructor(private subscribeFn: (observer: { next: (val: T) => void }) => () => void) {}

  subscribe(callback: (val: T) => void): Subscription {
    const unsub = this.subscribeFn({ next: callback });
    return { unsubscribe: unsub };
  }
}

export class Subject<T> {
  protected observers: Array<(val: T) => void> = [];

  next(value: T): void {
    this.observers.forEach(obs => {
      try { obs(value); } catch (e) { console.error('Observer error:', e); }
    });
  }

  asObservable(): Observable<T> {
    return new Observable<T>((observer) => {
      this.observers.push(observer.next);
      return () => {
        this.observers = this.observers.filter(obs => obs !== observer.next);
      };
    });
  }

  subscribe(callback: (val: T) => void): Subscription {
    return this.asObservable().subscribe(callback);
  }
}

export class BehaviorSubject<T> extends Subject<T> {
  constructor(private _value: T) {
    super();
  }

  getValue(): T {
    return this._value;
  }

  get value(): T {
    return this._value;
  }

  override next(value: T): void {
    this._value = value;
    super.next(value);
  }

  override asObservable(): Observable<T> {
    return new Observable<T>((observer) => {
      observer.next(this._value);
      const sub = super.asObservable().subscribe(observer.next);
      return () => sub.unsubscribe();
    });
  }
}

export interface ScanOptions {
  dpi?: number;
  format?: string;
  colorMode?: string;
  deviceId?: string;
}

export class ScannerService {
  private ipcRenderer: any | undefined;
  
  private isScanningSubject = new BehaviorSubject<boolean>(false);
  private scanProgressSubject = new BehaviorSubject<number>(0);
  private scanCompleteSubject = new Subject<string[]>();
  private scanErrorSubject = new Subject<string>();

  constructor() {
    // 1. Check window.electron.ipcRenderer (Preload script standard)
    if (typeof window !== 'undefined' && (window as any).electron && (window as any).electron.ipcRenderer) {
      this.ipcRenderer = (window as any).electron.ipcRenderer;
      this.setupIpcListeners();
    } 
    // 2. Check window.require('electron').ipcRenderer (nodeIntegration standard)
    else if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const electron = (window as any).require('electron');
        if (electron && electron.ipcRenderer) {
          this.ipcRenderer = electron.ipcRenderer;
          // Expose to window.electron for full compatibility
          (window as any).electron = { ipcRenderer: electron.ipcRenderer };
          this.setupIpcListeners();
        }
      } catch (e) {
        // running in web browser mode
      }
    } else {
      // Running in browser mode
    }
  }

  /**
   * Universal scan document method matching User Reference ('scan-document')
   * Interacts directly with electronAPI.scanDocument or ipcRenderer.invoke('scan-document')
   * with fallback to LAN/HTTP API
   */
  public async scanDocument(options: ScanOptions = {}): Promise<{
    success: boolean;
    data?: string;
    mimeType?: string;
    dataUrl?: string;
    error?: string;
  }> {
    this.isScanningSubject.next(true);
    this.scanProgressSubject.next(20);

    // 1. Try window.electronAPI.scanDocument (User's Preload reference)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.scanDocument) {
      try {
        this.scanProgressSubject.next(50);
        const res = await (window as any).electronAPI.scanDocument(options);
        this.isScanningSubject.next(false);
        this.scanProgressSubject.next(100);
        if (res && res.success) {
          const finalUrl = res.dataUrl || `data:${res.mimeType || 'application/pdf'};base64,${res.data}`;
          this.scanCompleteSubject.next([finalUrl]);
          return { ...res, dataUrl: finalUrl };
        } else {
          const err = res?.error || 'تعذر الاتصال بالماسح الضوئي';
          this.scanErrorSubject.next(err);
          return { success: false, error: err };
        }
      } catch (err: any) {
        this.isScanningSubject.next(false);
        const msg = err.message || 'فشل الاتصال بالماسح الضوئي';
        this.scanErrorSubject.next(msg);
        return { success: false, error: msg };
      }
    }

    // 2. Try this.ipcRenderer invoke('scan-document')
    if (this.ipcRenderer) {
      try {
        this.scanProgressSubject.next(50);
        const res = await this.ipcRenderer.invoke('scan-document', options);
        this.isScanningSubject.next(false);
        this.scanProgressSubject.next(100);
        if (res && res.success) {
          const finalUrl = res.dataUrl || `data:${res.mimeType || 'application/pdf'};base64,${res.data}`;
          this.scanCompleteSubject.next([finalUrl]);
          return { ...res, dataUrl: finalUrl };
        } else {
          const err = res?.error || 'تعذر الاتصال بالماسح الضوئي';
          this.scanErrorSubject.next(err);
          return { success: false, error: err };
        }
      } catch (err: any) {
        this.isScanningSubject.next(false);
        const msg = err.message || 'فشل تشغيل الماسح الضوئي';
        this.scanErrorSubject.next(msg);
        return { success: false, error: msg };
      }
    }

    // 3. Fallback to HTTP Scanner Endpoint
    try {
      this.scanProgressSubject.next(60);
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: options.deviceId || '',
          resolution: options.dpi || 300,
          colorMode: options.colorMode || 'color',
          format: options.format || 'pdf'
        })
      });

      this.isScanningSubject.next(false);
      this.scanProgressSubject.next(100);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.dataUrl) {
          this.scanCompleteSubject.next([data.dataUrl]);
          return data;
        } else if (data?.error) {
          this.scanErrorSubject.next(data.error);
          return { success: false, error: data.error };
        }
      }
    } catch (e) {}

    this.isScanningSubject.next(false);
    const fallbackErr = 'تعذر الاتصال بالماسح الضوئي. يرجى التأكد من توصيل الجهاز وتثبيت برامج التشغيل.';
    this.scanErrorSubject.next(fallbackErr);
    return { success: false, error: fallbackErr };
  }

  /**
   * إعداد مستمعي الأحداث لاستقبال البيانات من عملية Electron الرئيسية
   */
  private setupIpcListeners(): void {
    if (!this.ipcRenderer) return;

    this.ipcRenderer.on('scan-started', () => {
      this.isScanningSubject.next(true);
      this.scanProgressSubject.next(0);
    });

    this.ipcRenderer.on('scan-progress', (_event: any, progress: number) => {
      this.scanProgressSubject.next(progress);
    });

    this.ipcRenderer.on('scan-completed', (_event: any, filePaths: string[]) => {
      this.isScanningSubject.next(false);
      this.scanProgressSubject.next(100);
      this.scanCompleteSubject.next(filePaths);
    });

    this.ipcRenderer.on('scan-error', (_event: any, errorMessage: string) => {
      this.isScanningSubject.next(false);
      this.scanErrorSubject.next(errorMessage);
    });
  }

  /**
   * بدء عملية المسح الضوئي عبر إرسال أمر إلى Electron
   * @param options إعدادات المسح مثل الدقة (DPI) وصيغة الملف والألوان
   */
  public startScan(options: ScanOptions = {}): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('trigger-scan', options);
    } else {
      // محاكاة عملية المسح في البيئة التجريبية (Mock Mode) عند تشغيل المتصفح بدون Electron
      this.simulateMockScan(options);
    }
  }

  /**
   * استدعاء ساكن لجلب قائمة الماسحات الضوئية المتصلة فعلياً بالجهاز
   */
  public static async getAvailableScanners(): Promise<string[]> {
    return scannerService.getAvailableScanners();
  }

  /**
   * استدعاء ساكن لسحب المستند من جهاز محدد بالاسم
   */
  public static async scanFromDevice(scannerName: string): Promise<{
    success: boolean;
    data?: string;
    mimeType?: string;
    dataUrl?: string;
    error?: string;
  }> {
    return scannerService.scanFromDevice(scannerName);
  }

  /**
   * استدعاء نافذة ويندوز الرسمية لاختيار الماسح الضوئي (Windows Native Select Device Dialog)
   */
  public static async selectScannerViaWindowsDialog(): Promise<string | null> {
    return scannerService.selectScannerViaWindowsDialog();
  }

  /**
   * جلب قائمة الأجهزة (الماسحات الضوئية والطابعات المتصلة) المتصلة بالنظام ديناميكياً
   */
  public async getAvailableScanners(): Promise<string[]> {
    const devicesSet = new Set<string>();

    // 0. Include user preferred scanner if previously saved
    try {
      const saved = localStorage.getItem('preferred_hardware_scanner');
      if (saved && saved.trim()) {
        devicesSet.add(saved.trim());
      }
    } catch (e) {}

    // 1. Try window.electronAPI.getScannersList (User's Preload standard)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getScannersList) {
      try {
        const list = await (window as any).electronAPI.getScannersList();
        if (Array.isArray(list)) {
          list.filter(Boolean).forEach(d => devicesSet.add(String(d)));
        }
      } catch (e) {
        console.warn('electronAPI.getScannersList error:', e);
      }
    }

    // 2. Try this.ipcRenderer invoke('get-scanners-list')
    if (this.ipcRenderer) {
      try {
        const list = await this.ipcRenderer.invoke('get-scanners-list');
        if (Array.isArray(list)) {
          list.filter(Boolean).forEach(d => devicesSet.add(String(d)));
        }
      } catch (e) {
        console.warn('Error invoking get-scanners-list:', e);
      }
    }

    // 3. Try web API fallback (/api/scanner/devices)
    try {
      const res = await fetch('/api/scanner/devices');
      if (res.ok) {
        const data = await res.json();
        if (data.devices && Array.isArray(data.devices)) {
          data.devices.map((d: any) => d.name || d).filter(Boolean).forEach((d: string) => devicesSet.add(String(d)));
        }
      }
    } catch (e) {}

    // 4. Always provide universal standard fallback drivers if no specific named hardware was detected
    if (devicesSet.size === 0) {
      devicesSet.add('الماسح الضوئي الافتراضي لنظام التشغيل (WIA / TWAIN Default)');
      devicesSet.add('ماسح ضوئي متصل عبر منفذ USB (Plug & Play)');
      devicesSet.add('سكانر الطابعة متعددة الوظائف المتصلة');
    }

    return Array.from(devicesSet);
  }

  /**
   * استدعاء نافذة ويندوز الرسمية لاختيار الماسح الضوئي (Windows Native Select Device Dialog)
   */
  public async selectScannerViaWindowsDialog(): Promise<string | null> {
    // 1. Try electronAPI.selectScannerDialog
    if (typeof window !== 'undefined' && (window as any).electronAPI?.selectScannerDialog) {
      try {
        const res = await (window as any).electronAPI.selectScannerDialog();
        if (res && res.success && res.scannerName) {
          try { localStorage.setItem('preferred_hardware_scanner', res.scannerName); } catch (e) {}
          return res.scannerName;
        }
      } catch (e) {
        console.warn('electronAPI.selectScannerDialog notice:', e);
      }
    }

    // 2. Try ipcRenderer
    if (this.ipcRenderer) {
      try {
        const res = await this.ipcRenderer.invoke('select-scanner-dialog');
        if (res && res.success && res.scannerName) {
          try { localStorage.setItem('preferred_hardware_scanner', res.scannerName); } catch (e) {}
          return res.scannerName;
        }
      } catch (e) {
        console.warn('ipcRenderer invoke select-scanner-dialog notice:', e);
      }
    }

    return null;
  }


  /**
   * سحب وثيقة مباشرة من جهاز محدد بالاسم تم اختياره من القائمة المنسدلة
   */
  public async scanFromDevice(scannerName: string): Promise<{
    success: boolean;
    data?: string;
    mimeType?: string;
    dataUrl?: string;
    error?: string;
  }> {
    this.isScanningSubject.next(true);
    this.scanProgressSubject.next(25);

    // 1. Try window.electronAPI.scanFromDevice
    if (typeof window !== 'undefined' && (window as any).electronAPI?.scanFromDevice) {
      try {
        this.scanProgressSubject.next(60);
        const res = await (window as any).electronAPI.scanFromDevice(scannerName);
        this.isScanningSubject.next(false);
        this.scanProgressSubject.next(100);

        if (res && res.success) {
          const finalUrl = res.dataUrl || `data:${res.mimeType || 'application/pdf'};base64,${res.data}`;
          this.scanCompleteSubject.next([finalUrl]);
          return { ...res, dataUrl: finalUrl };
        } else {
          const err = res?.error || 'تعذر الاتصال بالجهاز المحدد. تأكد من توصيله بشكل صحيح وتثبيت تعريفاته.';
          this.scanErrorSubject.next(err);
          return { success: false, error: err };
        }
      } catch (err: any) {
        this.isScanningSubject.next(false);
        const msg = err?.error || err?.message || 'فشل الاتصال بالجهاز المحدد. تأكد من توصيله بشكل صحيح وتثبيت تعريفاته.';
        this.scanErrorSubject.next(msg);
        return { success: false, error: msg };
      }
    }

    // 2. Try this.ipcRenderer invoke('scan-from-device')
    if (this.ipcRenderer) {
      try {
        this.scanProgressSubject.next(60);
        const res = await this.ipcRenderer.invoke('scan-from-device', scannerName);
        this.isScanningSubject.next(false);
        this.scanProgressSubject.next(100);

        if (res && res.success) {
          const finalUrl = res.dataUrl || `data:${res.mimeType || 'application/pdf'};base64,${res.data}`;
          this.scanCompleteSubject.next([finalUrl]);
          return { ...res, dataUrl: finalUrl };
        } else {
          const err = res?.error || 'تعذر الاتصال بالجهاز المحدد';
          this.scanErrorSubject.next(err);
          return { success: false, error: err };
        }
      } catch (err: any) {
        this.isScanningSubject.next(false);
        const msg = err?.error || err?.message || 'فشل الاتصال بالجهاز المحدد';
        this.scanErrorSubject.next(msg);
        return { success: false, error: msg };
      }
    }

    // 3. Fallback: call scanDocument with deviceId
    return this.scanDocument({ deviceId: scannerName });
  }

  // --- حالات المراقبة (Observables) المتاحة لواجهات المستخدم ---

  public getIsScanning(): Observable<boolean> {
    return this.isScanningSubject.asObservable();
  }

  public getScanProgress(): Observable<number> {
    return this.scanProgressSubject.asObservable();
  }

  public onScanComplete(): Observable<string[]> {
    return this.scanCompleteSubject.asObservable();
  }

  public onScanError(): Observable<string> {
    return this.scanErrorSubject.asObservable();
  }

  public isElectronAvailable(): boolean {
    return !!this.ipcRenderer;
  }

  /**
   * دالة محاكاة للمسح الضوئي عند التطوير والاختبار المحلي على المتصفحات
   * تقوم بتوليد المستند واستدعاء نقاط النهاية مع مؤشر تقدم متزايد
   */
  private async simulateMockScan(options: ScanOptions = {}): Promise<void> {
    this.isScanningSubject.next(true);
    this.scanProgressSubject.next(10);
    
    let progress = 10;
    const interval = setInterval(async () => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        this.scanProgressSubject.next(100);

        try {
          // Fetch calibrated scanned document
          const res = await fetch('/api/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: options.deviceId || '',
              resolution: options.dpi || 300,
              colorMode: options.colorMode || 'color',
              docType: options.format || 'مستند رسمي'
            })
          });

          if (res.ok) {
            const data = await res.json();
            this.isScanningSubject.next(false);
            if (data.success && data.dataUrl) {
              this.scanCompleteSubject.next([data.dataUrl]);
              return;
            } else if (data.error) {
              this.scanErrorSubject.next(data.error);
              return;
            }
          }
        } catch (e) {}

        this.isScanningSubject.next(false);
        this.scanErrorSubject.next('تعذر سحب المستند: لم يتم الكشف عن ماسح ضوئي متصل. يرجى توصيل كابل USB أو التقاط صورة الورقة الحقيقية بالكاميرا أو رفع ملفها.');
      } else {
        this.scanProgressSubject.next(progress);
      }
    }, 400);
  }
}

// Singleton instance export
export const scannerService = new ScannerService();
