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
        console.warn('Electron IPC Renderer not available. Scanner running in mock/web mode.');
      }
    } else {
      console.warn('Electron IPC Renderer not available. Scanner running in mock mode.');
    }
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
   * جلب قائمة الأجهزة (الماسحات الضوئية) المتصلة بالنظام
   */
  public async getAvailableScanners(): Promise<string[]> {
    if (this.ipcRenderer) {
      try {
        const list = await this.ipcRenderer.invoke('get-scanners-list');
        if (Array.isArray(list)) return list;
      } catch (e) {
        console.warn('Error invoking get-scanners-list:', e);
      }
    }

    // Try web API fallback
    try {
      const res = await fetch('/api/scanner/devices');
      if (res.ok) {
        const data = await res.json();
        if (data.devices && Array.isArray(data.devices)) {
          return data.devices.map((d: any) => d.name);
        }
      }
    } catch (e) {}

    return [];
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
