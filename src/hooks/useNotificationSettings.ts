import { useCallback, useEffect, useState } from "react";
import type {
  NotificationSettingKey,
  NotificationSettings,
  NotificationSettingsSnapshot,
} from "../../electron/ipc-types";

const DEFAULT_SETTINGS: NotificationSettings = {
  desktop: true,
  teamStatus: true,
  lunchReminder: true,
};

const DEFAULT_SNAPSHOT: NotificationSettingsSnapshot = {
  supported: false,
  settings: DEFAULT_SETTINGS,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface NotificationSettingsApi {
  settings: NotificationSettings;
  supported: boolean;
  loading: boolean;
  error: string | null;
  setSetting: (
    key: NotificationSettingKey,
    enabled: boolean,
  ) => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * Preferencias de notificación compartidas por Ajustes y los listeners de
 * eventos. El proceso main es la fuente de verdad y aquí solo se mantiene una
 * copia para la UI.
 */
export function useNotificationSettings(): NotificationSettingsApi {
  const [snapshot, setSnapshot] =
    useState<NotificationSettingsSnapshot>(DEFAULT_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.pisan?.notifications;

    if (!api) {
      setLoading(false);
      return;
    }

    void api
      .getSettings()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setSetting = useCallback(
    async (key: NotificationSettingKey, enabled: boolean) => {
      const api = window.pisan?.notifications;
      if (!api) return;

      setError(null);

      try {
        const next = await api.setSetting(key, enabled);
        setSnapshot(next);
      } catch (err: unknown) {
        setError(errorMessage(err));
      }
    },
    [],
  );

  const reset = useCallback(async () => {
    const api = window.pisan?.notifications;
    if (!api) return;

    setError(null);

    try {
      const next = await api.resetSettings();
      setSnapshot(next);
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, []);

  return {
    settings: snapshot.settings,
    supported: snapshot.supported,
    loading,
    error,
    setSetting,
    reset,
  };
}
