import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Check,
  Download,
  Info,
  ChevronDown,
  KeyRound,
  Keyboard,
  Laptop,
  LogOut,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { ConfirmActionDialog } from "../../components/common/ConfirmActionDialog";
import type {
  NotificationSettingKey,
  NotificationSettings,
  UpdateState,
} from "../../../electron/ipc-types";
import {
  clearLastView,
  getRememberLastView,
  saveLastView,
  saveRememberLastView,
} from "../../services/preferences.service";
import { moonlightPalette, darkForestPalette } from "../../theme/palette";
import {
  DEFAULT_THEME,
  getStoredTheme,
  resetTheme,
  setTheme,
  type ThemeId,
} from "../../theme/theme";

interface SettingsViewProps {
  appVersion: string | null;
  currentView: string;
  notificationSettings: NotificationSettings;
  notificationSettingsLoading: boolean;
  notificationSettingsError: string | null;
  notificationsSupported: boolean;
  onNotificationSettingChange: (
    key: NotificationSettingKey,
    enabled: boolean,
  ) => Promise<void>;
  onResetNotifications: () => Promise<void>;
  updateState: UpdateState;
  updatesLoading: boolean;
  updatesError: string | null;
  onCheckForUpdates: () => Promise<void>;
  onDownloadUpdate: () => Promise<void>;
  onInstallUpdate: () => Promise<void>;
  onAutoUpdatesChange: (enabled: boolean) => Promise<void>;
  onLogout?: () => void;
  onOpenVault?: () => void;
}

interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const updateStatusLabels: Record<UpdateState["status"], string> = {
  idle: "Sin comprobar",
  checking: "Buscando",
  "up-to-date": "Actualizado",
  available: "Nueva versión",
  downloading: "Descargando",
  downloaded: "Lista para instalar",
  error: "Error",
  unsupported: "Solo app instalada",
  "not-configured": "Canal pendiente",
};

function updateStatusClasses(status: UpdateState["status"]): string {
  if (status === "up-to-date" || status === "downloaded") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "error") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  }

  if (
    status === "checking" ||
    status === "downloading" ||
    status === "available"
  ) {
    return "border-brand-teal/20 bg-brand-teal/10 text-brand-teal";
  }

  return "border-slate-700 bg-slate-800/60 text-slate-400";
}

function formatCheckedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const defaultTheme = {
  bg: "#090d16",
  sidebar: "#0d131f",
  panel: "#131c2e",
  line: "#1e2b45",
  brand: "#00a896",
  muted: "#475569",
};

const darkForestTheme = {
  bg: darkForestPalette.colors.bg,
  sidebar: darkForestPalette.colors.panel,
  panel: darkForestPalette.colors.panel2,
  line: darkForestPalette.colors.line,
  brand: darkForestPalette.colors.brand,
  muted: darkForestPalette.colors.muted2,
};

const moonlightTheme = {
  bg: moonlightPalette.colors.bg,
  sidebar: moonlightPalette.colors.panel3,
  panel: moonlightPalette.colors.panel,
  line: moonlightPalette.colors.line,
  brand: moonlightPalette.colors.brand,
  muted: moonlightPalette.colors.muted,
};

