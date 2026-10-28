import { useCallback, useEffect, useRef, useState } from "react";
// componentes
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// views
import LoginView from "./views/login/LoginView";
import DashboardView from "./views/dashboard/DashboardView";
import StatusView from "./views/status/StatusView";
import VaultView from "./views/vault/VaultView";
import AdminView from "./views/admin/AdminView";
import ProfileView from "./views/profile/ProfileView";

//types
import type { PresenceStatus, UserStatusType } from "./types/status";

// hooks
import { useAuth } from "./hooks/useAuth";
import { useNow } from "./hooks/useNow";
import { usePresence } from "./hooks/usePresence";
import { clearMasterKey } from "./services/masterKey.service";
import { getZonedClock, parseTimeToMinutes } from "./utils/workTime";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
  const presence = usePresence(authenticated);
  const now = useNow();

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
  // abierta aunque el menú se haya renderizado antes del cambio.
  useEffect(() => {
    if (activeTab === "admin" && !user?.isAdmin) {
      setActiveTab("dashboard");
    }
  }, [activeTab, user?.isAdmin]);

  const workClock = getZonedClock(now, presence.workSchedule.timezone);
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

  const handleStatusChange = (status: UserStatusType) => {
    if (status === myStatus) return;
    if (status === "IN_LUNCH" && !canStartLunch) return;

    void presence
      .updateStatus(status, status === "IN_LUNCH" ? "Comida" : undefined)
      .catch((err: unknown) => {
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
              teamsError={teamsError}
              onRetryTeams={() => syncTeams(myStatus, entryLunchUntil ?? null)}
            />
          )}
          {activeTab === "vault" && (
            <VaultView
              currentUser={user}
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
          <div>
            PISANTECH Suite v1.0.0
          </div>
        </footer>
      </div>
    </div>
  );
}