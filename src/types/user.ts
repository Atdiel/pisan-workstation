import type { AvatarConfig } from "./avatar";

export type UserRole =
  | "MANAGER"
  | "PROJECT_MANAGER"
  | "ABAP_FUNCTIONAL_CONSULTANT"
  | "ABAP_DEVELOPER"
  | "TECHNICAL_CONSULTANT";

/** Usuario del sistema tal como lo devuelve GET /users (y la sesión). */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: AvatarConfig;
}
