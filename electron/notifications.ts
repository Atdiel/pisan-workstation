import { BrowserWindow, Notification } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type {
  DesktopNotificationPayload,
  LunchReminderPayload,
  NotificationCategory,
  NotificationSettingKey,
  NotificationSettings,
  NotificationSettingsSnapshot,
  NotificationView,
} from './ipc-types.js';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getPreferences,
  updatePreferences,
} from './preferences.js';

const LUNCH_LATE_MS = 10 * 60 * 1000;
const MAX_LUNCH_DELAY_MS = 25 * 60 * 60 * 1000;

const NOTIFICATION_VIEWS = new Set<NotificationView>([
  'dashboard',
  'status',
  'vault',
  'planner',
  'feed',
  'admin',
  'profile',
  'settings',
]);

const NOTIFICATION_KEYS = new Set<NotificationSettingKey>([
  'desktop',
  'teamStatus',
  'lunchReminder',
]);

let lunchTimer: ReturnType<typeof setTimeout> | null = null;
const activeNotifications = new Set<Notification>();

function notificationIconPath(): string | undefined {
  const candidates = [
    process.env.VITE_PUBLIC
      ? path.join(process.env.VITE_PUBLIC, 'icon.png')
      : null,
    process.env.APP_ROOT
      ? path.join(process.env.APP_ROOT, 'public', 'icon.png')
      : null,
  ];

  return candidates.find(
    (candidate): candidate is string =>
      candidate !== null && fs.existsSync(candidate),
  );
}

function getMainWindow(): BrowserWindow | null {
  return (
    BrowserWindow.getAllWindows().find((window) => !window.isDestroyed()) ??
    null
  );
}

function focusMainWindow(): void {
  const target = getMainWindow();
  if (!target) return;

  if (target.isMinimized()) target.restore();
  target.show();
  target.focus();
}

function navigateTo(view: NotificationView): void {
  focusMainWindow();

  const target = getMainWindow();
  if (!target) return;

  target.webContents.send('notifications:navigate', view);
}

function safeView(view: NotificationView): NotificationView {
  return NOTIFICATION_VIEWS.has(view) ? view : 'status';
}

function safeCategory(category: NotificationCategory): NotificationCategory {
  if (category === 'team' || category === 'lunch') return category;
  return 'system';
}

function categoryEnabled(category: NotificationCategory): boolean {
  const { notifications } = getPreferences();
  if (!notifications.desktop) return false;
  if (category === 'team') return notifications.teamStatus;
  if (category === 'lunch') return notifications.lunchReminder;
  return true;
}

export function getNotificationSettingsSnapshot(): NotificationSettingsSnapshot {
  return {
    supported: Notification.isSupported(),
    settings: { ...getPreferences().notifications },
  };
}

export function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): NotificationSettingsSnapshot {
  const current = getPreferences();
  const next: NotificationSettings = {
    ...current.notifications,
  };

  for (const key of NOTIFICATION_KEYS) {
    if (typeof patch[key] === 'boolean') {
      next[key] = patch[key] as boolean;
    }
  }

  updatePreferences({ notifications: next });

  if (!next.desktop || !next.lunchReminder) {
    clearLunchReminder();
  }

  return getNotificationSettingsSnapshot();
}

export function resetNotificationSettings(): NotificationSettingsSnapshot {
  // El último aviso enviado es estado operativo, no una preferencia: se
  // conserva para que restablecer Ajustes no duplique el recordatorio del día.
  updatePreferences({
    notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  });
  clearLunchReminder();
  return getNotificationSettingsSnapshot();
}

/**
 * Muestra una notificación nativa. La configuración se revisa aquí para que
 * ningún evento del renderer pueda saltarse el interruptor maestro.
 */
export function showNotification(
  payload: DesktopNotificationPayload,
): boolean {
  if (!Notification.isSupported()) return false;
  if (
    !payload ||
    typeof payload.title !== 'string' ||
    typeof payload.body !== 'string'
  ) {
    return false;
  }

  const category = safeCategory(payload.category);
  if (!categoryEnabled(category)) return false;

  const title = payload.title.trim().slice(0, 160);
  const body = payload.body.trim().slice(0, 500);
  if (!title) return false;

  const view = safeView(payload.view);
  const icon = notificationIconPath();
  const notification = new Notification({
    title,
    body,
    ...(icon ? { icon } : {}),
  });

  activeNotifications.add(notification);

  const cleanup = () => {
    activeNotifications.delete(notification);
  };

  notification.on('close', cleanup);
  notification.on('click', () => {
    cleanup();
    navigateTo(view);
  });
  notification.show();

  return true;
}

export function scheduleLunchReminder(
  payload: LunchReminderPayload,
): boolean {
  clearLunchReminder();

  if (!Notification.isSupported()) return false;

  const preferences = getPreferences();
  if (
    !preferences.notifications.desktop ||
    !preferences.notifications.lunchReminder
  ) {
    return false;
  }

  if (
    !payload ||
    typeof payload.dateKey !== 'string' ||
    typeof payload.title !== 'string' ||
    typeof payload.body !== 'string'
  ) {
    return false;
  }

  if (preferences.lunchReminderLastFiredDate === payload.dateKey) {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.dateKey) ||
    !Number.isFinite(payload.delayMs) ||
    payload.delayMs < 0 ||
    payload.delayMs > MAX_LUNCH_DELAY_MS
  ) {
    return false;
  }

  const scheduledFor = Date.now() + payload.delayMs;

  lunchTimer = setTimeout(() => {
    lunchTimer = null;

    const current = getPreferences();
    if (
      !current.notifications.desktop ||
      !current.notifications.lunchReminder
    ) {
      return;
    }

    if (current.lunchReminderLastFiredDate === payload.dateKey) return;

    // Si el equipo estuvo suspendido y el timer despertó tarde, evitamos un
    // aviso fuera de contexto.
    if (Date.now() - scheduledFor > LUNCH_LATE_MS) return;

    const shown = showNotification({
      title: payload.title,
      body: payload.body,
      category: 'lunch',
      view: payload.view,
    });

    if (shown) {
      updatePreferences({ lunchReminderLastFiredDate: payload.dateKey });
    }
  }, payload.delayMs);

  lunchTimer.unref?.();
  return true;
}

export function clearLunchReminder(): void {
  if (!lunchTimer) return;
  clearTimeout(lunchTimer);
  lunchTimer = null;
}
