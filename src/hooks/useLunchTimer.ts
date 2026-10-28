import { useEffect, useState } from "react";

const TOTAL_TARGET_SECONDS = 60 * 60;

export function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Temporizador derivado de `lunchUntil` del servidor.
 *
 * No guarda estado propio más allá del reloj de render: si el usuario cambia de
 * pestaña, recarga o abre otra ventana, el tiempo restante es el mismo porque
 * viene de la presencia persistida. El backend además cierra el almuerzo al
 * vencer, aunque el cliente esté cerrado.
 */
export function useLunchTimer(lunchUntil?: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const end = lunchUntil ? new Date(lunchUntil).getTime() : null;
  const secondsLeft =
    end === null ? TOTAL_TARGET_SECONDS : Math.max(0, Math.ceil((end - now) / 1000));
  const isInLunch = end !== null && secondsLeft > 0;
  const startedAt =
    end === null
      ? null
      : new Date(end - TOTAL_TARGET_SECONDS * 1000).toISOString();

  const elapsedTime = isInLunch
    ? TOTAL_TARGET_SECONDS - secondsLeft
    : 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, (elapsedTime / TOTAL_TARGET_SECONDS) * 100),
  );

  return {
    secondsLeft,
    isInLunch,
    startedAt,
    formatTime,
    progressPercent,
    percentLeft: isInLunch ? 100 - progressPercent : 100,
  };
}
