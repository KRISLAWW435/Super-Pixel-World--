const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronPlatform', {
  isElectron: true,
  platform: process.platform,
});
