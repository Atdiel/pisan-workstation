import { useCallback, useEffect, useState } from "react";
import type { UpdateState } from "../../electron/ipc-types";

const DEFAULT_STATE: UpdateState = {
  status: "idle",
  currentVersion: "",
  availableVersion: null,
  progressPercent: null,
  message: null,
  lastCheckedAt: null,
  autoCheckEnabled: true,
  canCheck: false,
  feedConfigured: false,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface UpdatesApi {
  state: UpdateState;
  loading: boolean;
  error: string | null;
  check: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
  setAutoCheck: (enabled: boolean) => Promise<void>;
}

/**
 * Estado de actualizaciones compartido por Ajustes y el footer. El proceso main
 * es la fuente de verdad; aquí solo se replica por IPC.
 */
export function useUpdates(): UpdatesApi {
  const [state, setState] = useState<UpdateState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.pisan?.updates;

    if (!api) {
      setLoading(false);
      return;
    }

    const unsubscribe = api.onState((next) => {
      if (!cancelled) setState(next);
    });

    void api
      .getState()
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const check = useCallback(async () => {
    const api = window.pisan?.updates;
    if (!api) return;

    setError(null);

    try {
      setState(await api.check());
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, []);

  const download = useCallback(async () => {
    const api = window.pisan?.updates;
    if (!api) return;

    setError(null);

    try {
      setState(await api.download());
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, []);

  const install = useCallback(async () => {
    const api = window.pisan?.updates;
    if (!api) return;

    setError(null);

    try {
      await api.install();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, []);

  const setAutoCheck = useCallback(async (enabled: boolean) => {
    const api = window.pisan?.updates;
    if (!api) return;

    setError(null);

    try {
      setState(await api.setAutoCheck(enabled));
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }, []);

  return {
    state,
    loading,
    error,
    check,
    download,
    install,
    setAutoCheck,
  };
}
