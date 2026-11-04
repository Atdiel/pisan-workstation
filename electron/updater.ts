import { app, BrowserWindow } from 'electron';
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
} from 'electron-updater';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { UpdateState } from './ipc-types.js';
import { getPreferences, updatePreferences } from './preferences.js';

const UPDATE_STATE_CHANNEL = 'updates:state';
const AUTO_CHECK_HOUR = 9;
const AUTO_CHECK_MINUTE = 0;
const AUTO_CHECK_GRACE_MINUTES = 15;

type UpdateAction = 'idle' | 'check' | 'download';
type UpdateTrigger = 'manual' | 'auto';

let initialized = false;
let autoCheckTimer: NodeJS.Timeout | null = null;
let action: UpdateAction = 'idle';
let installing = false;

function readFeedUrl(): string | null {
  const value = process.env.PISAN_UPDATE_FEED_URL?.trim();
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function hasPackagedUpdateConfig(): boolean {
  if (!app.isPackaged) return false;
  return existsSync(path.join(process.resourcesPath, 'app-update.yml'));
}

/**
 * El feed puede venir de `app-update.yml` (electron-builder lo genera a partir
 * del repositorio) o de `PISAN_UPDATE_FEED_URL` para pruebas con un servidor
 * genérico. La publicación de `latest.yml` y del release sigue siendo manual.
 */
function isUpdateFeedConfigured(): boolean {
  return readFeedUrl() !== null || hasPackagedUpdateConfig();
}

function createInitialState(): UpdateState {
  return {
    status: 'idle',
    currentVersion: app.getVersion(),
    availableVersion: null,
    progressPercent: null,
    message: null,
    lastCheckedAt: null,
    autoCheckEnabled: getPreferences().autoCheckUpdates,
    canCheck: app.isPackaged,
    feedConfigured: isUpdateFeedConfigured(),
  };
}

let state = createInitialState();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function snapshot(): UpdateState {
  state.currentVersion = app.getVersion();
  state.autoCheckEnabled = getPreferences().autoCheckUpdates;
  state.canCheck = app.isPackaged;
  state.feedConfigured = isUpdateFeedConfigured();
  return { ...state };
}

function publish(): void {
  const next = snapshot();

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(UPDATE_STATE_CHANNEL, next);
    }
  }
}

function setState(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch };
  publish();
}

function clearAutoCheckTimer(): void {
  if (!autoCheckTimer) return;
  clearTimeout(autoCheckTimer);
  autoCheckTimer = null;
}

