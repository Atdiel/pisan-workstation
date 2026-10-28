import { useEffect, useState } from "react";

/** Reloj compartido para reglas que dependen de la hora local. */
export function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);

  return now;
}
