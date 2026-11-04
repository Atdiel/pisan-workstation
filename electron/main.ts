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
import {
  getGeneralSettings,
  getPreferences,
  setLaunchAtStartup,
  updatePreferences,
} from './preferences.js';
import {
  clearLunchReminder,
  getNotificationSettingsSnapshot,
  resetNotificationSettings,
  scheduleLunchReminder,
  showNotification,
  updateNotificationSettings,
} from './notifications.js';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  initializeUpdater,
  installUpdate,
  setAutoCheck,
  stopUpdateScheduler,
} from './updater.js';
import type {
  DesktopNotificationPayload,
  LunchReminderPayload,
  NotificationSettingKey,
} from './ipc-types.js';
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
  ipcMain.handle('auth:logout', async () => {
    clearLunchReminder();
    await authManager.logout();
  });
  ipcMain.handle('device:get-info', () => getDeviceInfo());

  ipcMain.handle('updates:get-state', () => getUpdateState());
  ipcMain.handle('updates:check', () => checkForUpdates('manual'));
  ipcMain.handle('updates:download', () => downloadUpdate());
  ipcMain.handle('updates:install', () => installUpdate());
  ipcMain.handle('updates:set-auto-check', (_event, enabled: boolean) =>
    setAutoCheck(enabled === true),
  );

  ipcMain.handle('settings:get-general', () => getGeneralSettings());
  ipcMain.handle('settings:set-start-minimized', (_event, enabled: boolean) => {
    updatePreferences({ startMinimized: enabled === true });
    return getGeneralSettings();
  });
  ipcMain.handle(
    'settings:set-launch-at-startup',
    (_event, enabled: boolean) => {
      setLaunchAtStartup(enabled === true);
      return getGeneralSettings();
    },
  );

  ipcMain.handle('notifications:get-settings', () =>
    getNotificationSettingsSnapshot(),
  );
  ipcMain.handle(
    'notifications:set-setting',
    (_event, key: NotificationSettingKey, enabled: boolean) =>
      updateNotificationSettings({ [key]: enabled === true }),
  );
  ipcMain.handle('notifications:reset-settings', () =>
    resetNotificationSettings(),
  );
  ipcMain.handle(
    'notifications:show',
    (_event, payload: DesktopNotificationPayload) =>
      showNotification(payload),
  );
  ipcMain.handle(
    'notifications:schedule-lunch',
    (_event, payload: LunchReminderPayload) => scheduleLunchReminder(payload),
  );
  ipcMain.handle('notifications:clear-lunch', () => {
    clearLunchReminder();
  });

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
  const startMinimized = getPreferences().startMinimized;

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    show: !startMinimized,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (startMinimized) {
    // Se muestra sin robar el foco y se minimiza inmediatamente para que
    // aparezca en la barra de tareas. No se oculta en la bandeja del sistema.
    win.once('ready-to-show', () => {
      if (!win) return;
      win.setSkipTaskbar(false);
      win.showInactive();
      win.minimize();
    });
  }

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

app.on('before-quit', () => {
  stopUpdateScheduler();
});

// Configuración para notificaciones nativas en Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.pisantech.workstation');
}

app.whenReady().then(() => {
  registerIpcHandlers();
  initializeUpdater();
  if (process.platform === 'darwin') {
    app.dock?.setIcon(path.join(process.env.VITE_PUBLIC, 'icon.png'));
  }
  createWindow();
});
