import {
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";
import { Credential } from "../../../types/vault";
import { CredentialIcon } from "./CredentialIcon";

const ENV_STYLES: Record<Credential["environment"], string> = {
  PRD: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  QAS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DEV: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

interface Props {
  credentials: Credential[];
  isUnlocked: boolean;
  revealedIds: string[];
  copiedId: string | null;
  menuOpenId: string | null;
  onToggleMenu: (id: string) => void;
  onOpenEdit: (cred: Credential) => void;
  onDelete: (cred: Credential) => void;
  onToggleVisibility: (cred: Credential) => void;
  onCopy: (cred: Credential) => void;
}

export function CredentialsTable({
  credentials,
  isUnlocked,
  revealedIds,
  copiedId,
  menuOpenId,
  onToggleMenu,
  onOpenEdit,
  onDelete,
  onToggleVisibility,
  onCopy,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-dark-bg/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-dark-border">
          <tr>
            <th className="py-3 px-4">Sistema / Nombre del Servicio</th>
            <th className="py-3 px-4">Entorno</th>
            <th className="py-3 px-4">Usuario</th>
            <th className="py-3 px-4">Contraseña Protegida</th>
            <th className="py-3 px-4">Última Modificación</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-border/60">
          {credentials.map((cred) => {
            const isRevealed = revealedIds.includes(cred.id) && isUnlocked;
            return (
              <tr
                key={cred.id}
                className="hover:bg-dark-border/30 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center shrink-0">
                      <CredentialIcon type={cred.iconType} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        {cred.systemName}
                      </p>
                      <p className="text-[10px] text-slate-400">{cred.type}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ENV_STYLES[cred.environment]}`}
                  >
                    {cred.environment}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-300">
                  {cred.username}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 min-w-[120px]">
                      {isRevealed ? cred.realPassword : cred.password}
                    </span>
                    <button
                      onClick={() => onToggleVisibility(cred)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-border transition-colors"
                      title={
                        isRevealed
                          ? "Ocultar contraseña"
                          : "Revelar contraseña"
                      }
                    >
                      {isRevealed ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onCopy(cred)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-border transition-colors"
                      title="Copiar contraseña"
                    >
                      {copiedId === cred.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <p className="text-slate-300">{cred.lastUpdatedBy}</p>
                  <p className="text-[10px] text-slate-500">
                    {cred.lastUpdatedDate}
                  </p>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenEdit(cred)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-border transition-colors"
                      title="Editar credencial"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => onToggleMenu(cred.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-dark-border transition-colors"
                        title="Más acciones"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuOpenId === cred.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-dark-card border border-dark-border rounded-lg shadow-xl z-10 overflow-hidden">
                          <button
                            onClick={() => onDelete(cred)}
                            className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Eliminar credencial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
