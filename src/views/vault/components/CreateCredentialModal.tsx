import {
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

interface Props {
  open: boolean;
  form: CredentialForm;
  saving: boolean;
  currentUserName: string;
  onChange: (form: CredentialForm) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateCredentialModal({
  open,
  form,
  saving,
  currentUserName,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-900/40 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Add credentials
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Acme Transformation · Shared Password Vault
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Securely store a system or service login in your team's vault.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                System / service name <span className="text-indigo-400">*</span>
              </label>
              <input
                required
                value={form.systemName}
                onChange={(e) => onChange({ ...form, systemName: e.target.value })}
                placeholder="SAP S/4HANA — PRD"
                className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Environment <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.environment}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      environment: e.target.value as CredentialForm["environment"],
                    })
                  }
                  className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="PRD">Production</option>
                  <option value="QAS">QA / Staging</option>
                  <option value="DEV">Development</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Credential type <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      type: e.target.value as CredentialForm["type"],
                    })
                  }
                  className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="SAP_LOGON">SAP Logon</option>
                  <option value="VPN">VPN</option>
                  <option value="WEB_SITE">Web Site</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Username / email <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  value={form.username}
                  onChange={(e) => onChange({ ...form, username: e.target.value })}
                  placeholder="mchen_admin"
                  className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Password <span className="text-indigo-400">*</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate password
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange({ ...form, password: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all font-mono"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex gap-1 flex-1">
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                  <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-emerald-400">
                  Strong password
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Sign-in URL <span className="text-slate-500">· Optional</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.url}
                  onChange={(e) => onChange({ ...form, url: e.target.value })}
                  placeholder="https://example.com/login"
                  className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Notes <span className="text-slate-500">· Optional</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => onChange({ ...form, notes: e.target.value })}
                placeholder="Add access instructions or details for your team..."
                className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Last updated by
              </label>
              <p className="w-full bg-[#0b0f17] border border-slate-800 text-sm text-slate-300 rounded-xl px-4 py-3">
                {currentUserName}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Encrypted with AES-256. All credential access is logged and
                monitored.
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-5 mt-6">
              <span className="text-xs text-slate-500">
                <span className="text-indigo-400">*</span> Required fields
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save credentials"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
