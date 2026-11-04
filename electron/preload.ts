import { ipcRenderer, contextBridge } from 'electron';
import type {
  NotificationView,
  PisanApi,
  PlannerTaskDetailsPatch,
  PlannerTaskPatch,
  UpdateState,
} from './ipc-types.js';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

const pisan: PisanApi = {
  auth: {
    getSession: () => ipcRenderer.invoke('auth:get-session'),
    login: () => ipcRenderer.invoke('auth:login'),
    getIdToken: () => ipcRenderer.invoke('auth:get-id-token'),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  device: {
    getInfo: () => ipcRenderer.invoke('device:get-info'),
  },
  settings: {
    getGeneral: () => ipcRenderer.invoke('settings:get-general'),
    setStartMinimized: (enabled: boolean) =>
      ipcRenderer.invoke('settings:set-start-minimized', enabled),
    setLaunchAtStartup: (enabled: boolean) =>
      ipcRenderer.invoke('settings:set-launch-at-startup', enabled),
  },
  updates: {
    getState: () => ipcRenderer.invoke('updates:get-state'),
    check: () => ipcRenderer.invoke('updates:check'),
    download: () => ipcRenderer.invoke('updates:download'),
    install: () => ipcRenderer.invoke('updates:install'),
    setAutoCheck: (enabled: boolean) =>
      ipcRenderer.invoke('updates:set-auto-check', enabled),
    onState: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, state: UpdateState) =>
        listener(state);
      ipcRenderer.on('updates:state', handler);
      return () => {
        ipcRenderer.off('updates:state', handler);
      };
    },
  },
  notifications: {
    getSettings: () => ipcRenderer.invoke('notifications:get-settings'),
    setSetting: (key, enabled) =>
      ipcRenderer.invoke('notifications:set-setting', key, enabled),
    resetSettings: () => ipcRenderer.invoke('notifications:reset-settings'),
    show: (payload) => ipcRenderer.invoke('notifications:show', payload),
    scheduleLunch: (payload) =>
      ipcRenderer.invoke('notifications:schedule-lunch', payload),
    clearLunch: () => ipcRenderer.invoke('notifications:clear-lunch'),
    onNavigate: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, view: NotificationView) =>
        listener(view);
      ipcRenderer.on('notifications:navigate', handler);
      return () => {
        ipcRenderer.off('notifications:navigate', handler);
      };
    },
  },
  planner: {
    listTasks: () => ipcRenderer.invoke('planner:list-tasks'),
    getTaskDetails: (taskId) =>
      ipcRenderer.invoke('planner:get-task-details', taskId),
    updateTask: (taskId: string, patch: PlannerTaskPatch) =>
      ipcRenderer.invoke('planner:update-task', taskId, patch),
    updateTaskDetails: (taskId: string, patch: PlannerTaskDetailsPatch) =>
      ipcRenderer.invoke('planner:update-task-details', taskId, patch),
  },
  teams: {
    startLunch: (endsAt: string) =>
      ipcRenderer.invoke('teams:start-lunch', endsAt),
    endLunch: () => ipcRenderer.invoke('teams:end-lunch'),
  },
};

contextBridge.exposeInMainWorld('pisan', pisan);
