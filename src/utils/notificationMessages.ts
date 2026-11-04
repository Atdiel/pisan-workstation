import type {
  PresenceStatus,
  UserStatusEntry,
  WorkScheduleInfo,
} from "../types/status";
import { getZonedClock, parseTimeToMinutes } from "./workTime";

export interface NotificationMessage {
  title: string;
  body: string;
}

export interface LunchReminderPlan {
  dateKey: string;
  delayMs: number;
  title: string;
  body: string;
}

/** Tiempo máximo para mostrar el aviso si la app se abre tarde. */
export const LUNCH_GRACE_MINUTES = 10;

function formatTimeInZone(
  value: string | null,
  timeZone: string,
): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-MX", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function weekdayFromDateKey(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

/**
 * Convierte un cambio puntual del socket en un mensaje útil. Se ignoran las
 * transiciones hacia/desde OFFLINE para no avisar reconexiones o desconexiones.
 */
export function describeTeamStatusChange(
  entry: UserStatusEntry,
  previous: UserStatusEntry | undefined,
  timeZone: string,
): NotificationMessage | null {
  if (!previous || previous.status === entry.status) return null;
  if (previous.status === "OFFLINE" || entry.status === "OFFLINE") return null;

  const name = entry.name.trim() || "Un compañero";

  if (entry.status === "IN_LUNCH") {
    const until = formatTimeInZone(entry.lunchUntil, timeZone);
    return {
      title: `${name} está en comida`,
      body: until
        ? `En comida hasta las ${until}.`
        : "Inició su pausa de comida.",
    };
  }

  if (entry.status === "AWAY") {
    return {
      title: `${name} está ausente`,
      body: entry.activity?.trim() || "Cambió su disponibilidad.",
    };
  }

  if (entry.status === "AVAILABLE") {
    if (previous.status === "IN_LUNCH") {
      return {
        title: `${name} terminó su comida`,
        body: "Ya está disponible.",
      };
    }

    if (previous.status === "AWAY") {
      return {
        title: `${name} está disponible`,
        body: "Volvió a estar disponible.",
      };
    }
  }

  return null;
}

/**
 * Calcula el siguiente recordatorio de comida. Solo cubre la ocurrencia de hoy
 * y deja que el cambio de día vuelva a evaluar el horario.
 */
export function buildLunchReminderPlan(
  now: Date,
  schedule: WorkScheduleInfo,
  status: PresenceStatus,
  lastLunchDate: string | null,
): LunchReminderPlan | null {
  const clock = getZonedClock(now, schedule.timezone);
  const lunchStart = parseTimeToMinutes(schedule.lunchStart);
  const workStart = parseTimeToMinutes(schedule.start);
  const workEnd = parseTimeToMinutes(schedule.end);

  if (
    !Number.isFinite(lunchStart) ||
    !Number.isFinite(workStart) ||
    !Number.isFinite(workEnd)
  ) {
    return null;
  }

  const weekday = weekdayFromDateKey(clock.dateKey);
  if (!schedule.days.includes(weekday)) return null;
  if (clock.minutes < workStart || clock.minutes >= workEnd) return null;
  if (status === "IN_LUNCH") return null;
  if (lastLunchDate === clock.dateKey) return null;

  const secondsSinceMidnight = clock.minutes * 60 + now.getSeconds();
  const lunchStartSeconds = lunchStart * 60;
  if (
    secondsSinceMidnight >
    lunchStartSeconds + LUNCH_GRACE_MINUTES * 60
  ) {
    return null;
  }

  const delayMs =
    secondsSinceMidnight >= lunchStartSeconds
      ? 0
      : Math.max(
          0,
          (lunchStartSeconds - secondsSinceMidnight) * 1_000 -
            now.getMilliseconds(),
        );

  return {
    dateKey: clock.dateKey,
    delayMs,
    title: "Hora de comer",
    body: `Tu pausa comienza a las ${schedule.lunchStart}. Cuando estés listo, marca tu comida.`,
  };
}
