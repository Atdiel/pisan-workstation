import { X } from "lucide-react";
import { Credential, CredentialForm } from "../../../types/vault";

interface Props {
  credential: Credential | null;
  form: CredentialForm;
  saving: boolean;
  currentUserName: string;
  onChange: (form: CredentialForm) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditCredentialModal({
  credential,
  form,
  saving,
  currentUserName,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#111927] border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-card transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Editar credencial</h2>
          <p className="text-xs text-slate-400">
            Modifica los campos y guarda para hacer PATCH /vault/:id
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Sistema / Servicio
            </label>
            <input
              value={form.systemName}
              onChange={(e) => onChange({ ...form, systemName: e.target.value })}
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Tipo
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                onChange({
                  ...form,
                  type: e.target.value as CredentialForm["type"],
                })
              }
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-teal"
            >
              <option value="SAP_LOGON">SAP_LOGON</option>
              <option value="VPN">VPN</option>
              <option value="WEB_SITE">WEB_SITE</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Entorno
            </label>
            <select
              value={form.environment}
              onChange={(e) =>
                onChange({
                  ...form,
                  environment: e.target.value as CredentialForm["environment"],
                })
              }
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-teal"
            >
              <option value="PRD">PRD</option>
              <option value="QAS">QAS</option>
              <option value="DEV">DEV</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Usuario
            </label>
            <input
              value={form.username}
              onChange={(e) => onChange({ ...form, username: e.target.value })}
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange({ ...form, password: e.target.value })}
              placeholder="Dejar vacío para conservar la actual"
              className="w-full bg-dark-bg border border-dark-border text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-teal font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Actualizado por
            </label>
            <p className="w-full bg-dark-bg border border-dark-border text-xs text-slate-300 rounded-lg px-3 py-2.5">
              {currentUserName}
            </p>
          </div>

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
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-teal text-slate-950 font-semibold text-xs hover:bg-brand-teal-light transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
