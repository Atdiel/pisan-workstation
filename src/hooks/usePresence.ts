import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStatusSnapshot,
  updateMyStatus,
} from "../services/status.service";
import type {
  StatusChangeEvent,
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
  lastStatusChange: StatusChangeEvent | null;
  refresh: () => Promise<void>;
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
  const [lastStatusChange, setLastStatusChange] =
    useState<StatusChangeEvent | null>(null);
  const entriesRef = useRef<Record<string, UserStatusEntry>>({});
  const statusChangeId = useRef(0);
  const socketSnapshotReceived = useRef(false);

  const applySnapshot = useCallback((snapshot: StatusSnapshot) => {
    const next = Object.fromEntries(
      snapshot.entries.map((entry) => [entry.userId, entry]),
    ) as Record<string, UserStatusEntry>;

    entriesRef.current = next;
    setEntriesById(next);
    setWorkSchedule(snapshot.workSchedule);
  }, []);

  const handleChanged = useCallback((entry: UserStatusEntry) => {
    const previous = entriesRef.current[entry.userId];
    const next = { ...entriesRef.current, [entry.userId]: entry };

    entriesRef.current = next;
    setEntriesById(next);

    statusChangeId.current += 1;
    setLastStatusChange({
      id: statusChangeId.current,
      entry,
      previous,
    });
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
      entriesRef.current = {};
      setEntriesById({});
      setLastStatusChange(null);
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

  /** Fuerza una foto actual; sirve al volver a la pestaña de estado. */
  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      applySnapshot(await fetchStatusSnapshot());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [enabled, applySnapshot]);

  const updateStatus = useCallback(
    async (status: UserStatusType, activity?: string) => {
      const entry = await updateMyStatus(status, activity);
      const next = { ...entriesRef.current, [entry.userId]: entry };

      entriesRef.current = next;
      setEntriesById(next);
      return entry;
    },
    [],
  );

  return {
    entriesById,
    workSchedule,
    loading,
    error,
    lastStatusChange,
    refresh,
    updateStatus,
  };
}
