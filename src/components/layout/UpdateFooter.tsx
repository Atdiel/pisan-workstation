import { Download, RefreshCw, RotateCcw } from "lucide-react";
import type { UpdateState } from "../../../electron/ipc-types";

interface UpdateFooterProps {
  state: UpdateState;
  onDownload: () => void;
  onInstall: () => void;
}

export function UpdateFooter({
  state,
  onDownload,
  onInstall,
}: Readonly<UpdateFooterProps>) {
  const { status, availableVersion, progressPercent } = state;

  if (
    status !== "available" &&
    status !== "downloading" &&
    status !== "downloaded"
  ) {
    return null;
  }

  const version = availableVersion ? `v${availableVersion}` : "la actualización";

  return (
    <div
      className="flex items-center gap-2"
      aria-live="polite"
      aria-label="Estado de actualización"
    >
      {status === "available" && (
        <>
          <span className="hidden text-[10px] text-slate-400 md:inline">
            Nueva versión {version} disponible
          </span>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-semibold text-brand-teal transition-colors hover:bg-brand-teal/15"
          >
            <Download className="h-3 w-3" />
            Descargar
          </button>
        </>
      )}

      {status === "downloading" && (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-brand-teal" />
          <span className="text-[10px] text-slate-400">
            Descargando {version} {progressPercent ?? 0}%
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-700/80">
            <div
              className="h-full rounded-full bg-brand-teal transition-[width]"
              style={{ width: `${progressPercent ?? 0}%` }}
            />
          </div>
        </>
      )}

      {status === "downloaded" && (
        <>
          <span className="hidden text-[10px] text-slate-400 md:inline">
            {version} lista para instalar
          </span>
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
          >
            <RotateCcw className="h-3 w-3" />
            Reiniciar e instalar
          </button>
        </>
      )}
    </div>
  );
}
