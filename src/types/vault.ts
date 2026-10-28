export type CredentialType = "SAP_LOGON" | "VPN" | "WEB_SITE";
export type CredentialEnvironment = "PRD" | "QAS" | "DEV";

export interface Credential {
  id: string;
  systemName: string;
  type: CredentialType;
  environment: CredentialEnvironment;
  username: string;
  password: string;
  realPassword?: string;
  lastUpdatedBy: string;
  lastUpdatedById?: string;
  url?: string;
  notes?: string;
  lastUpdatedDate: string;
  iconType: "sap" | "vpn" | "cloud" | "db" | "web";
}

// Datos tal como los devuelve el backend
export interface CredentialApi {
  id: string;
  systemName: string;
  type: CredentialType;
  environment: CredentialEnvironment;
  username: string;
  password: string;
  url: string;
  notes: string;
  lastUpdatedBy: string;
  lastUpdatedById: string;
  updatedAt: string;
  createdAt: string;
}

export interface CredentialForm {
  systemName: string;
  type: CredentialType;
  environment: CredentialEnvironment;
  username: string;
  password: string;
  url: string;
  notes: string;
}

export const EMPTY_CREDENTIAL_FORM: CredentialForm = {
  systemName: "",
  type: "SAP_LOGON",
  environment: "PRD",
  username: "",
  password: "",
  url: "",
  notes: "",
};

export interface VaultMetrics {
  total: number;
  rotatedThisMonth: number;
  pendingRotation: number;
  newAccesses: number;
}

const iconFromType = (type: CredentialType): Credential["iconType"] => {
  switch (type) {
    case "SAP_LOGON":
      return "sap";
    case "VPN":
      return "vpn";
    case "WEB_SITE":
      return "web";
    default:
      return "web";
  }
};

export const mapApiToCredential = (c: CredentialApi): Credential => ({
  id: c.id,
  systemName: c.systemName,
  type: c.type,
  environment: c.environment,
  username: c.username,
  password: "••••••••••••••••",
  realPassword: c.password,
  lastUpdatedBy: c.lastUpdatedBy,
  lastUpdatedById: c.lastUpdatedById,
  url: c.url,
  notes: c.notes,
  lastUpdatedDate: new Date(c.updatedAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
  iconType: iconFromType(c.type),
});
