// ===== Electron: processo principal =====
const { app, BrowserWindow } = require('electron');
const path = require('path');

function criarJanela() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    webPreferences: { contextIsolation: true }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  criarJanela();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
