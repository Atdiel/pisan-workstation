import { apiFetch } from "./apiClient";
import type {
  StatusSnapshot,
  UserStatusEntry,
  UserStatusType,
} from "../types/status";

export async function fetchStatusSnapshot(): Promise<StatusSnapshot> {
  const res = await apiFetch("/status");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMyStatus(
  status: UserStatusType,
  activity?: string,
): Promise<UserStatusEntry> {
  const res = await apiFetch("/status/me", {
    method: "PATCH",
    body: JSON.stringify({ status, activity }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
