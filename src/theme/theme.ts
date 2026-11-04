export type ThemeId = "default" | "dark forest" | "moonlight";

export const DEFAULT_THEME: ThemeId = "default";

const STORAGE_KEY = "pisan.workstation.theme";

function isThemeId(value: string | null): value is ThemeId {
  return value === "default" || value === "dark forest" || value === "moonlight";
}

/**
 * Devuelve el tema guardado en este dispositivo. Si no existe o el valor
 * almacenado no es válido, se usa el tema original de la app.
 */
export function getStoredTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Aplica el tema al documento. Los colores viven en variables CSS, por lo que
 * el cambio se refleja de inmediato en toda la interfaz.
 */
export function applyTheme(theme: ThemeId): void {
  const root = document.documentElement;

  if (theme === DEFAULT_THEME) {
    root.removeAttribute("data-theme");
    return;
  }

  root.setAttribute("data-theme", theme);
}

export function saveTheme(theme: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // El tema sigue aplicado en memoria aunque el almacenamiento no esté
    // disponible (por ejemplo, en un contexto restringido).
  }
}

export function setTheme(theme: ThemeId): void {
  applyTheme(theme);
  saveTheme(theme);
}

export function resetTheme(): void {
  setTheme(DEFAULT_THEME);
}
