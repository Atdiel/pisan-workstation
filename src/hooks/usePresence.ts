import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStatusSnapshot,
  updateMyStatus,
} from "../services/status.service";
import type {
  StatusSnapshot,
  UserStatusEntry,
  UserStatusType,
  WorkScheduleInfo,
} from "../types/status";
import { useStatusSocket } from "./useStatusSocket";

const DEFAULT_SCHEDULE: WorkScheduleInfo = {
  start: "09:00",
  end: "18:00",
  lunchStart: "14:00",
  timezone: "America/Mexico_City",
  days: [1, 2, 3, 4, 5],
  withinSchedule: true,
};

export interface PresenceApi {
  entriesById: Record<string, UserStatusEntry>;
  workSchedule: WorkScheduleInfo;
  loading: boolean;
  error: string | null;
  updateStatus: (
    status: UserStatusType,
    activity?: string,
  ) => Promise<UserStatusEntry>;
}

/**
 * Estado del equipo en tiempo real. El backend calcula el estado efectivo y lo
 * difunde por WebSocket; aquí solo se mantiene la copia para la UI.
 *
 * `enabled` evita abrir el socket antes de tener sesión.
 */
export function usePresence(enabled: boolean): PresenceApi {
  const [entriesById, setEntriesById] = useState<
    Record<string, UserStatusEntry>
  >({});
  const [workSchedule, setWorkSchedule] =
    useState<WorkScheduleInfo>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const socketSnapshotReceived = useRef(false);

  const applySnapshot = useCallback((snapshot: StatusSnapshot) => {
    setEntriesById(
      Object.fromEntries(
        snapshot.entries.map((entry) => [entry.userId, entry]),
      ),
    );
    setWorkSchedule(snapshot.workSchedule);
  }, []);

  const handleChanged = useCallback((entry: UserStatusEntry) => {
    setEntriesById((prev) => ({ ...prev, [entry.userId]: entry }));
  }, []);

  const handleSnapshot = useCallback(
    (snapshot: StatusSnapshot) => {
      socketSnapshotReceived.current = true;
      applySnapshot(snapshot);
    },
    [applySnapshot],
  );

  useEffect(() => {
    if (!enabled) {
      setEntriesById({});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    socketSnapshotReceived.current = false;
    setLoading(true);

    fetchStatusSnapshot()
      .then((snapshot) => {
        // Si el socket ya entregó una foto más reciente, no la pisa el HTTP.
        if (!cancelled && !socketSnapshotReceived.current) {
          applySnapshot(snapshot);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, applySnapshot]);

  useStatusSocket(enabled, handleChanged, handleSnapshot);

  const updateStatus = useCallback(
    async (status: UserStatusType, activity?: string) => {
      const entry = await updateMyStatus(status, activity);
      setEntriesById((prev) => ({ ...prev, [entry.userId]: entry }));
      return entry;
    },
    [],
  );

  return {
    entriesById,
    workSchedule,
    loading,
    error,
    updateStatus,
  };
}
