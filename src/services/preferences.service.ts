export const APP_VIEWS = [
  "dashboard",
  "status",
  "vault",
  "admin",
  "profile",
  "settings",
] as const;

export type AppView = (typeof APP_VIEWS)[number];

export const DEFAULT_REMEMBER_LAST_VIEW = true;
export const DEFAULT_VIEW: AppView = "dashboard";

const REMEMBER_LAST_VIEW_KEY = "pisan.workstation.remember-last-view";
const LAST_VIEW_KEY = "pisan.workstation.last-view";

function isAppView(value: string | null): value is AppView {
  return value !== null && (APP_VIEWS as readonly string[]).includes(value);
}

export function getRememberLastView(): boolean {
  try {
    const stored = window.localStorage.getItem(REMEMBER_LAST_VIEW_KEY);
    if (stored === null) return DEFAULT_REMEMBER_LAST_VIEW;
    return stored === "true";
  } catch {
    return DEFAULT_REMEMBER_LAST_VIEW;
  }
}

export function saveRememberLastView(enabled: boolean): void {
  try {
    window.localStorage.setItem(REMEMBER_LAST_VIEW_KEY, String(enabled));
    if (!enabled) {
      window.localStorage.removeItem(LAST_VIEW_KEY);
    }
  } catch {
    // La preferencia sigue aplicada en memoria aunque no se pueda persistir.
  }
}

export function getStoredLastView(): AppView {
  try {
    const stored = window.localStorage.getItem(LAST_VIEW_KEY);
    return isAppView(stored) ? stored : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

export function saveLastView(view: string): void {
  if (!isAppView(view)) return;

  try {
    window.localStorage.setItem(LAST_VIEW_KEY, view);
  } catch {
    // Ignorar almacenamiento no disponible.
  }
}

export function clearLastView(): void {
  try {
    window.localStorage.removeItem(LAST_VIEW_KEY);
  } catch {
    // Ignorar almacenamiento no disponible.
  }
}

export function getInitialView(): AppView {
  return getRememberLastView() ? getStoredLastView() : DEFAULT_VIEW;
}
