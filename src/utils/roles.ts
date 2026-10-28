import type { UserRole } from "../types/user";

export const ROLE_LABELS: Record<UserRole, string> = {
  MANAGER: "Manager",
  PROJECT_MANAGER: "Project Manager",
  ABAP_FUNCTIONAL_CONSULTANT: "ABAP Functional Consultant",
  ABAP_DEVELOPER: "ABAP Developer",
  TECHNICAL_CONSULTANT: "Technical Consultant",
};

export const USER_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

/** Etiqueta legible para roles conocidos o valores nuevos del backend. */
export function roleLabel(role: string): string {
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as UserRole];
  }

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
