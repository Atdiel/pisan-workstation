import { useEffect, useMemo, useRef, useState } from "react";
import { useLunchTimer } from "../../hooks/useLunchTimer";
import type { PresenceApi } from "../../hooks/usePresence";
import { useUsers } from "../../hooks/useUsers";
import type { SessionUser } from "../../services/auth.service";
import type {
  TeamMember,
  TeamMemberStatus,
  UserStatusEntry,
} from "../../types/status";
import { roleLabel } from "../../utils/roles";
import UserAvatar from "../../components/common/UserAvatar";
import { ConfirmActionDialog } from "./components/ConfirmActionDialog";
import {
  Utensils,
  Square,
  SlidersHorizontal,
  PlusCircle,
  LogIn,
  Clock,
  CheckCircle2,
  ChevronDown,
  Globe,
  Edit2,
} from "lucide-react";

interface Props {
  currentUser: SessionUser | null;
  presence: PresenceApi;
  canStartLunch: boolean;
  lunchBlockReason: string | null;
  teamsError: string | null;
  onRetryTeams: () => void;
}

const formatHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Mapea el estado efectivo del backend al vocabulario de la UI. */
const mapIncomingStatus = (entry?: UserStatusEntry): TeamMemberStatus => {
  if (!entry) return "Offline";

  switch (entry.status) {
    case "IN_LUNCH":
      return "In lunch";
    case "AWAY":
      return "Away";
    case "AVAILABLE":
      return "Available";
    default:
      return "Offline";
  }
};

const offlineLabel = (entry?: UserStatusEntry): string => {
  if (entry?.offlineReason === "SCHEDULE") return "Fuera de horario";
  if (entry?.offlineReason === "DISCONNECTED") return "Desconectado";
  return "Sin conexión";
};

const buildTiming = (
  status: TeamMemberStatus,
  entry?: UserStatusEntry,
): string => {
  if (!entry) return "Sin registro";

  if (status === "Offline") return offlineLabel(entry);

  if (status === "In lunch" && entry.lunchUntil) {
    return `En comida hasta ${formatHour(entry.lunchUntil)}`;
  }

  return entry.updatedAt
    ? `Últ. cambio ${formatHour(entry.updatedAt)}`
    : "Sin registro";
};

