import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { startServer } from '../server/index';

let mainWindow: BrowserWindow | null = null;
let serverPort: number = 3001;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, isDev ? '../main/preload.js' : 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: join(__dirname, '../build/icon.png'),
    titleBarStyle: 'default',
  });

  // Start backend server
  startServer(serverPort).then((port) => {
    serverPort = port;
    console.log(`Backend server started on port ${port}`);
    
    // Load the app
    if (isDev) {
      mainWindow?.loadURL('http://localhost:5173');
      mainWindow?.webContents.openDevTools();
    } else {
      mainWindow?.loadFile(join(__dirname, '../dist/renderer/index.html'));
    }
  }).catch((error) => {
    console.error('Failed to start server:', error);
    app.quit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// IPC handlers for API calls
ipcMain.handle('api-request', async (event, { method, url, data, headers }) => {
  try {
    const response = await fetch(`http://localhost:${serverPort}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    const result = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data: result,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 500,
      error: error.message,
    };
  }
});

ipcMain.handle('get-server-port', () => {
  return serverPort;
});

