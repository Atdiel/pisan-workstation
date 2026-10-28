export interface ZonedClock {
  /** Minutos desde medianoche en la zona de trabajo. */
  minutes: number;
  /** Fecha local de la zona de trabajo en formato YYYY-MM-DD. */
  dateKey: string;
}

/** Reloj local en la zona configurada por el backend (no la del equipo). */
export function getZonedClock(date: Date, timeZone: string): ZonedClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** "14:00" → 840. */
export function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
