import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from "lucide-react";

interface Props {
  open: boolean;
  masterKey: string;
  showPassword: boolean;
  rememberDevice: boolean;
  error?: string | null;
  verifying?: boolean;
  onForgot?: () => void;
  onMasterKeyChange: (v: string) => void;
  onTogglePassword: () => void;
  onRememberChange: (v: boolean) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MasterKeyModal({
  open,
  masterKey,
  showPassword,
  rememberDevice,
  error,
  verifying,
  onForgot,
  onMasterKeyChange,
  onTogglePassword,
  onRememberChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111927] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-card transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Confirmar Clave Maestra
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            Ingresa tu clave maestra local para revelar o copiar
            credenciales privilegiadas. Esta verificación expira tras 10
            minutos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Clave Maestra local
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={masterKey}
                onChange={(e) => onMasterKeyChange(e.target.value)}
                placeholder="Escribe tu contraseña..."
                autoFocus
                className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg pl-9 pr-10 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => onRememberChange(e.target.checked)}
              className="rounded border-dark-border bg-dark-bg text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-xs text-slate-300">
              Confiar en este dispositivo administrado por 10 minutos
            </span>
          </label>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          {onForgot && (
            <p className="text-center">
              <button
                type="button"
                onClick={onForgot}
                className="text-[11px] text-brand-teal hover:underline"
              >
                ¿Olvidaste tu clave? Recuperar con cuenta Microsoft
              </button>
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-xs font-medium text-slate-300 hover:bg-dark-border/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {verifying ? "Verificando..." : "Verificar y revelar"}
            </button>
          </div>
        </form>

        <div className="pt-3 border-t border-dark-border/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Clave maestra local · Acceso desbloqueado por 10 minutos
        </div>
      </div>
    </div>
  );
}
