import { Search, Bell } from "lucide-react";

// types
import type {
  PresenceStatus,
  UserStatusType,
} from "../../types/status";
import type { AvatarConfig } from "../../types/avatar";
import { roleLabel } from "../../utils/roles";
import UserAvatar from "../common/UserAvatar";

interface HeaderProps {
  userStatus: PresenceStatus;
  onStatusChange: (status: UserStatusType) => void;
  withinSchedule: boolean;
  canStartLunch: boolean;
  lunchBlockReason: string | null;
  onOpenProfile: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
    isAdmin?: boolean;
    avatar?: AvatarConfig;
  } | null;
}

const options: Array<{
  id: UserStatusType;
  label: string;
  dot: string;
  active: string;
}> = [
  {
    id: "AVAILABLE",
    label: "Disponible",
    dot: "bg-emerald-400",
    active: "bg-emerald-500/20 text-emerald-400 font-semibold",
  },
  {
    id: "IN_LUNCH",
    label: "Comida",
    dot: "bg-amber-400",
    active: "bg-amber-500/20 text-amber-400 font-semibold",
  },
  {
    id: "AWAY",
    label: "Ausente",
    dot: "bg-rose-400",
    active: "bg-rose-500/20 text-rose-400 font-semibold",
  },
];

export default function Header({
  userStatus,
  onStatusChange,
  withinSchedule,
  canStartLunch,
  lunchBlockReason,
  onOpenProfile,
  user,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-dark-border bg-dark-bg/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
      {/* Buscador Global (Cmd/Ctrl + K) */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar credenciales, tareas, colegas... (Ctrl+K)"
          className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-teal transition-colors"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-dark-border/60 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </span>
      </div>

      {/* Selector de Estado Rápido + Perfil */}
      <div className="flex items-center gap-4">
        <div
          className="bg-dark-card border border-dark-border p-1 rounded-lg flex items-center gap-1 text-xs"
          title={
            withinSchedule
              ? undefined
              : "Fuera de horario laboral: el estado se calcula automáticamente"
          }
        >
          {options.map((option) => {
            const lunchDisabled =
              option.id === "IN_LUNCH" && !canStartLunch;
            const disabled = !withinSchedule || lunchDisabled;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onStatusChange(option.id)}
                disabled={disabled}
                title={lunchDisabled ? (lunchBlockReason ?? undefined) : undefined}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  userStatus === option.id
                    ? option.active
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                {option.label}
              </button>
            );
          })}
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-dark-card rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-brand-teal absolute top-1.5 right-1.5"></span>
        </button>

        {/* Perfil del Usuario */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="group flex items-center gap-3 pl-2 border-l border-dark-border text-left"
          title="Abrir mi perfil"
          aria-label="Abrir mi perfil"
        >
          <UserAvatar
            name={user?.name ?? "Usuario"}
            avatar={user?.avatar}
            className="h-8 w-8 transition-transform group-hover:scale-105"
          />
          <div className="text-left leading-tight hidden sm:block">
            <p className="text-xs font-semibold text-slate-100 group-hover:text-brand-teal transition-colors">
              {user?.name ?? "Usuario"}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-slate-400">
                {user ? roleLabel(user.role) : ""}
              </p>
              {user?.isAdmin && (
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                  Admin
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
