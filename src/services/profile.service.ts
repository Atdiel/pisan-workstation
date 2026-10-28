import { apiFetch } from "./apiClient";
import type { SessionUser } from "./auth.service";
import type { AvatarStyle } from "../types/avatar";

export interface ProfileUser extends SessionUser {
  createdAt: string;
}

export interface UpdateAvatarInput {
  style: AvatarStyle;
  seed?: string | null;
  backgroundColor?: string | null;
}

export interface ProfileSession {
  id: string;
  deviceName: string;
  platform: string | null;
  appVersion: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (typeof body.message === "string") return body.message;
  } catch {
    // Respuesta no JSON.
  }
  return text || `Error ${res.status}`;
}

export async function fetchProfile(): Promise<ProfileUser> {
  const res = await apiFetch("/profile");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateAvatar(
  input: UpdateAvatarInput,
): Promise<ProfileUser> {
  const res = await apiFetch("/profile/avatar", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Sesiones activas del usuario en todos sus dispositivos. */
export async function fetchSessions(): Promise<ProfileSession[]> {
  const res = await apiFetch("/profile/sessions");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Desvincula una sesión remota. La sesión actual no se ofrece en la UI. */
export async function revokeSession(id: string): Promise<void> {
  const res = await apiFetch(`/profile/sessions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}

/** Cierra todas las sesiones excepto la de este dispositivo. */
export async function revokeOtherSessions(): Promise<number> {
  const res = await apiFetch("/profile/sessions/revoke-others", {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as { revoked: number };
  return body.revoked;
}
