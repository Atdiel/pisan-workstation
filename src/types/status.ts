import type { AvatarConfig } from "./avatar";

export type PresenceStatus =
  | "AVAILABLE"
  | "IN_LUNCH"
  | "AWAY"
  | "OFFLINE";

/** Estados que el usuario puede solicitar (OFFLINE lo calcula el backend). */
export type UserStatusType = Exclude<PresenceStatus, "OFFLINE">;

export type OfflineReason = "SCHEDULE" | "DISCONNECTED" | null;

export interface StatusOption {
  id: UserStatusType;
  label: string;
  color: string;
}

/** Estado de un usuario tal como lo emite el backend. */
export interface UserStatusEntry {
  userId: string;
  name: string;
  status: PresenceStatus;
  activity: string | null;
  lunchUntil: string | null;
  lastLunchDate: string | null;
  offlineReason: OfflineReason;
  updatedAt: string | null;
}

export interface WorkScheduleInfo {
  start: string;
  end: string;
  lunchStart: string;
  timezone: string;
  days: number[];
  withinSchedule: boolean;
}

export interface StatusSnapshot {
  workSchedule: WorkScheduleInfo;
  entries: UserStatusEntry[];
}

export type TeamMemberStatus =
  | "In lunch"
  | "Available"
  | "Away"
  | "Offline";

/** Fila de la matriz de disponibilidad (usuario real + estado en vivo). */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: AvatarConfig;
  status: TeamMemberStatus;
  offlineReason: OfflineReason;
  activity: string;
  timing: string;
}
