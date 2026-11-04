import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type {
  GeneralSettings,
  LaunchAtStartupState,
  NotificationSettings,
} from './ipc-types.js';

export interface StoredPreferences {
  startMinimized: boolean;
  autoCheckUpdates: boolean;
  notifications: NotificationSettings;
  lunchReminderLastFiredDate: string | null;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  desktop: true,
  teamStatus: true,
  lunchReminder: true,
};

const DEFAULT_PREFERENCES: StoredPreferences = {
  startMinimized: false,
  autoCheckUpdates: true,
  notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  lunchReminderLastFiredDate: null,
};

let cachedPreferences: StoredPreferences | null = null;

function preferencesPath(): string {
  return path.join(app.getPath('userData'), 'preferences.json');
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Preferencias que el proceso main necesita antes de mostrar la ventana.
 * Se guardan en userData para que no dependan del localStorage del renderer.
 */
export function getPreferences(): StoredPreferences {
  if (cachedPreferences) return cachedPreferences;

  try {
    const raw = fs.readFileSync(preferencesPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    const notifications = parsed.notifications;

    cachedPreferences = {
      ...DEFAULT_PREFERENCES,
      startMinimized: parsed.startMinimized === true,
      autoCheckUpdates: readBoolean(
        parsed.autoCheckUpdates,
        DEFAULT_PREFERENCES.autoCheckUpdates,
      ),
      notifications: {
        desktop: readBoolean(
          notifications?.desktop,
          DEFAULT_NOTIFICATION_SETTINGS.desktop,
        ),
        teamStatus: readBoolean(
          notifications?.teamStatus,
          DEFAULT_NOTIFICATION_SETTINGS.teamStatus,
        ),
        lunchReminder: readBoolean(
          notifications?.lunchReminder,
          DEFAULT_NOTIFICATION_SETTINGS.lunchReminder,
        ),
      },
      lunchReminderLastFiredDate:
        typeof parsed.lunchReminderLastFiredDate === 'string'
          ? parsed.lunchReminderLastFiredDate
          : null,
    };
  } catch {
    cachedPreferences = {
      ...DEFAULT_PREFERENCES,
      notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
    };
  }

  return cachedPreferences;
}

export function updatePreferences(
  patch: Partial<StoredPreferences>,
): StoredPreferences {
  const next = { ...getPreferences(), ...patch };
  cachedPreferences = next;

  try {
    const file = preferencesPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.warn('No se pudieron guardar las preferencias de Electron:', error);
  }

  return next;
}

function canManageLaunchAtStartup(): boolean {
  return process.platform === 'win32' && app.isPackaged;
}

export function getLaunchAtStartupState(): LaunchAtStartupState {
  if (!canManageLaunchAtStartup()) {
    return { supported: false, enabled: false };
  }

  return {
    supported: true,
    enabled: app.getLoginItemSettings().openAtLogin,
  };
}

export function setLaunchAtStartup(enabled: boolean): LaunchAtStartupState {
  if (!canManageLaunchAtStartup()) {
    return getLaunchAtStartupState();
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
  });

  return getLaunchAtStartupState();
}

export function getGeneralSettings(): GeneralSettings {
  return {
    startMinimized: getPreferences().startMinimized,
    launchAtStartup: getLaunchAtStartupState(),
  };
}
