import {
  AlertTriangle,
  KeyRound,
  Lock,
  Plus,
  RotateCw,
  //ShieldAlert,
} from "lucide-react";
import { useVaultMetrics } from "../../../hooks/useVaultMetrics";
import { VaultMetrics } from "../../../types/vault";

const EMPTY_METRICS: VaultMetrics = {
  total: 0,
  rotatedThisMonth: 0,
  pendingRotation: 0,
  newAccesses: 0,
};

export function VaultHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Bóveda de Credenciales Segura
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Credenciales de acceso privilegiado con
          políticas de rotación y re-autenticación.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-card border border-dark-border text-xs font-medium text-slate-300 hover:bg-dark-border/50 transition-colors">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-teal" />
          Auditoría de seguridad
        </button> */}
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-teal text-slate-950 font-semibold text-xs hover:bg-brand-teal-light transition-colors shadow-lg shadow-brand-teal/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar credencial
        </button>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useVaultMetrics();
  const metrics = data ?? EMPTY_METRICS;
  const value = (n: number) => (isLoading ? "—" : n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">
            Total de credenciales
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {value(metrics.total)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/60 text-slate-400">
          <KeyRound className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">
            Rotadas este mes
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {value(metrics.rotatedThisMonth)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <RotateCw className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">
            Pendientes por rotar
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {value(metrics.pendingRotation)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">
            Accesos nuevos
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {value(metrics.newAccesses)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Lock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
