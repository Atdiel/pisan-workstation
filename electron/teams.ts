import { authManager } from './auth.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const LUNCH_MESSAGE = 'Sali a comer';
const MAX_PRESENCE_MS = 4 * 60 * 60 * 1000;

/**
 * Estado en memoria del proceso main. Evita repetir llamadas si el renderer se
 * recarga con la misma comida activa y permite limpiar solo lo que esta app
 * publicó, sin borrar una presencia preferida ajena a PISANTECH.
 */
let activeLunchEnd: string | null = null;
let preferredPresenceActive = false;
let statusMessageActive = false;

function lunchEnd(endsAt: string): Date {
  const parsed = new Date(endsAt);
  const now = Date.now();

  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= now) {
    return new Date(now + 5 * 60 * 1000);
  }

  return new Date(Math.min(parsed.getTime(), now + MAX_PRESENCE_MS));
}

function expirationDuration(end: Date): string {
  const minutes = Math.min(
    Math.max(Math.ceil((end.getTime() - Date.now()) / 60_000), 5),
    240,
  );
  return `PT${minutes}M`;
}

/** Graph espera dateTime sin offset y la zona en un campo aparte. */
function graphDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

function tokenClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function graphRequest(
  token: string,
  path: string,
  body: unknown,
): Promise<void> {
  const response = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).trim();

    if (response.status === 400 && detail.includes('AuthenticationError')) {
      const claims = tokenClaims(token);
      console.error('[teams] token rechazado por Graph', {
        aud: claims.aud,
        scp: claims.scp,
        appid: claims.appid,
        ver: claims.ver,
        idp: claims.idp,
        tid: claims.tid,
        username:
          claims.preferred_username ?? claims.upn ?? claims.unique_name,
      });

      throw new Error(
        'Microsoft Graph rechazó el token de acceso. Revisa que Presence.ReadWrite sea un permiso delegado de Microsoft Graph con consentimiento, que la cuenta sea corporativa y tenga licencia de Teams. ' +
          `Detalle: ${detail}`,
      );
    }

    throw new Error(
      `Microsoft Graph respondió ${response.status}${detail ? `: ${detail}` : ''}`,
    );
  }
}

function failIfErrors(errors: unknown[], message: string): void {
  if (errors.length === 0) return;

  const [error] = errors;
  throw new Error(
    `${message}: ${error instanceof Error ? error.message : String(error)}`,
  );
}

/**
 * Publica "Away / Away" como presencia preferida del usuario en Teams. La
 * presencia preferida tiene prioridad sobre las sesiones de los clientes de
 * Teams, así que no la pisa una sesión activa del escritorio.
 */
async function applyLunchPresence(endsAt: string): Promise<void> {
  if (activeLunchEnd !== endsAt) {
    preferredPresenceActive = false;
    statusMessageActive = false;
    activeLunchEnd = endsAt;
  }

  if (preferredPresenceActive && statusMessageActive) return;

  const [userId, token] = await Promise.all([
    authManager.getAccountOid(),
    authManager.getTeamsToken(),
  ]);
  const end = lunchEnd(endsAt);
  const presence = `/users/${encodeURIComponent(userId)}/presence`;
  const errors: unknown[] = [];

  if (!preferredPresenceActive) {
    try {
      await graphRequest(token, `${presence}/setUserPreferredPresence`, {
        availability: 'Away',
        activity: 'Away',
        expirationDuration: expirationDuration(end),
      });
      preferredPresenceActive = true;
    } catch (error) {
      errors.push(error);
    }
  }

  if (!statusMessageActive) {
    try {
      await graphRequest(token, `${presence}/setStatusMessage`, {
        statusMessage: {
          message: { content: LUNCH_MESSAGE, contentType: 'text' },
          expiryDateTime: {
            dateTime: graphDateTime(end),
            timeZone: 'UTC',
          },
        },
      });
      statusMessageActive = true;
    } catch (error) {
      errors.push(error);
    }
  }

  failIfErrors(errors, 'No se pudo actualizar tu estado en Microsoft Teams');
}

/** Restaura la presencia calculada por Teams y retira el mensaje de comida. */
async function removeLunchPresence(): Promise<void> {
  if (!preferredPresenceActive && !statusMessageActive) return;

  const [userId, token] = await Promise.all([
    authManager.getAccountOid(),
    authManager.getTeamsToken(),
  ]);
  const presence = `/users/${encodeURIComponent(userId)}/presence`;
  // Un minuto en el futuro evita que Graph rechace una fecha ya vencida; si el
  // contenido vacío no limpia al instante, el mensaje expira en ese minuto.
  const clearAt = new Date(Date.now() + 60_000);
  const errors: unknown[] = [];

  if (preferredPresenceActive) {
    try {
      await graphRequest(token, `${presence}/clearUserPreferredPresence`, {});
      preferredPresenceActive = false;
    } catch (error) {
      errors.push(error);
    }
  }

  if (statusMessageActive) {
    try {
      await graphRequest(token, `${presence}/setStatusMessage`, {
        statusMessage: {
          message: { content: '', contentType: 'text' },
          expiryDateTime: {
            dateTime: graphDateTime(clearAt),
            timeZone: 'UTC',
          },
        },
      });
      statusMessageActive = false;
    } catch (error) {
      errors.push(error);
    }
  }

  if (!preferredPresenceActive && !statusMessageActive) {
    activeLunchEnd = null;
  }

  failIfErrors(
    errors,
    'No se pudo restablecer tu estado en Microsoft Teams',
  );
}

/**
 * Serializa las operaciones de Teams en el main. Si el usuario termina la
 * comida mientras aún se está publicando el inicio, el fin espera y limpia
 * después, en lugar de competir con la petición anterior.
 */
let operationQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function setLunchPresence(endsAt: string): Promise<void> {
  return enqueue(() => applyLunchPresence(endsAt));
}

export function clearLunchPresence(): Promise<void> {
  return enqueue(removeLunchPresence);
}
