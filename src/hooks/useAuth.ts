import { useCallback, useEffect, useState } from "react";
import {
  createSession,
  fetchMe,
  logoutBackend,
  SessionApiError,
  type SessionUser,
} from "../services/auth.service";
import {
  setSessionInvalidHandler,
  setSessionRenewer,
  setSessionToken,
} from "../services/session";
import { resetSocket } from "../services/socket";
import type { DeviceInfo } from "../../electron/ipc-types";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function clearMicrosoftSession(): Promise<void> {
  try {
    await window.pisan?.auth.logout();
  } catch (err) {
    console.error("Error al cerrar la sesión de Microsoft:", err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDevice = useCallback(async (): Promise<DeviceInfo> => {
    if (!window.pisan?.device) {
      throw new Error(
        "La identificación del dispositivo solo está disponible dentro de Electron",
      );
    }
    return window.pisan.device.getInfo();
  }, []);

  const exchange = useCallback(
    async (idToken: string, interactive: boolean) => {
      const device = await getDevice();
      const session = await createSession(idToken, device, interactive);
      setSessionToken(session.token);
      setUser(session.user);
      return session.user;
    },
    [getDevice],
  );

  /** Relee el usuario actual para reflejar cambios de rol o de admin. */
  const refresh = useCallback(async () => {
    const current = await fetchMe();
    setUser(current);
    return current;
  }, []);

  // Una sesión revocada o expirada sin renovación vuelve al login. También se
  // limpia la caché de MSAL para que el dispositivo revocado no pueda recrear
  // la sesión de forma silenciosa.
  useEffect(() => {
    setSessionInvalidHandler((reason) => {
      setSessionToken(null);
      setUser(null);
      resetSocket();
      setError(
        reason === "revoked"
          ? "Esta sesión fue desvinculada desde otro dispositivo. Inicia sesión de nuevo."
          : "Tu sesión expiró. Inicia sesión de nuevo.",
      );
      void clearMicrosoftSession();
    });

    return () => setSessionInvalidHandler(null);
  }, []);

  // Al montar: reutiliza la cuenta de MSAL guardada en el proceso main.
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        if (!window.pisan?.auth) {
          throw new Error("MSAL solo está disponible dentro de Electron");
        }

        const status = await window.pisan.auth.getSession();
        if (status.authenticated && status.idToken) {
          await exchange(status.idToken, false);
        } else if (status.authenticated) {
          setError(
            "Tu sesión de Microsoft expiró. Vuelve a iniciar sesión.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          if (
            err instanceof SessionApiError &&
            err.code === "SESSION_REVOKED"
          ) {
            setError(
              "Esta sesión fue desvinculada desde otro dispositivo. Inicia sesión de nuevo.",
            );
            await clearMicrosoftSession();
          } else {
            setError(errorMessage(err));
          }
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [exchange]);

  // Renovación silenciosa del JWT cuando el backend responde 401.
  useEffect(() => {
    setSessionRenewer(async () => {
      if (!window.pisan?.auth) return null;
      try {
        const status = await window.pisan.auth.getIdToken();
        if (!status.idToken) return null;
        const device = await getDevice();
        const session = await createSession(status.idToken, device, false);
        setSessionToken(session.token);
        setUser(session.user);
        return session.token;
      } catch (err) {
        if (err instanceof SessionApiError && err.code === "SESSION_REVOKED") {
          setSessionToken(null);
          setUser(null);
          resetSocket();
          setError(
            "Esta sesión fue desvinculada desde otro dispositivo. Inicia sesión de nuevo.",
          );
          await clearMicrosoftSession();
        }
        return null;
      }
    });

    return () => setSessionRenewer(null);
  }, [getDevice]);

  // Refresca rol/admin al recuperar el foco para reflejar cambios hechos por
  // otro administrador sin obligar a cerrar sesión.
  useEffect(() => {
    if (!user) return;

    const onFocus = () => {
      void refresh().catch(() => undefined);
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, refresh]);

  const login = async () => {
    if (loggingIn) return;
    setError(null);
    setLoggingIn(true);
    try {
      if (!window.pisan?.auth) {
        throw new Error("MSAL solo está disponible dentro de Electron");
      }
      const status = await window.pisan.auth.login();
      if (!status.idToken) {
        throw new Error("Microsoft no devolvió un ID token");
      }
      await exchange(status.idToken, true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await logoutBackend();
    await clearMicrosoftSession();
    setSessionToken(null);
    setUser(null);
    setError(null);
    resetSocket();
  };

  return {
    authenticated: user !== null,
    user,
    initializing,
    loggingIn,
    error,
    login,
    logout,
    refresh,
  };
}
