import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn } from "lucide-react";
// componentes
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { UpdateFooter } from "./components/layout/UpdateFooter";
import { ConfirmActionDialog } from "./components/common/ConfirmActionDialog";

// views
import LoginView from "./views/login/LoginView";
import DashboardView from "./views/dashboard/DashboardView";
import StatusView from "./views/status/StatusView";
import VaultView from "./views/vault/VaultView";
import AdminView from "./views/admin/AdminView";
import ProfileView from "./views/profile/ProfileView";
import SettingsView from "./views/settings/SettingsView";

//types
import type { PresenceStatus, UserStatusType } from "./types/status";

// hooks
import { useAuth } from "./hooks/useAuth";
import { useNow } from "./hooks/useNow";
import { usePresence } from "./hooks/usePresence";
import { useNotificationSettings } from "./hooks/useNotificationSettings";
import { useTeamNotifications } from "./hooks/useTeamNotifications";
import { useLunchReminder } from "./hooks/useLunchReminder";
import { useUpdates } from "./hooks/useUpdates";
import { clearMasterKey } from "./services/masterKey.service";
import {
  getInitialView,
  getRememberLastView,
  saveLastView,
} from "./services/preferences.service";
import { getZonedClock, parseTimeToMinutes } from "./utils/workTime";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => getInitialView());
  const {
    authenticated,
    initializing,
    loggingIn,
    login,
    error,
    user,
    logout,
    refresh,
  } = useAuth();
  const notificationSettings = useNotificationSettings();
  const updates = useUpdates();
  const presence = usePresence(authenticated);
  const now = useNow();
  const refreshPresence = presence.refresh;
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [lunchDialogOpen, setLunchDialogOpen] = useState(false);

  useTeamNotifications({
    change: presence.lastStatusChange,
    currentUserId: user?.id,
    settings: notificationSettings.settings,
    activeTab,
    timeZone: presence.workSchedule.timezone,
  });

  // Al hacer clic en un toast nativo, main restaura la ventana y nos dice a
  // qué sección navegar.
  useEffect(() => {
    const api = window.pisan?.notifications;
    if (!api) return;

    return api.onNavigate((view) => {
      setActiveTab(view);
    });
  }, []);

  // La versión instalada la conoce Electron.
  useEffect(() => {
    let cancelled = false;
    const device = window.pisan?.device;
    if (!device) return;

    void device
      .getInfo()
      .then((info) => {
        if (!cancelled) setAppVersion(info.appVersion);
      })
      .catch((error: unknown) => {
        console.warn("No se pudo obtener la versión de la app:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Al volver a Estado se pide una foto aunque el WebSocket haya perdido
  // algún evento o la otra sesión haya cambiado mientras la vista estaba oculta.
  useEffect(() => {
    if (activeTab === "status") void refreshPresence();
  }, [activeTab, refreshPresence]);

  const myEntry = user ? presence.entriesById[user.id] : undefined;
  const myStatus: PresenceStatus = user
    ? (myEntry?.status ??
      (presence.workSchedule.withinSchedule ? "AVAILABLE" : "OFFLINE"))
    : "OFFLINE";
  const entryStatus = myEntry?.status;
  const entryLunchUntil = myEntry?.lunchUntil;

  const [teamsError, setTeamsError] = useState<string | null>(null);
  const previousMyStatus = useRef<PresenceStatus | null>(null);

  const syncTeams = useCallback(
    (status: PresenceStatus, lunchUntil: string | null) => {
      if (status === "IN_LUNCH" && lunchUntil) {
        const startLunch = window.pisan?.teams?.startLunch;
        if (!startLunch) return;

        setTeamsError(null);
        void startLunch(lunchUntil).catch((error: unknown) => {
          console.error("No se pudo actualizar el estado en Teams:", error);
          setTeamsError(errorMessage(error));
        });
        return;
      }

      const endLunch = window.pisan?.teams?.endLunch;
      if (!endLunch) return;

      void endLunch()
        .then(() => setTeamsError(null))
        .catch((error: unknown) => {
          console.error("No se pudo restablecer el estado en Teams:", error);
          setTeamsError(errorMessage(error));
        });
    },
    [],
  );

  // La presencia del backend es la fuente de verdad. Cuando entra o sale de
  // IN_LUNCH (por acción del usuario, temporizador o scheduler) se replica en
  // Microsoft Teams; Graph se ejecuta solo en el proceso main.
  useEffect(() => {
    if (!authenticated) {
      previousMyStatus.current = null;
      setTeamsError(null);
      return;
    }

    if (!entryStatus) return;

    const previous = previousMyStatus.current;

    if (entryStatus === "IN_LUNCH" && previous !== "IN_LUNCH") {
      if (!entryLunchUntil) return;

      previousMyStatus.current = entryStatus;
      syncTeams(entryStatus, entryLunchUntil);
      return;
    }

    previousMyStatus.current = entryStatus;

    if (previous === "IN_LUNCH" && entryStatus !== "IN_LUNCH") {
      syncTeams(entryStatus, null);
    }
  }, [authenticated, entryStatus, entryLunchUntil, syncTeams]);

  // Si el usuario deja de ser admin, la vista privilegiada no debe quedar
  // abierta aunque el menú se haya renderizado antes del cambio. Se espera a
  // que la sesión y el usuario estén cargados para no perder una vista guardada.
  useEffect(() => {
    if (initializing || !authenticated || !user) return;

    if (activeTab === "admin" && !user.isAdmin) {
      setActiveTab("dashboard");
    }
  }, [activeTab, authenticated, initializing, user]);

  // Guarda la última vista real cuando la preferencia está activa. Las vistas
  // placeholder (Planner/Feed) no se guardan porque todavía no tienen pantalla.
  useEffect(() => {
    if (initializing || !authenticated || !user) return;
    if (activeTab === "admin" && !user.isAdmin) return;
    if (!getRememberLastView()) return;

    saveLastView(activeTab);
  }, [activeTab, authenticated, initializing, user]);

  // Si no se recuerda la última vista, cerrar sesión regresa al inicio para
  // que el siguiente acceso no reutilice la sección anterior.
  useEffect(() => {
    if (initializing || authenticated) return;
    if (!getRememberLastView()) setActiveTab("dashboard");
  }, [authenticated, initializing]);

  const workClock = getZonedClock(now, presence.workSchedule.timezone);
  useLunchReminder({
    authenticated,
    ready: Boolean(myEntry),
    settings: notificationSettings.settings,
    schedule: presence.workSchedule,
    dateKey: workClock.dateKey,
    status: myStatus,
    lastLunchDate: myEntry?.lastLunchDate ?? null,
  });
  const lunchStart = presence.workSchedule.lunchStart ?? "14:00";
  const lunchStartMinutes = parseTimeToMinutes(lunchStart);
  const lunchTakenToday = myEntry?.lastLunchDate === workClock.dateKey;
  const beforeLunchStart = workClock.minutes < lunchStartMinutes;
  const canStartLunch =
    presence.workSchedule.withinSchedule &&
    !lunchTakenToday &&
    !beforeLunchStart;

  const lunchBlockReason = !presence.workSchedule.withinSchedule
    ? "Fuera de horario laboral"
    : lunchTakenToday
      ? "Ya registraste tu comida hoy"
      : beforeLunchStart
        ? `La comida inicia a las ${lunchStart}`
        : null;

  const requestLunch = () => {
    if (myStatus === "IN_LUNCH" || !canStartLunch) return;
    setLunchDialogOpen(true);
  };

  const startLunch = async () => {
    if (!canStartLunch) return;

    try {
      await presence.updateStatus("IN_LUNCH", "Comida");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar la pausa de comida.",
      );
    }
  };

  // Si la comida se inicia desde otro dispositivo, el modal abierto en el
  // header o en la pestaña de comida se cierra para mantener ambos sincronizados.
  useEffect(() => {
    if (!authenticated || myStatus === "IN_LUNCH") {
      setLunchDialogOpen(false);
    }
  }, [authenticated, myStatus]);

  const handleStatusChange = (status: UserStatusType) => {
    if (status === "IN_LUNCH") {
      requestLunch();
      return;
    }

    if (status === myStatus) return;

    void presence.updateStatus(status).catch((err: unknown) => {
      console.error("No se pudo cambiar el estado:", err);
    });
  };

  if (initializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-bg text-slate-400 text-sm">
        Cargando sesión...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginView
        onMicrosoftLogin={login}
        loading={loggingIn}
        error={error}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-slate-200 select-none font-sans">
      {/* ==================== BARRA LATERAL (SIDEBAR) ==================== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        isAdmin={user?.isAdmin ?? false}
      />

      {/* ==================== CONTENIDO PRINCIPAL ==================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* CABECERA (HEADER SUPERIOR) */}
        <Header
          userStatus={myStatus}
          onStatusChange={handleStatusChange}
          withinSchedule={presence.workSchedule.withinSchedule}
          canStartLunch={canStartLunch}
          lunchBlockReason={lunchBlockReason}
          onOpenProfile={() => setActiveTab("profile")}
          user={user}
        />

        {/* ÁREA DE CONTENIDO VARIABLE (Con scroll interno independiente) */}
        <main className="flex-1 overflow-y-auto relative z-0 pb-8">
          {activeTab === "dashboard" && (
            <DashboardView userName={user?.firstName ?? user?.name} />
          )}
          {activeTab === "status" && (
            <StatusView
              currentUser={user}
              presence={presence}
              canStartLunch={canStartLunch}
              lunchBlockReason={lunchBlockReason}
              onRequestLunch={requestLunch}
              teamsError={teamsError}
              onRetryTeams={() => syncTeams(myStatus, entryLunchUntil ?? null)}
            />
          )}
          {activeTab === "vault" && (
            <VaultView
              onMasterKeyRecovery={async () => {
                clearMasterKey();
                await logout();
              }}
            />
          )}
          {activeTab === "profile" && user && (
            <ProfileView
              user={user}
              onSaved={async () => {
                await refresh();
              }}
            />
          )}
          {activeTab === "settings" && (
            <SettingsView
              appVersion={appVersion}
              currentView={activeTab}
              notificationSettings={notificationSettings.settings}
              notificationSettingsLoading={notificationSettings.loading}
              notificationSettingsError={notificationSettings.error}
              notificationsSupported={notificationSettings.supported}
              onNotificationSettingChange={notificationSettings.setSetting}
              onResetNotifications={notificationSettings.reset}
              updateState={updates.state}
              updatesLoading={updates.loading}
              updatesError={updates.error}
              onCheckForUpdates={updates.check}
              onDownloadUpdate={updates.download}
              onInstallUpdate={updates.install}
              onAutoUpdatesChange={updates.setAutoCheck}
              onLogout={logout}
              onOpenVault={() => setActiveTab("vault")}
            />
          )}
          {activeTab === "admin" && user?.isAdmin && (
            <AdminView
              currentUserId={user.id}
              onCurrentUserChanged={async () => {
                await refresh();
              }}
            />
          )}
        </main>

        {/* EFECTO FADE-OUT (Degradado estético sobre el final de la tabla) */}
        <div className="absolute bottom-9 left-0 right-0 h-30 bg-gradient-to-t from-dark-bg to-transparent pointer-events-none z-10" />

        {/* FOOTER GLOBAL (Barra de estado inferior) */}
        <footer className="h-9 shrink-0 w-full bg-dark-bg border-t border-dark-border flex items-center justify-between px-6 text-[11px] text-slate-500 z-20">
          <div className="flex items-center gap-2">
            {/* <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            Sistema en línea */}
          </div>
          <div className="flex items-center gap-3">
            <UpdateFooter
              state={updates.state}
              onDownload={() => void updates.download()}
              onInstall={() => void updates.install()}
            />
            <span>
              PISANTECH Suite{appVersion ? ` v${appVersion}` : ""}
            </span>
          </div>
        </footer>
      </div>

      {/* Confirmación compartida entre el header y la pestaña de comida */}
      {lunchDialogOpen && (
        <ConfirmActionDialog
          icon={LogIn}
          tone="teal"
          title="Ir a comer"
          message="El contador arrancará en 01:00:00 y tu estado cambiará a «En comida» para el resto del equipo. ¿Deseas iniciar la pausa?"
          confirmLabel="Iniciar comida"
          onConfirm={() => {
            setLunchDialogOpen(false);
            void startLunch();
          }}
          onCancel={() => setLunchDialogOpen(false)}
        />
      )}
    </div>
  );
}