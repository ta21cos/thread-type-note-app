import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

// NOTE: Hardcoded URL to load in the Electron window
const APP_URL = 'https://thread.tellusium.com';

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Thread Note',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // NOTE: Load the hardcoded URL
  mainWindow.loadURL(APP_URL).catch((err) => {
    console.error('Failed to load URL:', err);
    // NOTE: Load fallback renderer if URL fails
    mainWindow?.loadFile(join(__dirname, '../renderer/index.html'));
  });

  // NOTE: Open DevTools in development mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