function msUntilNextAutoCheck(now = new Date()): number {
  const next = new Date(now);
  next.setHours(AUTO_CHECK_HOUR, AUTO_CHECK_MINUTE, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function runScheduledAutoCheck(): void {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = AUTO_CHECK_HOUR * 60 + AUTO_CHECK_MINUTE;

  // Si el equipo estuvo suspendido y el timer despertó fuera de la ventana,
  // no se hace un chequeo tardío: se espera a la siguiente ocurrencia.
  if (
    currentMinutes < targetMinutes ||
    currentMinutes > targetMinutes + AUTO_CHECK_GRACE_MINUTES
  ) {
    scheduleNextAutoCheck();
    return;
  }

  void checkForUpdates('auto').finally(() => {
    scheduleNextAutoCheck();
  });
}

function scheduleNextAutoCheck(): void {
  clearAutoCheckTimer();

  if (!getPreferences().autoCheckUpdates) return;

  const delay = Math.max(1_000, msUntilNextAutoCheck());

  autoCheckTimer = setTimeout(() => {
    autoCheckTimer = null;
    runScheduledAutoCheck();
  }, delay);
  autoCheckTimer.unref?.();
}

const COMPROBACION_FALLIDA =
  'No se pudo comprobar la actualización. Revisa tu conexión e inténtalo de nuevo.';
const DESCARGA_FALLIDA =
  'No se pudo descargar la actualización. Revisa tu conexión e inténtalo de nuevo.';
const CANAL_SIN_METADATOS =
  'El canal de actualizaciones aún no está publicado. Se habilitará con el próximo release.';

function checkFailureMessage(error: unknown): string {
  const detail = errorMessage(error).toLowerCase();

  if (
    detail.includes('404') ||
    detail.includes('latest.yml') ||
    detail.includes('app-update.yml')
  ) {
    return CANAL_SIN_METADATOS;
  }

  return COMPROBACION_FALLIDA;
}

function registerUpdaterEvents(): void {
  autoUpdater.on('checking-for-update', () => {
    action = 'check';
    setState({
      status: 'checking',
      progressPercent: null,
      message: 'Buscando actualizaciones...',
    });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    setState({
      status: 'available',
      availableVersion: info.version,
      progressPercent: null,
      message: `Nueva versión ${info.version} disponible.`,
      lastCheckedAt: new Date().toISOString(),
    });
  });

  autoUpdater.on('update-not-available', () => {
    setState({
      status: 'up-to-date',
      availableVersion: null,
      progressPercent: null,
      message: 'Ya tienes la versión más reciente.',
      lastCheckedAt: new Date().toISOString(),
    });
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    const percent = Math.max(0, Math.min(100, Math.round(progress.percent)));
    setState({
      status: 'downloading',
      progressPercent: percent,
      message: `Descargando actualización (${percent}%).`,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
    setState({
      status: 'downloaded',
      availableVersion: info.version,
      progressPercent: 100,
      message: 'Actualización lista para instalar.',
      lastCheckedAt: new Date().toISOString(),
    });
  });

  autoUpdater.on('error', (error: Error) => {
    console.warn('[updater] Error de actualización:', errorMessage(error));
    setState({
      status: 'error',
      progressPercent: null,
      message:
        action === 'download'
          ? DESCARGA_FALLIDA
          : checkFailureMessage(error),
      lastCheckedAt: new Date().toISOString(),
    });
  });
}

export function initializeUpdater(): void {
  if (initialized) return;
  initialized = true;

  state = createInitialState();
  installing = false;
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;

  const feedUrl = readFeedUrl();
  if (feedUrl) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl });
  }

  registerUpdaterEvents();
  publish();
  scheduleNextAutoCheck();
}

export function stopUpdateScheduler(): void {
  clearAutoCheckTimer();
}

export function getUpdateState(): UpdateState {
  return snapshot();
}

export async function checkForUpdates(
  trigger: UpdateTrigger = 'manual',
): Promise<UpdateState> {
  if (state.status === 'checking' || state.status === 'downloading') {
    return snapshot();
  }

  if (!app.isPackaged) {
    setState({
      status: 'unsupported',
      progressPercent: null,
      message: 'Las actualizaciones se comprueban desde la app instalada.',
      lastCheckedAt: new Date().toISOString(),
    });
    return snapshot();
  }

  if (!isUpdateFeedConfigured()) {
    setState({
      status: 'not-configured',
      progressPercent: null,
      message:
        'El canal de actualizaciones se habilitará cuando se publique el próximo release.',
      lastCheckedAt: new Date().toISOString(),
    });
    return snapshot();
  }

  action = 'check';
  setState({
    status: 'checking',
    progressPercent: null,
    message:
      trigger === 'auto'
        ? 'Buscando la actualización programada...'
        : 'Buscando actualizaciones...',
  });

  try {
    const result = await autoUpdater.checkForUpdates();

    if (!result) {
      setState({
        status: 'unsupported',
        progressPercent: null,
        message: 'Las actualizaciones no están disponibles en este entorno.',
        lastCheckedAt: new Date().toISOString(),
      });
      return snapshot();
    }

    if (result.isUpdateAvailable) {
      setState({
        status: 'available',
        availableVersion: result.updateInfo.version,
        progressPercent: null,
        message: `Nueva versión ${result.updateInfo.version} disponible.`,
        lastCheckedAt: new Date().toISOString(),
      });
    } else if (snapshot().status === 'checking') {
      setState({
        status: 'up-to-date',
        availableVersion: null,
        progressPercent: null,
        message: 'Ya tienes la versión más reciente.',
        lastCheckedAt: new Date().toISOString(),
      });
    }

    return snapshot();
  } catch (error: unknown) {
    console.warn('[updater] No se pudo comprobar:', errorMessage(error));

    if (snapshot().status !== 'error') {
      setState({
        status: 'error',
        progressPercent: null,
        message: checkFailureMessage(error),
        lastCheckedAt: new Date().toISOString(),
      });
    }

    return snapshot();
  }
}

export async function downloadUpdate(): Promise<UpdateState> {
  if (state.status !== 'available') {
    return snapshot();
  }

  action = 'download';
  setState({
    status: 'downloading',
    progressPercent: 0,
    message: 'Descargando actualización...',
  });

  try {
    await autoUpdater.downloadUpdate();

    const current = snapshot();
    if (current.status !== 'downloaded' && current.status !== 'error') {
      setState({
        status: 'downloaded',
        progressPercent: 100,
        message: 'Actualización lista para instalar.',
        lastCheckedAt: new Date().toISOString(),
      });
    }
  } catch (error: unknown) {
    console.warn('[updater] No se pudo descargar:', errorMessage(error));

    if (snapshot().status !== 'error') {
      setState({
        status: 'error',
        progressPercent: null,
        message: DESCARGA_FALLIDA,
      });
    }
  }

  return snapshot();
}

export function installUpdate(): void {
  if (state.status !== 'downloaded' || installing) return;

  installing = true;

  // Se espera un instante para que el IPC responda antes de cerrar la app.
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 250);
}

export function setAutoCheck(enabled: boolean): UpdateState {
  updatePreferences({ autoCheckUpdates: enabled });

  if (enabled) {
    scheduleNextAutoCheck();
  } else {
    clearAutoCheckTimer();
  }

  setState({ autoCheckEnabled: enabled });
  return snapshot();
}
