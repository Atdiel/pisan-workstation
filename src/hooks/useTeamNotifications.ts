import { useEffect, useRef } from "react";
import type { NotificationSettings } from "../../electron/ipc-types";
import type { StatusChangeEvent } from "../types/status";
import { describeTeamStatusChange } from "../utils/notificationMessages";

const PER_USER_THROTTLE_MS = 10_000;

interface UseTeamNotificationsOptions {
  change: StatusChangeEvent | null;
  currentUserId?: string;
  settings: NotificationSettings | null;
  activeTab: string;
  timeZone: string;
}

/**
 * Traduce los eventos puntuales del socket en notificaciones nativas. Se
 * ejecuta solo para `statusChanged`, por lo que una foto inicial o una
 * reconexión no genera avisos masivos.
 */
export function useTeamNotifications({
  change,
  currentUserId,
  settings,
  activeTab,
  timeZone,
}: UseTeamNotificationsOptions): void {
  const lastProcessedId = useRef(0);
  const lastNotifiedByUser = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!change || change.id === lastProcessedId.current) return;

    lastProcessedId.current = change.id;

    if (!currentUserId || change.entry.userId === currentUserId) return;
    if (!settings?.desktop || !settings.teamStatus) return;
    if (document.hasFocus() && activeTab === "status") return;

    const userKey = change.entry.userId;
    const now = Date.now();
    const lastNotifiedAt = lastNotifiedByUser.current[userKey] ?? 0;

    if (now - lastNotifiedAt < PER_USER_THROTTLE_MS) return;

    const message = describeTeamStatusChange(
      change.entry,
      change.previous,
      timeZone,
    );
    if (!message) return;

    const api = window.pisan?.notifications;
    if (!api) return;

    lastNotifiedByUser.current[userKey] = now;

    void api
      .show({
        ...message,
        category: "team",
        view: "status",
      })
      .catch((error: unknown) => {
        console.warn(
          "No se pudo mostrar la notificación de equipo:",
          error,
        );
      });
  }, [activeTab, change, currentUserId, settings, timeZone]);
}