const shortcuts = [
  {
    action: "Abrir búsqueda global",
    keys: ["Ctrl", "K"],
    scope: "Global",
  },
  {
    action: "Cerrar panel o diálogo",
    keys: ["Esc"],
    scope: "En la app",
  },
  {
    action: "Abrir Ajustes",
    keys: ["Ctrl", ","],
    scope: "En la app",
  },
  {
    action: "Nueva credencial",
    keys: ["Ctrl", "N"],
    scope: "Bóveda",
  },
];

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: SettingsCardProps) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-dark-border bg-dark-card ${className}`}
    >
      <div className="border-b border-dark-border/80 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-brand-teal/20 bg-brand-teal/10 p-2.5 text-brand-teal">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-xs font-medium text-slate-200">{label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-teal" : "bg-slate-600"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span
          className={`absolute top-1 left-0 h-4 w-4 rounded-full bg-white shadow-sm transition-transform transition-colors`}
          style={{
            transform: checked
              ? "translateX(calc(175% - 0.20rem))"
              : "translateX(0.20rem)",
          }}
        />
      </button>
    </div>
  );
}

function ThemePreview({ theme }: Readonly<{ theme: typeof defaultTheme }>) {
  return (
    <div
      className="relative h-24 overflow-hidden rounded-lg border p-2"
      style={{ backgroundColor: theme.bg, borderColor: theme.line }}
    >
      <div className="flex h-full gap-1.5">
        <div
          className="w-10 rounded-md border p-1.5"
          style={{ backgroundColor: theme.sidebar, borderColor: theme.line }}
        >
          <div
            className="h-1.5 w-4 rounded-full"
            style={{ backgroundColor: theme.brand }}
          />
          <div className="mt-2 space-y-1">
            <div
              className="h-1 w-6 rounded-full"
              style={{ backgroundColor: theme.muted }}
            />
            <div
              className="h-1 w-5 rounded-full"
              style={{ backgroundColor: theme.muted, opacity: 0.55 }}
            />
            <div
              className="h-1 w-6 rounded-full"
              style={{ backgroundColor: theme.muted, opacity: 0.55 }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <div
            className="h-3 rounded border"
            style={{ backgroundColor: theme.panel, borderColor: theme.line }}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: theme.panel, borderColor: theme.line }}
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: theme.panel, borderColor: theme.line }}
            />
          </div>
          <div
            className="h-1.5 w-2/3 rounded-full"
            style={{ backgroundColor: theme.brand, opacity: 0.7 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SettingsView({
  appVersion,
  currentView,
  notificationSettings,
  notificationSettingsLoading,
  notificationSettingsError,
  notificationsSupported,
  onNotificationSettingChange,
  onResetNotifications,
  updateState,
  updatesLoading,
  updatesError,
  onCheckForUpdates,
  onDownloadUpdate,
  onInstallUpdate,
  onAutoUpdatesChange,
  onLogout,
  onOpenVault,
}: Readonly<SettingsViewProps>) {
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [launchAtStartupSupported, setLaunchAtStartupSupported] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [generalLoading, setGeneralLoading] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [rememberLastView, setRememberLastView] = useState(() =>
    getRememberLastView(),
  );
  const [theme, setThemeValue] = useState<ThemeId>(() => getStoredTheme());
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (!resetNotice) return;

    const timer = window.setTimeout(() => setResetNotice(false), 4000);
    return () => window.clearTimeout(timer);
  }, [resetNotice]);

  useEffect(() => {
    let cancelled = false;
    const settings = window.pisan?.settings;

    if (!settings) {
      setGeneralLoading(false);
      return;
    }

    void settings
      .getGeneral()
      .then((general) => {
        if (cancelled) return;
        setLaunchAtStartup(general.launchAtStartup.enabled);
        setLaunchAtStartupSupported(general.launchAtStartup.supported);
        setStartMinimized(general.startMinimized);
      })
      .catch((error: unknown) => {
        if (!cancelled) setGeneralError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setGeneralLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeTheme = (nextTheme: ThemeId) => {
    setThemeValue(nextTheme);
    setTheme(nextTheme);
  };

  const handleLaunchAtStartupChange = async (checked: boolean) => {
    const settings = window.pisan?.settings;
    if (!settings || !launchAtStartupSupported || generalLoading) return;

    const previous = launchAtStartup;
    setLaunchAtStartup(checked);
    setGeneralError(null);

    try {
      const general = await settings.setLaunchAtStartup(checked);
      setLaunchAtStartup(general.launchAtStartup.enabled);
      setLaunchAtStartupSupported(general.launchAtStartup.supported);
      setStartMinimized(general.startMinimized);
    } catch (error: unknown) {
      setLaunchAtStartup(previous);
      setGeneralError(errorMessage(error));
    }
  };

  const handleStartMinimizedChange = async (checked: boolean) => {
    const settings = window.pisan?.settings;
    if (!settings || generalLoading) return;

    const previous = startMinimized;
    setStartMinimized(checked);
    setGeneralError(null);

    try {
      const general = await settings.setStartMinimized(checked);
      setLaunchAtStartup(general.launchAtStartup.enabled);
      setLaunchAtStartupSupported(general.launchAtStartup.supported);
      setStartMinimized(general.startMinimized);
    } catch (error: unknown) {
      setStartMinimized(previous);
      setGeneralError(errorMessage(error));
    }
  };

  const handleRememberLastViewChange = (checked: boolean) => {
    setRememberLastView(checked);
    saveRememberLastView(checked);

    if (checked) {
      saveLastView(currentView);
      return;
    }

    clearLastView();
  };

  const handleReset = async () => {
    setLaunchAtStartup(false);
    setStartMinimized(false);
    setRememberLastView(true);
    saveRememberLastView(true);
    saveLastView(currentView);
    setThemeValue(DEFAULT_THEME);
    resetTheme();
    setResetDialogOpen(false);
    setResetNotice(true);
    setGeneralError(null);

    await onResetNotifications();
    await onAutoUpdatesChange(true);

    const settings = window.pisan?.settings;
    if (!settings) return;

    try {
      const general = await settings.setLaunchAtStartup(false);
      setLaunchAtStartup(general.launchAtStartup.enabled);
      setLaunchAtStartupSupported(general.launchAtStartup.supported);
      setStartMinimized(general.startMinimized);
    } catch (error: unknown) {
      setGeneralError(errorMessage(error));
    }

    try {
      const general = await settings.setStartMinimized(false);
      setLaunchAtStartup(general.launchAtStartup.enabled);
      setLaunchAtStartupSupported(general.launchAtStartup.supported);
      setStartMinimized(general.startMinimized);
    } catch (error: unknown) {
      setGeneralError(errorMessage(error));
    }
  };

  const lastCheckedLabel = formatCheckedAt(updateState.lastCheckedAt);
  const checking = updateState.status === "checking";
  const downloading = updateState.status === "downloading";
  const checkDisabled =
    updatesLoading || !updateState.canCheck || checking || downloading;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Settings2 className="h-3.5 w-3.5" />
            Preferencias
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
            Ajustes
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configura cómo se comporta PISANTECH Workstation en este dispositivo.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-dark-border bg-dark-card px-3 py-1.5 text-[10px] text-slate-400">
          <Laptop className="h-3.5 w-3.5 text-brand-teal" />
          Preferencias de este dispositivo
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* General */}
        <SettingsCard
          icon={Settings2}
          title="General"
          description="Los detalles que hacen que tu trabajo fluya un poco mejor."
        >
          <div className="flex h-full flex-col">
            <div className="divide-y divide-dark-border/70">
              <Toggle
                label="Iniciar con Windows"
                description={
                  launchAtStartupSupported
                    ? "Abre la app al iniciar sesión en Windows."
                    : "Disponible cuando la app esté instalada."
                }
                checked={launchAtStartup}
                disabled={generalLoading || !launchAtStartupSupported}
                onChange={(checked) => void handleLaunchAtStartupChange(checked)}
              />
              <Toggle
                label="Abrir minimizada"
                description="Abre la app minimizada en la barra de tareas."
                checked={startMinimized}
                disabled={generalLoading}
                onChange={(checked) => void handleStartMinimizedChange(checked)}
              />
              <Toggle
                label="Recordar última vista"
                description="Vuelve a la última sección al abrir la app. Se conserva después de cerrar sesión."
                checked={rememberLastView}
                onChange={handleRememberLastViewChange}
              />
            </div>

            {generalError && (
              <p role="alert" className="mt-3 text-[10px] text-rose-300">
                {generalError}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-3 border-t border-dark-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-200">Idioma</p>
                  <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[9px] font-medium text-slate-400">
                    Próximamente
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Por ahora la app está disponible en Español (México).
                </p>
              </div>
              <div className="relative w-full sm:w-44">
                <select
                  value="es-MX"
                  disabled
                  aria-disabled="true"
                  className="w-full appearance-none rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 pr-9 text-xs text-slate-200 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="es-MX">Español (México)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Apariencia */}
        <SettingsCard
          icon={Palette}
          title="Apariencia"
          description="Elige el ambiente visual para tu espacio de trabajo."
        >
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Tema de la interfaz
            </label>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  id: "default" as const,
                  label: "Actual",
                  detail: "Azul profundo y turquesa",
                  preview: defaultTheme,
                },
                {
                  id: "dark forest" as const,
                  label: "Dark Forest",
                  detail: "Verde petróleo y aqua",
                  preview: darkForestTheme,
                },
                {
                  id: "moonlight" as const,
                  label: "Moonlight",
                  detail: "Marfil, salvia y azul profundo",
                  preview: moonlightTheme,
                },
              ].map((option) => {
                const active = theme === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => changeTheme(option.id)}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      active
                        ? "border-brand-teal bg-brand-teal/5 shadow-lg shadow-brand-teal/5"
                        : "border-dark-border bg-dark-bg/40 hover:border-slate-600 hover:bg-dark-border/20"
                    }`}
                  >
                    <div className="relative">
                      <ThemePreview theme={option.preview} />
                      {active && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-slate-950 shadow-sm">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2 px-1 pt-2.5">
                      <div>
                        <p
                          className={`text-[11px] font-semibold ${
                            active ? "text-brand-teal" : "text-slate-200"
                          }`}
                        >
                          {option.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {option.detail}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-500">
              <Info className="h-3 w-3 text-brand-teal" />
              El tema se aplica al instante y se guarda en este dispositivo.
            </p>
          </div>
        </SettingsCard>

        {/* Atajos de teclado */}
        <SettingsCard
          icon={Keyboard}
          title="Atajos de teclado"
          description="Menos clics, más enfoque. Estos son los atajos de referencia."
        >
          <div className="divide-y divide-dark-border/70">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-xs text-slate-300">
                  {shortcut.action}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded-md border border-dark-border bg-dark-bg px-2 py-1 font-mono text-[10px] text-slate-300 shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <span className="w-14 text-right text-[10px] text-slate-500">
                    {shortcut.scope}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* Notificaciones */}
        <SettingsCard
          icon={Bell}
          title="Notificaciones"
          description="Mantente al tanto sin perder el enfoque."
        >
          <div className="flex h-full flex-col">
            <div className="divide-y divide-dark-border/70">
              <Toggle
                label="Notificaciones de escritorio"
                description={
                  notificationSettingsLoading
                    ? "Comprobando disponibilidad de notificaciones..."
                    : notificationsSupported
                      ? "Recibe avisos importantes aunque la app esté en segundo plano."
                      : "Las notificaciones no están disponibles en este sistema."
                }
                checked={notificationSettings.desktop}
                disabled={notificationSettingsLoading || !notificationsSupported}
                onChange={(checked) =>
                  void onNotificationSettingChange("desktop", checked)
                }
              />
              <Toggle
                label="Cambios de estado del equipo"
                description={
                  notificationSettings.desktop
                    ? "Avisa cuando alguien inicia su comida o cambia su disponibilidad."
                    : "Activa las notificaciones de escritorio para usar este aviso."
                }
                checked={notificationSettings.teamStatus}
                disabled={
                  notificationSettingsLoading ||
                  !notificationsSupported ||
                  !notificationSettings.desktop
                }
                onChange={(checked) =>
                  void onNotificationSettingChange("teamStatus", checked)
                }
              />
              <Toggle
                label="Recordatorio de comida"
                description={
                  notificationSettings.desktop
                    ? "Un aviso cuando llegue tu horario de pausa."
                    : "Activa las notificaciones de escritorio para usar este aviso."
                }
                checked={notificationSettings.lunchReminder}
                disabled={
                  notificationSettingsLoading ||
                  !notificationsSupported ||
                  !notificationSettings.desktop
                }
                onChange={(checked) =>
                  void onNotificationSettingChange("lunchReminder", checked)
                }
              />
            </div>

            {notificationSettingsError && (
              <p role="alert" className="mt-3 text-[10px] text-rose-300">
                {notificationSettingsError}
              </p>
            )}

            <p className="mt-5 flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-500">
              <Info className="h-3 w-3 text-brand-teal" />
              Los avisos solo se muestran mientras la app esté abierta o
              minimizada.
            </p>
          </div>
        </SettingsCard>

        {/* Actualizaciones y Acerca de */}
        <SettingsCard
          icon={RefreshCw}
          title="Actualizaciones y Acerca de"
          description="Mantén tu espacio de trabajo al día."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/10 p-2 text-brand-teal">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Versión actual
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                    v{appVersion || updateState.currentVersion || "0.1.0"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                    updateState.feedConfigured
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      updateState.feedConfigured
                        ? "bg-emerald-400"
                        : "bg-amber-300"
                    }`}
                  />
                  {updateState.feedConfigured
                    ? "Canal estable"
                    : "Canal pendiente"}
                </span>
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${updateStatusClasses(
                    updateState.status,
                  )}`}
                >
                  {updateStatusLabels[updateState.status]}
                </span>
              </div>
            </div>

            <Toggle
              label="Buscar actualizaciones automáticamente"
              description="Se ejecuta todos los días a las 9:00 (hora local). Solo busca; no descarga ni instala sin tu confirmación."
              checked={updateState.autoCheckEnabled}
              disabled={updatesLoading}
              onChange={(checked) => void onAutoUpdatesChange(checked)}
            />

            <div className="rounded-xl border border-dark-border bg-dark-bg/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onCheckForUpdates()}
                  disabled={checkDisabled}
                  title={
                    !updateState.canCheck
                      ? "Disponible en la app instalada."
                      : undefined
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-3.5 py-2.5 text-[11px] font-semibold text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
                  />
                  {checking ? "Buscando..." : "Buscar actualizaciones"}
                </button>

                {updateState.status === "available" && (
                  <button
                    type="button"
                    onClick={() => void onDownloadUpdate()}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/30 bg-brand-teal/10 px-3.5 py-2.5 text-[11px] font-semibold text-brand-teal transition-colors hover:bg-brand-teal/15"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                    {updateState.availableVersion
                      ? ` v${updateState.availableVersion}`
                      : ""}
                  </button>
                )}

                {updateState.status === "downloaded" && (
                  <button
                    type="button"
                    onClick={() => void onInstallUpdate()}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reiniciar e instalar
                  </button>
                )}
              </div>

              {downloading && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-brand-teal transition-[width]"
                      style={{ width: `${updateState.progressPercent ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    {updateState.progressPercent ?? 0}% descargado
                  </p>
                </div>
              )}

              {updateState.message && (
                <p
                  className={`mt-2 text-[10px] leading-relaxed ${
                    updateState.status === "error"
                      ? "text-rose-300"
                      : updateState.status === "available" ||
                          updateState.status === "downloaded"
                        ? "text-brand-teal"
                        : "text-slate-500"
                  }`}
                >
                  {updateState.message}
                </p>
              )}

              {lastCheckedLabel && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Última comprobación: {lastCheckedLabel}
                </p>
              )}

              {!updateState.feedConfigured &&
                updateState.status !== "not-configured" &&
                !updatesLoading && (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-500">
                    <Info className="h-3 w-3 text-amber-300" />
                    El canal se habilitará al publicar el próximo release.
                  </p>
                )}

              {updatesError && (
                <p role="alert" className="mt-2 text-[10px] text-rose-300">
                  {updatesError}
                </p>
              )}
            </div>

            <div className="border-t border-dark-border pt-4">
              <p className="text-[11px] font-semibold text-slate-300">
                PISANTECH Workstation
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Consulting Suite · Hecho por PISANTECH. Todos los derechos
                reservados.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Sesión y seguridad */}
        <SettingsCard
          icon={ShieldCheck}
          title="Sesión y seguridad"
          description="Tu acceso y tus credenciales, protegidos en este dispositivo."
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Bóveda de credenciales
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Contraseñas cifradas en reposo con AES-256-GCM.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                  Protegida
                </span>
                {onOpenVault && (
                  <button
                    type="button"
                    onClick={onOpenVault}
                    className="rounded-lg border border-dark-border px-3 py-2 text-[10px] font-medium text-slate-300 transition-colors hover:border-brand-teal/40 hover:text-brand-teal"
                  >
                    Abrir
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-400">
                  <LogOut className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Sesión en este dispositivo
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Cierra tu sesión de Microsoft y bloquea el acceso local.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/15 sm:w-auto"
              >
                Cerrar sesión
              </button>
            </div>

            <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Laptop className="h-3 w-3" />
              La sesión y la bóveda se gestionan por dispositivo.
            </p>
          </div>
        </SettingsCard>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-dark-border bg-dark-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-300">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Restablecer configuración
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Vuelve al tema original y a los valores predeterminados de esta
              pantalla. Tus credenciales y tu sesión no se modifican.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {resetNotice && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400"
            >
              <Check className="h-3 w-3" />
              Configuración restablecida
            </span>
          )}
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/15"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </button>
        </div>
      </section>

      {resetDialogOpen && (
        <ConfirmActionDialog
          icon={RotateCcw}
          tone="teal"
          title="Restablecer configuración"
          message="Se aplicará el tema original y se restaurarán los valores predeterminados de esta pantalla. Tus credenciales y tu sesión no se verán afectadas."
          confirmLabel="Restablecer"
          onConfirm={handleReset}
          onCancel={() => setResetDialogOpen(false)}
        />
      )}
    </div>
  );
}
