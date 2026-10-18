const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Register custom scheme 'app' as privileged before app is ready.
// This is essential for:
// - standard scheme rules (relative URLs, URL parsing)
// - secure (treated as HTTPS-like, bypassing mixed content warnings)
// - supportFetchAPI (fetch() works seamlessly)
// - corsEnabled (zero CORS issues for local audio/images)
// - stream (supports audio Range requests and streaming)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    minWidth: 960,
    minHeight: 600,
    title: 'Super Pixel World',
    icon: path.join(__dirname, '..', 'build', 'Create_game_icon_.ico'),
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    show: false, // Prevents white flash before rendering
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the web app via the custom privileged app:// protocol
  mainWindow.loadURL('app://bundle/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Protocol handler for app://bundle/*
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let relativePath = decodeURIComponent(url.pathname);
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1);
    }
    if (!relativePath || relativePath === '') {
      relativePath = 'index.html';
    }

    const distPath = path.join(__dirname, '..', 'dist');
    const filePath = path.join(distPath, relativePath);

    // Safeguard against path traversal
    if (!filePath.startsWith(distPath)) {
      return new Response('Forbidden', { status: 403 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

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
