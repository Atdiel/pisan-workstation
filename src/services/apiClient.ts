import {
  getSessionToken,
  notifySessionInvalid,
  renewSessionToken,
} from "./session";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function buildInit(init: RequestInit): RequestInit {
  const token = getSessionToken();

  return {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  };
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.clone().json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : undefined;
  } catch {
    return undefined;
  }
}

function notifyIfRevoked(code: string | undefined): void {
  if (code === "SESSION_REVOKED") notifySessionInvalid("revoked");
}

/**
 * Fetch autenticado contra el backend. Si el JWT expiró, pide uno nuevo al
 * proceso main (que renueva el ID token con MSAL) y reintenta una sola vez.
 *
 * Una sesión revocada no se renueva: se notifica a useAuth para limpiar el
 * token, cerrar el socket y volver al login. Sin esta distinción, la caché de
 * MSAL podría recrear la sesión y anular la desvinculación remota.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  let response = await fetch(`${API_URL}${path}`, buildInit(init));

  if (response.status !== 401 || !getSessionToken()) {
    return response;
  }

  const code = await readErrorCode(response);
  if (code === "SESSION_REVOKED") {
    notifyIfRevoked(code);
    return response;
  }

  const renewed = await renewSessionToken();
  if (!renewed) {
    // Si el renovador ya detectó una revocación, limpió el token y mostró el
    // mensaje correspondiente; no lo sobrescribas con "expirada".
    if (getSessionToken()) notifySessionInvalid("expired");
    return response;
  }

  response = await fetch(`${API_URL}${path}`, buildInit(init));
  if (response.status === 401) {
    notifyIfRevoked(await readErrorCode(response));
  }

  return response;
}

export default API_URL;
