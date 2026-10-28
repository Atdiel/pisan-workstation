import API_URL, { apiFetch } from "./apiClient";
import type { UserRole } from "../types/user";
import type { AvatarConfig } from "../types/avatar";
import type { DeviceInfo } from "../../electron/ipc-types";

// El rol se define en types/user.ts y se re-exporta aquí por compatibilidad.
export type { UserRole };

export interface SessionUser {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  avatar: AvatarConfig;
}

export interface AuthSessionResponse {
  token: string;
  user: SessionUser;
}

/** Error de autenticación con el código emitido por el backend. */
export class SessionApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SessionApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<SessionApiError> {
  const text = await res.text();

  try {
    const body = JSON.parse(text) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    return new SessionApiError(
      message || text || `Error ${res.status}`,
      res.status,
      body.code,
    );
  } catch {
    return new SessionApiError(
      text || `Error ${res.status}`,
      res.status,
    );
  }
}

/** Canjea el ID token de Microsoft por el JWT de la suite. */
export async function createSession(
  idToken: string,
  device: DeviceInfo,
  interactive: boolean,
): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_URL}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
      appVersion: device.appVersion,
      interactive,
    }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function fetchMe(): Promise<SessionUser> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Revoca la sesión actual en el backend. El JWT deja de servir. */
export async function logoutBackend(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
}
