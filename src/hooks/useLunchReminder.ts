import { useEffect } from "react";
import type { NotificationSettings } from "../../electron/ipc-types";
import type { PresenceStatus, WorkScheduleInfo } from "../types/status";
import { buildLunchReminderPlan } from "../utils/notificationMessages";

interface UseLunchReminderOptions {
  authenticated: boolean;
  ready: boolean;
  settings: NotificationSettings | null;
  schedule: WorkScheduleInfo;
  dateKey: string;
  status: PresenceStatus;
  lastLunchDate: string | null;
}

/**
 * Programa en el proceso main el recordatorio diario de comida. El main
 * conserva el timer aunque la ventana esté minimizada y revisa de nuevo la
 * configuración al momento de mostrar el aviso.
 */
export function useLunchReminder({
  authenticated,
  ready,
  settings,
  schedule,
  dateKey,
  status,
  lastLunchDate,
}: UseLunchReminderOptions): void {
  useEffect(() => {
    const api = window.pisan?.notifications;
    if (!api) return;

    const clear = () => {
      void api.clearLunch().catch((error: unknown) => {
        console.warn("No se pudo cancelar el recordatorio de comida:", error);
      });
    };

    if (
      !authenticated ||
      !ready ||
      !dateKey ||
      !settings?.desktop ||
      !settings.lunchReminder
    ) {
      clear();
      return;
    }

    const plan = buildLunchReminderPlan(
      new Date(),
      schedule,
      status,
      lastLunchDate,
    );

    if (!plan) {
      clear();
      return;
    }

    void api
      .scheduleLunch({
        delayMs: plan.delayMs,
        dateKey: plan.dateKey,
        title: plan.title,
        body: plan.body,
        view: "status",
      })
      .catch((error: unknown) => {
        console.warn("No se pudo programar el recordatorio de comida:", error);
      });
  }, [
    authenticated,
    dateKey,
    lastLunchDate,
    ready,
    schedule,
    settings,
    status,
  ]);
}
