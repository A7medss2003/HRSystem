const fs = require('fs');
let file = fs.readFileSync('electron-main.cjs', 'utf8');

const ipcImports = `const { app, BrowserWindow, dialog, ipcMain } = require('electron');`;
file = file.replace(/const \{ app, BrowserWindow, dialog \} = require\('electron'\);/, ipcImports);

const ipcHandlers = `
// IPC Handlers for window controls
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

app.whenReady().then(() => {
`;
file = file.replace(/app\.whenReady\(\)\.then\(\(\) => \{/, ipcHandlers);

fs.writeFileSync('electron-main.cjs', file);
