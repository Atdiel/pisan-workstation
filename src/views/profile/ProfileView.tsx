import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Monitor,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Unlink,
  UserRound,
} from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";
import type { SessionUser } from "../../services/auth.service";
import {
  fetchProfile,
  fetchSessions,
  revokeOtherSessions,
  revokeSession,
  updateAvatar,
  type ProfileSession,
  type ProfileUser,
} from "../../services/profile.service";
import {
  AVATAR_BACKGROUNDS,
  AVATAR_STYLES,
  resolveAvatar,
  type AvatarConfig,
  type AvatarStyle,
} from "../../types/avatar";
import { roleLabel } from "../../utils/roles";

interface Props {
  user: SessionUser;
  onSaved: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatMemberSince(iso?: string): string {
  if (!iso) return "Miembro de PISANTECH";
  return `Miembro desde ${new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;
}

function formatLastSeen(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function platformLabel(platform: string | null): string {
  switch (platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return platform || "Dispositivo";
  }
}

function visibleIp(ip: string | null): string | null {
  if (!ip) return null;
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1"
  ) {
    return "Red local";
  }
  return ip;
}

export default function ProfileView({ user, onSaved }: Props) {
  const saved = resolveAvatar(user.avatar, user.name);
  const [style, setStyle] = useState<AvatarStyle>(saved.style);
  const [seed, setSeed] = useState(saved.seed);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(
    saved.backgroundColor,
  );
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProfileSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsNotice, setSessionsNotice] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = useCallback(async (showSpinner = true) => {
    if (showSpinner) setSessionsLoading(true);
    setSessionsError(null);

    try {
      setSessions(await fetchSessions());
    } catch (err) {
      setSessionsError(errorMessage(err));
    } finally {
      if (showSpinner) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions, user.id]);

  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const preview = useMemo<AvatarConfig>(
    () => ({
      style,
      seed: seed.trim() || user.name,
      backgroundColor,
    }),
    [style, seed, user.name, backgroundColor],
  );

  const dirty =
    style !== saved.style ||
    preview.seed !== saved.seed ||
    backgroundColor !== saved.backgroundColor;

  const randomize = () => {
    const base = user.name.split(/\s+/)[0]?.toLowerCase() || "pisan";
    setSeed(`${base}-${Math.random().toString(36).slice(2, 8)}`);
    setNotice(null);
  };

  const reset = () => {
    setStyle(saved.style);
    setSeed(saved.seed);
    setBackgroundColor(saved.backgroundColor);
    setNotice(null);
    setError(null);
  };

  const save = async () => {
    if (!dirty || saving) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateAvatar({
        style,
        seed: seed.trim() || null,
        backgroundColor,
      });
      const next = resolveAvatar(updated.avatar, updated.name);
      setProfile(updated);
      setStyle(next.style);
      setSeed(next.seed);
      setBackgroundColor(next.backgroundColor);
      await onSaved();
      setNotice("Tu avatar se guardó correctamente.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const revokeOne = async (session: ProfileSession) => {
    const confirmed = window.confirm(
      `¿Desvincular "${session.deviceName}"? Ese equipo perderá el acceso y tendrá que iniciar sesión de nuevo.`,
    );
    if (!confirmed) return;

    setRevokingId(session.id);
    setSessionsError(null);
    setSessionsNotice(null);

    try {
      await revokeSession(session.id);
      setSessionsNotice(`Se desvinculó ${session.deviceName}.`);
      await loadSessions(false);
    } catch (err) {
      setSessionsError(errorMessage(err));
    } finally {
      setRevokingId(null);
    }
  };

  const revokeAllOthers = async () => {
    const others = sessions.filter((session) => !session.isCurrent);
    if (others.length === 0) return;

    const confirmed = window.confirm(
      `¿Desvincular ${others.length} ${
        others.length === 1 ? "sesión" : "sesiones"
      }? Los equipos correspondientes tendrán que iniciar sesión de nuevo.`,
    );
    if (!confirmed) return;

    setRevokingOthers(true);
    setSessionsError(null);
    setSessionsNotice(null);

    try {
      const revoked = await revokeOtherSessions();
      setSessionsNotice(
        revoked === 0
          ? "No había otras sesiones activas."
          : `Se desvincularon ${revoked} ${
              revoked === 1 ? "sesión" : "sesiones"
            }.`,
      );
      await loadSessions(false);
    } catch (err) {
      setSessionsError(errorMessage(err));
    } finally {
      setRevokingOthers(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Mi perfil
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza cómo te ven tus compañeros dentro de PISANTECH Suite.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-semibold text-brand-teal">
          <Sparkles className="h-3 w-3" />
          Tu identidad en la suite
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
        {/* Tarjeta de identidad */}
        <section className="overflow-hidden rounded-2xl border border-dark-border bg-dark-card">
          <div className="h-24 bg-gradient-to-br from-brand-teal/25 via-brand-teal/10 to-transparent" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
            <UserAvatar
              name={user.name}
              avatar={preview}
              className="h-24 w-24 border-4 border-dark-card shadow-xl shadow-black/30"
              showBorder={false}
            />
            <h2 className="mt-3 text-lg font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full border border-dark-border bg-dark-bg px-2.5 py-1 text-[10px] font-medium text-slate-300">
                {roleLabel(user.role)}
              </span>
              {user.isAdmin && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                  Administrador
                </span>
              )}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500">
              <UserRound className="h-3 w-3" />
              {formatMemberSince(profile?.createdAt)}
            </p>

            <div className="mt-5 w-full rounded-xl border border-dark-border bg-dark-bg/60 p-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Tu avatar aparece en
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                La barra superior, la matriz de disponibilidad y la vista de
                administración de usuarios.
              </p>
            </div>
          </div>
        </section>

        {/* Editor de avatar */}
        <section className="rounded-2xl border border-dark-border bg-dark-card">
          <div className="flex flex-col gap-3 border-b border-dark-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Palette className="h-4 w-4 text-brand-teal" />
                Diseña tu avatar
              </h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Elige un estilo, genera una variación y guarda tu favorito.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={!dirty || saving}
                className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Restablecer
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-brand-teal-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Guardando..." : "Guardar avatar"}
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5">
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

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Estilo
                </label>
                <span className="text-[10px] text-slate-500">
                  {AVATAR_STYLES.find((item) => item.id === style)?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {AVATAR_STYLES.map((option) => {
                  const active = option.id === style;
                  const optionAvatar: AvatarConfig = {
                    style: option.id,
                    seed: preview.seed,
                    backgroundColor,
                  };

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setStyle(option.id);
                        setNotice(null);
                      }}
                      title={option.description}
                      aria-pressed={active}
                      className={`group rounded-xl border p-2.5 text-left transition-all ${
                        active
                          ? "border-brand-teal bg-brand-teal/10"
                          : "border-dark-border bg-dark-bg/40 hover:border-slate-600 hover:bg-dark-border/30"
                      }`}
                    >
                      <div className="flex justify-center">
                        <UserAvatar
                          name={user.name}
                          avatar={optionAvatar}
                          className="h-14 w-14 transition-transform group-hover:scale-105"
                          showBorder={false}
                          loading="lazy"
                        />
                      </div>
                      <p
                        className={`mt-2 text-center text-[10px] font-semibold ${
                          active ? "text-brand-teal" : "text-slate-300"
                        }`}
                      >
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="avatar-seed"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Variación
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="avatar-seed"
                  type="text"
                  value={seed}
                  maxLength={80}
                  onChange={(event) => {
                    setSeed(event.target.value);
                    setNotice(null);
                  }}
                  placeholder={user.name}
                  className="min-w-0 flex-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-brand-teal"
                />
                <button
                  type="button"
                  onClick={randomize}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-brand-teal/50 hover:text-brand-teal"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  Generar otra
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                La variación cambia el resultado del avatar. Si la dejas vacía,
                se usará tu nombre.
              </p>
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Fondo
              </span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_BACKGROUNDS.map((background) => {
                  const active =
                    (background.value ?? null) === (backgroundColor ?? null);

                  return (
                    <button
                      key={background.label}
                      type="button"
                      onClick={() => {
                        setBackgroundColor(background.value);
                        setNotice(null);
                      }}
                      aria-pressed={active}
                      title={background.label}
                      className={`relative h-9 w-9 overflow-hidden rounded-full border-2 transition-transform hover:scale-105 ${
                        active
                          ? "border-brand-teal ring-2 ring-brand-teal/30"
                          : "border-dark-border"
                      }`}
                      style={
                        background.value
                          ? { backgroundColor: `#${background.value}` }
                          : undefined
                      }
                    >
                      {!background.value && (
                        <>
                          <span className="absolute inset-0 bg-dark-bg" />
                          <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-rose-400/70" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-dark-border bg-dark-card">
        <div className="flex flex-col gap-3 border-b border-dark-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-brand-teal" />
              Sesiones y dispositivos
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Revisa dónde está abierta tu cuenta y desvincula los equipos que
              ya no uses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSessions()}
            disabled={sessionsLoading || revokingId !== null || revokingOthers}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-dark-border bg-dark-bg px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-dark-border/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>

        <div className="space-y-3 p-5">
          {sessionsError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{sessionsError}</span>
            </div>
          )}

