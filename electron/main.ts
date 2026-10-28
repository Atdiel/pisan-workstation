import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { authManager } from './auth.js';
import { getDeviceInfo } from './device.js';
import {
  getPlannerTaskDetails,
  listPlannerTasks,
  updatePlannerTask,
  updatePlannerTaskDetails,
} from './planner.js';
import { clearLunchPresence, setLunchPresence } from './teams.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function registerIpcHandlers(): void {
  ipcMain.handle('auth:get-session', () => authManager.getSession());
  ipcMain.handle('auth:login', () => authManager.login());
  ipcMain.handle('auth:get-id-token', () => authManager.getIdToken());
  ipcMain.handle('auth:logout', () => authManager.logout());
  ipcMain.handle('device:get-info', () => getDeviceInfo());

  ipcMain.handle('planner:list-tasks', () => listPlannerTasks());
  ipcMain.handle('planner:get-task-details', (_event, taskId: string) =>
    getPlannerTaskDetails(taskId),
  );
  ipcMain.handle(
    'planner:update-task',
    (_event, taskId: string, patch: Parameters<typeof updatePlannerTask>[1]) =>
      updatePlannerTask(taskId, patch),
  );
  ipcMain.handle(
    'planner:update-task-details',
    (
      _event,
      taskId: string,
      patch: Parameters<typeof updatePlannerTaskDetails>[1],
    ) => updatePlannerTaskDetails(taskId, patch),
  );

  ipcMain.handle('teams:start-lunch', (_event, endsAt: string) =>
    setLunchPresence(endsAt),
  );
  ipcMain.handle('teams:end-lunch', () => clearLunchPresence());
}

function createWindow(): void {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configuración para notificaciones nativas en Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.pisantech.workstation');
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});
