import { AlertTriangle } from "lucide-react";
import { Credential } from "../../../types/vault";

interface Props {
  credential: Credential | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  credential,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  if (!credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#111927] border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Eliminar credencial</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ¿Seguro que quieres eliminar{" "}
              <span className="text-slate-200 font-semibold">
                {credential.systemName}
              </span>
              ? Esta acción la ocultará de la bóveda.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-xs font-medium text-slate-300 hover:bg-dark-border/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