export default function StatusView({
  currentUser,
  presence,
  canStartLunch,
  lunchBlockReason,
  teamsError,
  onRetryTeams,
}: Props) {
  const users = useUsers();
  const [dialog, setDialog] = useState<"lunch" | "finish" | null>(null);
  const autoEnded = useRef(false);

  const myEntry = currentUser
    ? presence.entriesById[currentUser.id]
    : undefined;
  const updateStatus = presence.updateStatus;
  const lunchUntil =
    myEntry?.status === "IN_LUNCH" ? myEntry.lunchUntil : null;

  const { secondsLeft, isInLunch, startedAt, formatTime, progressPercent, percentLeft } =
    useLunchTimer(lunchUntil);

  // Respaldo del scheduler: si el cliente está abierto al vencer el reloj,
  // devuelve el estado a AVAILABLE de inmediato.
  useEffect(() => {
    if (myEntry?.status !== "IN_LUNCH") {
      autoEnded.current = false;
      return;
    }

    if (secondsLeft === 0 && !autoEnded.current) {
      autoEnded.current = true;
      void updateStatus("AVAILABLE").catch((err: unknown) => {
        console.error("No se pudo finalizar la comida:", err);
      });
    }
  }, [myEntry?.status, secondsLeft, updateStatus]);

  const members: TeamMember[] = useMemo(
    () =>
      users.map((user) => {
        const entry = presence.entriesById[user.id];
        const status = mapIncomingStatus(entry);
        return {
          id: user.id,
          name: user.name,
          role: roleLabel(user.role),
          avatar: user.avatar,
          status,
          offlineReason: entry?.offlineReason ?? null,
          activity:
            status === "Offline"
              ? offlineLabel(entry)
              : (entry?.activity ?? "Sin actividad registrada"),
          timing: buildTiming(status, entry),
        };
      }),
    [users, presence.entriesById],
  );

  const finishAt =
    isInLunch && lunchUntil
      ? formatHour(lunchUntil)
      : null;

  const startLunch = async () => {
    if (!canStartLunch) return;

    try {
      await presence.updateStatus("IN_LUNCH", "Comida");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar la pausa de comida.",
      );
    }
  };

  const endLunch = async () => {
    try {
      await presence.updateStatus("AVAILABLE");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo finalizar la pausa de comida.",
      );
    }
  };

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      {/* Aviso de horario laboral */}
      {!presence.workSchedule.withinSchedule && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
          Fuera de horario laboral ({presence.workSchedule.start}–
          {presence.workSchedule.end}, {presence.workSchedule.timezone}). El
          estado del equipo se mantiene <strong>Offline</strong> hasta el
          siguiente día hábil.
        </div>
      )}

      {presence.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          No se pudo cargar la presencia: {presence.error}
        </div>
      )}

      {teamsError && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300 sm:flex-row sm:items-center sm:justify-between">
          <span className="break-words">
            No se pudo sincronizar tu estado con Microsoft Teams: {teamsError}
          </span>
          <button
            type="button"
            onClick={onRetryTeams}
            className="shrink-0 self-start rounded-lg border border-amber-400/40 px-3 py-1 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/10 sm:self-auto"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Estado de Trabajo y Temporizador de Comida
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mantén tu disponibilidad precisa en Teams, Planner y espacios de
            trabajo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-card border border-dark-border text-xs font-medium text-slate-300 hover:bg-dark-border/50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Reglas de disponibilidad
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-teal text-slate-950 font-semibold text-xs hover:bg-brand-teal-light transition-colors shadow-lg shadow-brand-teal/20">
            <PlusCircle className="w-3.5 h-3.5" />
            Establecer estado
          </button>
        </div>
      </div>

      {/* Grid Principal: Temporizador + Resumen de Hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner / Card Principal Temporizador */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">
                  {isInLunch
                    ? "Pausa para comer en progreso"
                    : "Pausa para comer"}
                </h2>
                {isInLunch ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    En comida
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Disponible
                  </span>
                )}
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isInLunch && startedAt && finishAt
                ? `Inició a las ${formatHour(startedAt)} · Finalización automática a las ${finishAt}`
                : lunchBlockReason
                  ? `Pausa no disponible · ${lunchBlockReason}`
                  : "Sin pausa iniciada · Pulsa «Ir a comer» para arrancar el contador"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
            {/* Anillo de Tiempo Transcurrido */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-0" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-400 transition-all duration-1000"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {formatTime(secondsLeft)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                    {isInLunch ? "Restante" : "Pausado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de Progreso y Estadísticas */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Tiempo restante</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatTime(secondsLeft)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${percentLeft}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-border/60">
                <div>
                  <p className="text-[11px] text-slate-400">Meta</p>
                  <p className="text-sm font-semibold text-slate-200">60 min</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Horario</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {presence.workSchedule.start}–{presence.workSchedule.end}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Presencia</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    En vivo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialog("lunch")}
                  disabled={isInLunch || !canStartLunch}
                  title={
                    !canStartLunch
                      ? (lunchBlockReason ?? undefined)
                      : undefined
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-slate-950 font-semibold text-xs hover:bg-brand-teal-light transition-colors shadow-lg shadow-brand-teal/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Ir a comer
                </button>
                <button
                  type="button"
                  onClick={() => setDialog("finish")}
                  disabled={!isInLunch}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Finalizar comida
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Resumen del Día y Automatizaciones */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Card Resumen de Hoy */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Hoy</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2 text-slate-400">
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  Primera conexión
                </span>
                <span className="font-mono text-slate-200 font-medium">
                  08:50
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Trabajo enfocado
                </span>
                <span className="font-mono text-slate-200 font-medium">
                  5h 10m
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2 text-slate-400">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  Tiempo de comida
                </span>
                <span className="font-mono text-amber-400 font-medium">
                  24m
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-dark-border/60">
                <span className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Hora estimada de salida
                </span>
                <span className="font-mono text-slate-200 font-medium">
                  {presence.workSchedule.end}
                </span>
              </div>
            </div>
          </div>

          {/* Card Automatizaciones Inteligentes */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Automatizaciones
              </h3>
              <button className="text-[11px] text-brand-teal hover:underline font-medium flex items-center gap-1">
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu presencia en Teams y Planner se actualizan automáticamente al
              cambiar estos temporizadores.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Las 3 integraciones están operativas
            </div>
          </div>
        </div>
      </div>

      {/* Matriz de Disponibilidad del Equipo */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {/* Cabecera de la Tabla */}
        <div className="p-4 sm:p-5 border-b border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">
            Matriz de disponibilidad del equipo
          </h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-slate-300 hover:border-slate-600 transition-colors">
              Todos los equipos
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-slate-300 hover:border-slate-600 transition-colors">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {presence.workSchedule.timezone}
            </button>
          </div>
        </div>

        {/* Tabla Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-bg/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-dark-border">
              <tr>
                <th className="py-3 px-4">Miembro del equipo</th>
                <th className="py-3 px-4">Estado en tiempo real</th>
                <th className="py-3 px-4">Actividad actual</th>
                <th className="py-3 px-4 text-right">Tiempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60">
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 px-4 text-center text-slate-400"
                  >
                    Cargando equipo…
                  </td>
                </tr>
              )}
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-dark-border/30 transition-colors"
                >
                  {/* Miembro */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={member.name}
                        avatar={member.avatar}
                        className="h-8 w-8 shadow-md"
                      />
                      <div>
                        <p className="font-semibold text-slate-200">
                          {member.name}
                          {member.id === currentUser?.id && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-teal/15 text-brand-teal border border-brand-teal/30 align-middle">
                              Tú
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4">
                    {member.status === "In lunch" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        En comida
                      </span>
                    )}
                    {member.status === "Available" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Disponible
                      </span>
                    )}
                    {member.status === "Away" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Ausente
                      </span>
                    )}
                    {member.status === "Offline" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        {member.offlineReason === "SCHEDULE"
                          ? "Fuera de horario"
                          : "Desconectado"}
                      </span>
                    )}
                  </td>

                  {/* Actividad */}
                  <td className="py-3.5 px-4 text-slate-300">
                    {member.activity}
                  </td>

                  {/* Timing */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span
                      className={
                        member.status === "In lunch"
                          ? "text-amber-400 font-medium"
                          : "text-slate-400"
                      }
                    >
                      {member.timing}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmaciones de acción */}
      {dialog === "lunch" && (
        <ConfirmActionDialog
          icon={LogIn}
          tone="teal"
          title="Ir a comer"
          message="El contador arrancará en 01:00:00 y tu estado cambiará a «En comida» para el resto del equipo. ¿Deseas iniciar la pausa?"
          confirmLabel="Iniciar comida"
          onConfirm={() => {
            setDialog(null);
            void startLunch();
          }}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "finish" && (
        <ConfirmActionDialog
          icon={Square}
          tone="indigo"
          title="Finalizar comida"
          message="Se detendrá el contador y tu estado volverá a «Disponible» para el resto del equipo. ¿Deseas finalizar la pausa?"
          confirmLabel="Finalizar comida"
          onConfirm={() => {
            setDialog(null);
            void endLunch();
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
