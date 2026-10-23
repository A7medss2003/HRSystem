import { ServerRole, ServerStatusInfo } from '../types';
import { executeLiveAutoBackup, getStoredBackupPath } from './autoBackup';

export interface ServerConfig {
  role: ServerRole;
  hostIp: string;
  port: number;
  customEthernetIp?: string;
  autoSync: boolean;
}

const SERVER_CONFIG_KEY = 'hr-server-network-config';

export function getStoredServerConfig(): ServerConfig {
  try {
    const raw = localStorage.getItem(SERVER_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  // Detect if current window location is NOT localhost, which implies it's accessed as a client!
  const isRemote = typeof window !== 'undefined' && 
                   window.location.hostname !== 'localhost' && 
                   window.location.hostname !== '127.0.0.1';

  return {
    role: isRemote ? 'client' : 'host',
    hostIp: typeof window !== 'undefined' ? window.location.hostname : '192.168.1.1',
    port: typeof window !== 'undefined' && window.location.port ? parseInt(window.location.port, 10) : 3000,
    customEthernetIp: '',
    autoSync: true
  };
}

export function saveServerConfig(config: Partial<ServerConfig>): ServerConfig {
  const current = getStoredServerConfig();
  const updated: ServerConfig = { ...current, ...config };
  localStorage.setItem(SERVER_CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

// Query network interfaces from Electron IPC or HTTP API
export async function fetchNetworkInterfaces(): Promise<ServerStatusInfo> {
  // 1. Try Electron IPC if running in desktop app
  if (typeof window !== 'undefined' && (window as any).require) {
    try {
      const { ipcRenderer } = (window as any).require('electron');
      const data = await ipcRenderer.invoke('get-network-interfaces-info');
      if (data) return data;
    } catch (e) {
      // fallback to http
    }
  }

  // 2. Try HTTP API
  try {
    const res = await fetch('/api/network-interfaces', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        running: true,
        port: data.port || 3000,
        hostName: data.hostName || 'HR-SERVER',
        role: getStoredServerConfig().role,
        ethernetIp: data.ethernetIp,
        wifiIp: data.wifiIp,
        interfaces: data.interfaces || [],
        lastSync: new Date().toISOString()
      };
    }
  } catch (e) {
    // API not reachable
  }

  // 3. Fallback based on window location
  const detectedIp = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? window.location.hostname
    : '192.168.1.1';

  return {
    running: true,
    port: 3000,
    hostName: 'HR-HOST-PC',
    role: getStoredServerConfig().role,
    ethernetIp: detectedIp,
    wifiIp: '192.168.0.45',
    interfaces: [
      {
        name: 'Ethernet (كرت مدخل كابل الإيثرنت السلكي)',
        ip: detectedIp,
        type: 'ethernet',
        isEthernet: true,
        mac: '00:1A:2B:3C:4D:5E'
      },
      {
        name: 'Wi-Fi (الشبكة اللاسلكية الرئيسية - معزولة)',
        ip: '192.168.0.45',
        type: 'wifi',
        isEthernet: false,
        mac: 'F0:98:38:A1:B2:C3'
      }
    ],
    lastSync: new Date().toISOString()
  };
}

export function getEffectiveApiUrl(path: string = '/api/sync/data', customHost?: string): string {
  if (customHost) {
    const cleanUrl = customHost.endsWith('/') ? customHost.slice(0, -1) : customHost;
    return cleanUrl.startsWith('http') ? `${cleanUrl}${path}` : `http://${cleanUrl}${path}`;
  }

  if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
    return path;
  }

  const cfg = getStoredServerConfig();
  const host = cfg.hostIp || '127.0.0.1';
  const port = cfg.port || 3000;
  return `http://${host}:${port}${path}`;
}

// Fetch centralized data from host
export async function fetchCentralDataFromHost(hostUrl?: string): Promise<any | null> {
  try {
    const target = getEffectiveApiUrl('/api/sync/data', hostUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(target, { 
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch (err) {
    // Host offline or unreachable
  }
  return null;
}

// Push local data updates to host
export async function pushCentralDataToHost(data: any, hostUrl?: string): Promise<boolean> {
  try {
    const target = getEffectiveApiUrl('/api/sync/data', hostUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(target, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return res.ok;
  } catch (err) {
    return false;
  }
}

export function extractSyncableState(storeState: any) {
  return {
    employees: storeState.employees || [],
    leaves: storeState.leaves || [],
    roles: storeState.roles || [],
    attendanceRecords: storeState.attendanceRecords || [],
    candidates: storeState.candidates || [],
    payrolls: storeState.payrolls || [],
    performanceReviews: storeState.performanceReviews || [],
    systemAuditLogs: storeState.systemAuditLogs || [],
    globalCustomFields: storeState.globalCustomFields || [],
    systemSettings: storeState.systemSettings || {},
    requiredFields: storeState.requiredFields || {},
    recoveryCodes: storeState.recoveryCodes || [],
    backupPath: storeState.backupPath || getStoredBackupPath(),
    lastBackupDate: storeState.lastBackupDate || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

let isInternalStoreUpdate = false;

export function applySyncableState(targetStore: any, centralData: any): boolean {
  if (!centralData) return false;
  const raw = centralData.state || centralData;
  if (!raw || typeof raw !== 'object') return false;

  const patch: any = {};
  if (Array.isArray(raw.employees)) patch.employees = raw.employees;
  if (Array.isArray(raw.leaves)) patch.leaves = raw.leaves;
  if (Array.isArray(raw.roles)) patch.roles = raw.roles;
  if (Array.isArray(raw.attendanceRecords)) patch.attendanceRecords = raw.attendanceRecords;
  if (Array.isArray(raw.candidates)) patch.candidates = raw.candidates;
  if (Array.isArray(raw.payrolls)) patch.payrolls = raw.payrolls;
  if (Array.isArray(raw.performanceReviews)) patch.performanceReviews = raw.performanceReviews;
  if (Array.isArray(raw.systemAuditLogs)) patch.systemAuditLogs = raw.systemAuditLogs;
  if (Array.isArray(raw.globalCustomFields)) patch.globalCustomFields = raw.globalCustomFields;
  if (raw.systemSettings && typeof raw.systemSettings === 'object') patch.systemSettings = raw.systemSettings;
  if (raw.requiredFields && typeof raw.requiredFields === 'object') patch.requiredFields = raw.requiredFields;
  if (Array.isArray(raw.recoveryCodes)) patch.recoveryCodes = raw.recoveryCodes;

  if (Object.keys(patch).length > 0) {
    isInternalStoreUpdate = true;
    targetStore.setState(patch);
    setTimeout(() => { isInternalStoreUpdate = false; }, 250);
    return true;
  }
  return false;
}

let autoSyncInitialized = false;

export function initCentralAutoSync(store: any) {
  if (autoSyncInitialized) return;
  autoSyncInitialized = true;

  // 1. Initial Sync & Initial Mirror Backup
  (async () => {
    try {
      // Execute initial mirror backup immediately
      executeLiveAutoBackup(store);

      const serverData = await fetchCentralDataFromHost();
      const currentEmployees = store.getState().employees || [];
      const serverEmployees = serverData?.employees || (serverData?.state?.employees) || [];

      if (serverData && serverEmployees.length > 0) {
        applySyncableState(store, serverData);
        executeLiveAutoBackup(store);
      } else if (currentEmployees.length > 0) {
        // If local has employees but server is empty, seed server database!
        const payload = extractSyncableState(store.getState());
        await pushCentralDataToHost(payload);
      }
    } catch (e) {
      // offline or startup
    }
  })();

  // 2. Subscribe to store changes to push to server and perform live mirror backup (debounced 400ms)
  let pushTimer: any = null;
  store.subscribe(() => {
    if (isInternalStoreUpdate) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      // Live instant auto backup to previously chosen path
      executeLiveAutoBackup(store);

      const payload = extractSyncableState(store.getState());
      await pushCentralDataToHost(payload);
    }, 400);
  });

  // 3. Periodic Background Polling (every 3 seconds)
  setInterval(async () => {
    try {
      const serverData = await fetchCentralDataFromHost();
      if (!serverData) return;

      const serverEmployees = serverData?.employees || (serverData?.state?.employees) || [];
      const currentEmployees = store.getState().employees || [];

      // Lightweight signature comparison to avoid unnecessary renders
      const serverSig = `${serverEmployees.length}-${serverEmployees[0]?.id}-${serverEmployees[0]?.updatedAt || ''}`;
      const currentSig = `${currentEmployees.length}-${currentEmployees[0]?.id}-${currentEmployees[0]?.updatedAt || ''}`;

      if (serverSig !== currentSig || (serverEmployees.length > 0 && currentEmployees.length === 0)) {
        applySyncableState(store, serverData);
      }
    } catch (e) {}
  }, 3000);
}
