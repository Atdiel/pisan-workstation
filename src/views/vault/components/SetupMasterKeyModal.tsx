import { useState } from "react";
import { Lock, ShieldCheck, X } from "lucide-react";

interface Props {
  open: boolean;
  verifying?: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

export function SetupMasterKeyModal({
  open,
  verifying,
  onSubmit,
  onClose,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("La clave debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las claves no coinciden.");
      return;
    }
    setError(null);
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
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
            Crear Clave Maestra
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            Por primera vez define una clave maestra local. Protege la bóveda
            en este dispositivo y no se guarda en ningún servidor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Nueva clave maestra
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres..."
              autoFocus
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Confirmar clave maestra
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la clave..."
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            {verifying ? "Creando..." : "Crear clave maestra"}
          </button>
        </form>

        <div className="pt-3 border-t border-dark-border/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Derivada con PBKDF2 (250k iteraciones) · Nunca se guarda en texto plano
        </div>
      </div>
    </div>
  );
}
