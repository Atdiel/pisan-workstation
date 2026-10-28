import { ipcRenderer, contextBridge } from 'electron';
import type {
  PisanApi,
  PlannerTaskDetailsPatch,
  PlannerTaskPatch,
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
