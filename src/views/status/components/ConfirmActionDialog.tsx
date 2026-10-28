import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "teal" | "indigo";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo genérico de confirmación (mismo estilo visual que
 * DeleteConfirmDialog de Bóveda).
 */
export function ConfirmActionDialog({
  icon: Icon,
  title,
  message,
  confirmLabel,
  tone = "teal",
  onConfirm,
  onCancel,
}: Props) {
  const isTeal = tone === "teal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[#111927] border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
              isTeal
                ? "bg-brand-teal/10 border-brand-teal/30 text-brand-teal"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg bg-dark-border/60 hover:bg-dark-border text-slate-300 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg ${
              isTeal
                ? "bg-brand-teal text-slate-950 hover:bg-brand-teal-light shadow-brand-teal/20"
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