          {sessionsNotice && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{sessionsNotice}</span>
            </div>
          )}

          {sessionsLoading && sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Cargando sesiones...
            </p>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No hay sesiones activas.
            </p>
          ) : (
            <div className="divide-y divide-dark-border/70 overflow-hidden rounded-xl border border-dark-border">
              {sessions.map((session) => {
                const meta = [
                  platformLabel(session.platform),
                  session.appVersion ? `v${session.appVersion}` : null,
                  visibleIp(session.ipAddress),
                ]
                  .filter(Boolean)
                  .join(" · ");
                const revoking = revokingId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                      session.isCurrent ? "bg-brand-teal/[0.04]" : "bg-dark-bg/20"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg border border-dark-border bg-dark-bg p-2 text-slate-400">
                        <Monitor className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-semibold text-slate-100">
                            {session.deviceName}
                          </p>
                          {session.isCurrent && (
                            <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                              Este dispositivo
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {meta || "Dispositivo"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Última actividad: {formatLastSeen(session.lastSeenAt)}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => void revokeOne(session)}
                        disabled={
                          revoking ||
                          revokingOthers ||
                          revokingId !== null
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-[11px] font-medium text-rose-300 transition-colors hover:border-rose-400/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        {revoking ? "Desvinculando..." : "Desvincular"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sessions.some((session) => !session.isCurrent) && (
            <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-400">
                Si perdiste un equipo, puedes cerrar todas las demás sesiones
                de una vez.
              </p>
              <button
                type="button"
                onClick={() => void revokeAllOthers()}
                disabled={
                  revokingOthers || revokingId !== null || sessionsLoading
                }
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[11px] font-semibold text-rose-300 transition-colors hover:border-rose-400/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Unlink className="h-3.5 w-3.5" />
                {revokingOthers
                  ? "Desvinculando..."
                  : "Cerrar todas las demás"}
              </button>
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-slate-500">
            Al desvincular un equipo, su sesión deja de ser válida de inmediato.
            Si la persona vuelve a iniciar sesión manualmente, podrá autorizar
            ese dispositivo otra vez.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-dark-border bg-dark-card/40 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/10 p-2 text-brand-teal">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Este espacio crecerá contigo
            </h2>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-500">
              Aquí agregaremos datos personales, preferencias de notificaciones
              y más opciones de seguridad de la cuenta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
