import {
  LayoutDashboard,
  Clock,
  KeyRound,
  Kanban,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  UserRound,
  LogOut,
  // ChevronDown,
} from "lucide-react";

// assets
import logoPisantech from "../../assets/brand/logoPisantech.svg";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isAdmin = false,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-dark-sidebar border-r border-dark-border flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Logo y Encabezado PISANTECH */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg shadow-brand-teal/20">
            <img
              src={logoPisantech}
              alt="PISANTECH Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-wide text-lg leading-none">
              PISANTECH
            </h3>
            <span className="text-[10px] text-brand-teal font-semibold tracking-wider uppercase">
              Consulting Suite
            </span>
          </div>
        </div>

        {/* Selector de Organización / Proyecto */}
        {/* <div className="bg-dark-card/60 border border-dark-border rounded-lg p-2.5 flex items-center justify-between cursor-pointer hover:border-brand-teal/40 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-brand-navy border border-brand-teal/30 flex items-center justify-center text-xs font-bold text-brand-teal">
              PT
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">
                PISANTECH Devs
              </p>
              <p className="text-[10px] text-slate-400">12 miembros</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div> */}

        {/* Menú de Navegación */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal pl-2.5"
                : "bg-transparent text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard / Inicio
          </button>

          <button
            onClick={() => setActiveTab("status")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "status"
                ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal pl-2.5"
                : "bg-transparent text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
            }`}
          >
            <Clock className="w-4 h-4" />
            Estado y Comida
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "vault"
                ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal"
                : "text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Bóveda de Credenciales
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "planner"
                ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal"
                : "text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
            }`}
          >
            <Kanban className="w-4 h-4" />
            Planner de Teams
          </button>

          <button
            onClick={() => setActiveTab("feed")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "feed"
                ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal"
                : "text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Megaphone className="w-4 h-4" />
              Feed de Avisos
            </div>
            <span className="bg-brand-teal/20 text-brand-teal text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              2
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "admin"
                  ? "bg-brand-teal/15 text-brand-teal font-semibold border-l-2 border-brand-teal pl-2.5"
                  : "text-slate-400 hover:text-brand-teal hover:bg-dark-card/40"
              }`}
            >
              <Users className="w-4 h-4" />
              Administración
            </button>
          )}
        </nav>
      </div>

      {/* Footer Sidebar (Sesión segura y Ajustes) */}
      <div className="space-y-3 pt-4 border-t border-dark-border">
        <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2.5 text-emerald-400 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold leading-tight">Sesión Cifrada</p>
            <p className="text-[10px] text-emerald-500/80">
              Conexión local segura
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "bg-brand-teal/15 text-brand-teal font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-dark-card/40"
          }`}
        >
          <UserRound className="w-4 h-4" />
          Mi perfil
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-dark-card/40 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Ajustes
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
