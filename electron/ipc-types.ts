/** Contrato IPC entre el proceso main de Electron y el renderer. */
export interface AuthAccount {
  username: string;
  name: string | null;
}

export interface AuthSession {
  authenticated: boolean;
  account: AuthAccount | null;
  idToken: string | null;
}

/** Identidad estable del equipo para la gestión remota de sesiones. */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
}

export interface LaunchAtStartupState {
  supported: boolean;
  enabled: boolean;
}

export interface GeneralSettings {
  startMinimized: boolean;
  launchAtStartup: LaunchAtStartupState;
}

export interface NotificationSettings {
  desktop: boolean;
  teamStatus: boolean;
  lunchReminder: boolean;
}

export type NotificationSettingKey = keyof NotificationSettings;

export interface NotificationSettingsSnapshot {
  supported: boolean;
  settings: NotificationSettings;
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "downloaded"
  | "error"
  | "unsupported"
  | "not-configured";

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion: string | null;
  progressPercent: number | null;
  message: string | null;
  lastCheckedAt: string | null;
  autoCheckEnabled: boolean;
  canCheck: boolean;
  feedConfigured: boolean;
}

export type NotificationView =
  | "dashboard"
  | "status"
  | "vault"
  | "planner"
  | "feed"
  | "admin"
  | "profile"
  | "settings";

export type NotificationCategory = "team" | "lunch" | "system";

export interface DesktopNotificationPayload {
  title: string;
  body: string;
  category: NotificationCategory;
  view: NotificationView;
}

export interface LunchReminderPayload {
  delayMs: number;
  dateKey: string;
  title: string;
  body: string;
  view: NotificationView;
}

export interface PlannerTask {
  id: string;
  title: string;
  percentComplete: number;
  dueDateTime: string | null;
  planId: string;
  bucketId: string;
  assignments?: Record<string, unknown>;
}

export interface PlannerTaskDetails {
  id: string;
  description: string | null;
  checklist?: Record<string, unknown>;
  references?: Record<string, unknown>;
  previewType?: string;
}

export interface PlannerTaskPatch {
  title?: string;
  percentComplete?: number;
  dueDateTime?: string | null;
  bucketId?: string;
  assignments?: Record<string, unknown>;
}

export interface PlannerTaskDetailsPatch {
  description?: string;
  checklist?: Record<string, unknown>;
  references?: Record<string, unknown>;
  previewType?: string;
}

export interface PisanApi {
  auth: {
    getSession(): Promise<AuthSession>;
    login(): Promise<AuthSession>;
    getIdToken(): Promise<AuthSession>;
    logout(): Promise<void>;
  };
  device: {
    getInfo(): Promise<DeviceInfo>;
  };
  settings: {
    getGeneral(): Promise<GeneralSettings>;
    setStartMinimized(enabled: boolean): Promise<GeneralSettings>;
    setLaunchAtStartup(enabled: boolean): Promise<GeneralSettings>;
  };
  updates: {
    getState(): Promise<UpdateState>;
    check(): Promise<UpdateState>;
    download(): Promise<UpdateState>;
    install(): Promise<void>;
    setAutoCheck(enabled: boolean): Promise<UpdateState>;
    onState(listener: (state: UpdateState) => void): () => void;
  };
  notifications: {
    getSettings(): Promise<NotificationSettingsSnapshot>;
    setSetting(
      key: NotificationSettingKey,
      enabled: boolean,
    ): Promise<NotificationSettingsSnapshot>;
    resetSettings(): Promise<NotificationSettingsSnapshot>;
    show(payload: DesktopNotificationPayload): Promise<boolean>;
    scheduleLunch(payload: LunchReminderPayload): Promise<boolean>;
    clearLunch(): Promise<void>;
    onNavigate(listener: (view: NotificationView) => void): () => void;
  };
  planner: {
    listTasks(): Promise<PlannerTask[]>;
    getTaskDetails(taskId: string): Promise<PlannerTaskDetails>;
    updateTask(taskId: string, patch: PlannerTaskPatch): Promise<void>;
    updateTaskDetails(
      taskId: string,
      patch: PlannerTaskDetailsPatch,
    ): Promise<void>;
  };
  teams: {
    startLunch(endsAt: string): Promise<void>;
    endLunch(): Promise<void>;
  };
}
