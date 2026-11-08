const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe Electron APIs to window.electronAPI and window.electron
 * Supporting both modern contextBridge and direct IPC invoke
 */
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    getScannersList: () => ipcRenderer.invoke('get-scanners-list'),
    scanFromDevice: (scannerName) => ipcRenderer.invoke('scan-from-device', scannerName),
    scanDocument: (options) => ipcRenderer.invoke('scan-document', options),
    selectScannerDialog: () => ipcRenderer.invoke('select-scanner-dialog'),
    resetToOriginal: () => ipcRenderer.invoke('app:reset-to-original'),
    relaunch: () => ipcRenderer.invoke('app:relaunch')
  });

  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel, data) => ipcRenderer.send(channel, data),
      on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
      invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
    }
  });
} catch (e) {
  // If contextIsolation is false or already exposed, assign directly to window
  if (typeof window !== 'undefined') {
    window.electronAPI = {
      getScannersList: () => ipcRenderer.invoke('get-scanners-list'),
      scanFromDevice: (scannerName) => ipcRenderer.invoke('scan-from-device', scannerName),
      scanDocument: (options) => ipcRenderer.invoke('scan-document', options),
      selectScannerDialog: () => ipcRenderer.invoke('select-scanner-dialog'),
      resetToOriginal: () => ipcRenderer.invoke('app:reset-to-original'),
      relaunch: () => ipcRenderer.invoke('app:relaunch')
    };
  }
}

