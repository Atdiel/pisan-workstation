import { useEffect } from "react";
import { connectSocket } from "../services/socket";
import type {
  StatusSnapshot,
  UserStatusEntry,
} from "../types/status";

/**
 * Se suscribe a los eventos del gateway:
 *  - `statusSnapshot`: foto completa con el horario vigente.
 *  - `statusChanged`: cambio puntual de un usuario.
 *
 * La identidad la valida el backend en el handshake con `auth.token`; el
 * cliente no envía userId en ningún momento.
 */
export function useStatusSocket(
  enabled: boolean,
  onStatusChanged: (entry: UserStatusEntry) => void,
  onSnapshot: (snapshot: StatusSnapshot) => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const socket = connectSocket();
    const handleSnapshot = (snapshot: StatusSnapshot) => onSnapshot(snapshot);
    const requestSnapshot = () => {
      socket.emit("requestStatusSnapshot");
    };

    socket.on("statusChanged", onStatusChanged);
    socket.on("statusSnapshot", handleSnapshot);
    socket.on("connect", requestSnapshot);

    if (socket.connected) requestSnapshot();

    return () => {
      socket.off("statusChanged", onStatusChanged);
      socket.off("statusSnapshot", handleSnapshot);
      socket.off("connect", requestSnapshot);
    };
  }, [enabled, onStatusChanged, onSnapshot]);
}
