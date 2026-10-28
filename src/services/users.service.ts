import { apiFetch } from "./apiClient";
import { SystemUser } from "../types/user";

export async function fetchUsers(): Promise<SystemUser[]> {
  const res = await apiFetch("/users");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
