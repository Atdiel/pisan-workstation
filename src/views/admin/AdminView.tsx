import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
} from "../../services/admin.service";
import UserAvatar from "../../components/common/UserAvatar";
import type { UserRole } from "../../types/user";
import { ROLE_LABELS, USER_ROLES } from "../../utils/roles";

interface Props {
  currentUserId: string;
  onCurrentUserChanged: () => Promise<void>;
}

interface Draft {
  role: UserRole;
  isAdmin: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return "Sin conexión";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminView({
  currentUserId,
  onCurrentUserChanged,
}: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
      setDrafts(
        Object.fromEntries(
          list.map((user) => [
            user.id,
            { role: user.role, isAdmin: user.isAdmin },
          ]),
        ),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const adminCount = useMemo(
    () => users.filter((user) => user.isAdmin).length,
    [users],
  );

  const draftFor = (user: AdminUser): Draft =>
    drafts[user.id] ?? { role: user.role, isAdmin: user.isAdmin };

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { role: "ABAP_DEVELOPER", isAdmin: false }),
        ...patch,
      },
    }));
  };

  const isLastAdminRemoval = (user: AdminUser, draft: Draft): boolean =>
    user.isAdmin && !draft.isAdmin && adminCount <= 1;

  const save = async (user: AdminUser) => {
    const draft = draftFor(user);
    const input: { role?: UserRole; isAdmin?: boolean } = {};

    if (draft.role !== user.role) input.role = draft.role;
    if (draft.isAdmin !== user.isAdmin) input.isAdmin = draft.isAdmin;

    if (!input.role && input.isAdmin === undefined) return;

    if (input.isAdmin === false) {
      const confirmed = window.confirm(
        `¿Quitar el acceso de administrador a ${user.name}?`,
      );
      if (!confirmed) return;
    }

    setSavingId(user.id);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateAdminUser(user.id, input);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDrafts((current) => ({
        ...current,
        [updated.id]: {
          role: updated.role,
          isAdmin: updated.isAdmin,
        },
      }));
      setNotice(`Se actualizó a ${updated.name}.`);

      if (updated.id === currentUserId) {
        await onCurrentUserChanged();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Administración de usuarios
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Asigna el rol funcional y el acceso a vistas privilegiadas. Solo un
            administrador puede realizar estos cambios.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-dark-border bg-dark-card px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-dark-border/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-border bg-dark-card p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Usuarios
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{users.length}</p>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-4">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Administradores
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{adminCount}</p>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Vinculados a Entra
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {users.filter((user) => user.linked).length}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border text-left">
            <thead className="bg-dark-bg/40">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Rol funcional</th>
                <th className="px-4 py-3 font-semibold">Administrador</th>
                <th className="px-4 py-3 font-semibold">Vinculación</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/70">
              {loading && users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-xs text-slate-400"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-xs text-slate-400"
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const draft = draftFor(user);
                  const dirty =
                    draft.role !== user.role ||
                    draft.isAdmin !== user.isAdmin;
                  const saving = savingId === user.id;
                  const isSelf = user.id === currentUserId;
                  const lastAdminBlocked = isLastAdminRemoval(user, draft);

                  return (
                    <tr
                      key={user.id}
                      className={isSelf ? "bg-brand-teal/[0.04]" : undefined}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.name}
                            avatar={user.avatar}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-100">
                              {user.name}
                              {isSelf && (
                                <span className="ml-2 rounded bg-brand-teal/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-teal">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={draft.role}
                          onChange={(event) =>
                            updateDraft(user.id, {
                              role: event.target.value as UserRole,
                            })
                          }
                          disabled={saving}
                          className="w-full min-w-48 rounded-lg border border-dark-border bg-dark-bg px-2.5 py-1.5 text-xs text-slate-200 outline-none transition-colors focus:border-brand-teal disabled:opacity-50"
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draft.isAdmin}
                          onClick={() =>
                            updateDraft(user.id, {
                              isAdmin: !draft.isAdmin,
                            })
                          }
                          disabled={saving || lastAdminBlocked}
                          title={
                            lastAdminBlocked
                              ? "No puedes quitar el acceso al último administrador"
                              : undefined
                          }
                          className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            draft.isAdmin
                              ? "border-amber-400/50 bg-amber-500/30"
                              : "border-dark-border bg-dark-bg"
                          }`}
                        >
                          <span
                            className={`h-3.5 w-3.5 rounded-full transition-transform ${
                              draft.isAdmin
                                ? "translate-x-5 bg-amber-300"
                                : "translate-x-0.5 bg-slate-500"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              user.linked
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {user.linked ? "Vinculado" : "Pendiente"}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            {formatLastSeen(user.lastSeenAt)}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="hidden text-[10px] text-slate-500 sm:inline">
                            {formatDate(user.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => void save(user)}
                            disabled={!dirty || saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-brand-teal-light disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Save className="h-3 w-3" />
                            {saving ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Los cambios de rol se reflejan en el siguiente inicio de sesión del
        usuario. El acceso de administrador se valida contra la base en cada
        petición, por lo que una revocación surte efecto de inmediato.
      </p>
    </div>
  );
}
