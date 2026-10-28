export type SessionInvalidReason = "revoked" | "expired";

let sessionToken: string | null = null;
let renewHandler: (() => Promise<string | null>) | null = null;
let invalidHandler: ((reason: SessionInvalidReason) => void) | null = null;

/** Token de sesión de la suite, en memoria del renderer. */
export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

export function getSessionToken(): string | null {
  return sessionToken;
}

/** El canje de ID token → JWT lo registra useAuth al arrancar. */
export function setSessionRenewer(
  handler: (() => Promise<string | null>) | null,
): void {
  renewHandler = handler;
}

export async function renewSessionToken(): Promise<string | null> {
  return renewHandler ? renewHandler() : null;
}

/**
 * useAuth registra aquí qué hacer cuando el backend invalida la sesión:
 * limpiar el JWT, cerrar el socket y volver al login.
 */
export function setSessionInvalidHandler(
  handler: ((reason: SessionInvalidReason) => void) | null,
): void {
  invalidHandler = handler;
}

export function notifySessionInvalid(reason: SessionInvalidReason): void {
  invalidHandler?.(reason);
}
