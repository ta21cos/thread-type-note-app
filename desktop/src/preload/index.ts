import { contextBridge } from 'electron';

// NOTE: Expose Electron APIs to renderer process if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  // NOTE: Placeholder for future APIs
  platform: process.platform,
});
