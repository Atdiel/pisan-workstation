import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  EyeOff,
  Globe,
  Key,
  Lock,
  RefreshCw,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { CredentialForm } from "../../../types/vault";
import {
  generateStrongPassword,
  getPasswordStrength,
  STRENGTH_SEGMENTS,
} from "../password";

interface Props {
  open: boolean;
  form: CredentialForm;
  saving: boolean;
  onChange: (form: CredentialForm) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateCredentialModal({
  open,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) setShowPassword(false);
  }, [open]);

  if (!open) return null;

  const strength = getPasswordStrength(form.password);

  const handleGeneratePassword = () => {
    onChange({ ...form, password: generateStrongPassword() });
    setShowPassword(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="shrink-0 px-6 pt-6 pb-4 pr-14 border-b border-dark-border/80 space-y-3">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Nueva credencial
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Bóveda de contraseñas compartidas
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Almacena de forma segura un inicio de sesión de un sistema o servicio en la bóveda de tu equipo.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Sistema / nombre del servicio <span className="text-indigo-400">*</span>
              </label>
              <input
                required
                value={form.systemName}
                onChange={(e) => onChange({ ...form, systemName: e.target.value })}
                placeholder="SAP S/4HANA — PRD"
                className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Entorno  <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.environment}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      environment: e.target.value as CredentialForm["environment"],
                    })
                  }
                  className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="PRD">Productivo</option>
                  <option value="QAS">Calidad</option>
                  <option value="DEV">Desarrollo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Tipo de credencial <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      type: e.target.value as CredentialForm["type"],
                    })
                  }
                  className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="SAP_LOGON">SAP Logon</option>
                  <option value="VPN">VPN</option>
                  <option value="WEB_SITE">Sitio Web</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                usuario / email <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  value={form.username}
                  onChange={(e) => onChange({ ...form, username: e.target.value })}
                  placeholder="mchen_admin"
                  className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Contraseña <span className="text-indigo-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generar contraseña
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => onChange({ ...form, password: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div
                className="flex items-center gap-2 pt-1"
                role="progressbar"
                aria-label="Password strength"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={strength.score}
                aria-valuetext={strength.label}
              >
                <div className="flex gap-1 flex-1">
                  {STRENGTH_SEGMENTS.map((segment) => (
                    <div
                      key={segment}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        segment <= strength.score
                          ? strength.barClass
                          : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-xs font-medium ${strength.textClass}`}
                  aria-live="polite"
                >
                  {strength.label}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                URL <span className="text-slate-500">· Opcional</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.url}
                  onChange={(e) => onChange({ ...form, url: e.target.value })}
                  placeholder="https://ejemplo.com/registro"
                  className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Notas <span className="text-slate-500">· Opcional</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => onChange({ ...form, notes: e.target.value })}
                placeholder="Agrega instrucciones de acceso o detalles para tu equipo..."
                className="w-full bg-dark-bg border border-dark-border text-sm text-slate-100 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all resize-none"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-dark-border/80 bg-dark-card">
            <div className="flex items-center gap-2 px-6 pt-4 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Encriptado con AES-256. Todos los accesos a las credenciales están registrados y
                monitoreados.
              </span>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                <span className="text-indigo-400">*</span> Campos obligatorios
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save credentials"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
