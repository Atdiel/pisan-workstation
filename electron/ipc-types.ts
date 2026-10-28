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
