import { apiFetch } from "./apiClient";
import type { UserRole } from "../types/user";
import type { AvatarConfig } from "../types/avatar";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
  linked: boolean;
  lastSeenAt: string | null;
  presenceStatus: string;
  avatar: AvatarConfig;
}

export interface UpdateAdminUserInput {
  role?: UserRole;
  isAdmin?: boolean;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (typeof body.message === "string") return body.message;
  } catch {
    // El backend puede devolver texto plano en errores inesperados.
  }
  return text || `Error ${res.status}`;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch("/admin/users");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateAdminUser(
  id: string,
  input: UpdateAdminUserInput,
): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
