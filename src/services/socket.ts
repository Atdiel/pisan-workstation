import { io, Socket } from "socket.io-client";
import API_URL from "./apiClient";
import { getSessionToken, renewSessionToken } from "./session";

let socket: Socket | null = null;
let renewing = false;

/**
 * El servidor cierra el socket cuando expira el JWT (8 h). Socket.IO no
 * reconecta solo tras un `io server disconnect`, así que renovamos la sesión
 * con MSAL y volvemos a conectar con el token nuevo.
 */
async function renewAndReconnect(instance: Socket): Promise<void> {
  if (renewing || socket !== instance) return;
  renewing = true;

  try {
    const token = await renewSessionToken();
    if (token && socket === instance && !instance.connected) {
      instance.connect();
    }
  } finally {
    renewing = false;
  }
}

export function getSocket(): Socket {
  if (!socket) {
    const instance = io(API_URL, {
      autoConnect: false,
      transports: ["websocket"],
      // Se evalúa en cada (re)conexión, así toma el JWT renovado.
      auth: (callback) => callback({ token: getSessionToken() ?? "" }),
    });

    instance.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        void renewAndReconnect(instance);
      }
    });

    instance.on("connect_error", (error) => {
      if (error.message === "No autorizado") {
        void renewAndReconnect(instance);
      }
    });

    socket = instance;
  }
  return socket;
}

export function connectSocket(): Socket {
  const current = getSocket();
  if (!current.connected) current.connect();
  return current;
}

/** Cierra y descarta la conexión (logout o cambio de usuario). */
export function resetSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
