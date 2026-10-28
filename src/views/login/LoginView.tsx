import { ShieldCheck, Mail } from "lucide-react";

// assets
import logoPisantech from "../../assets/brand/logoPisantech.svg";

interface LoginViewProps {
  onMicrosoftLogin?: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function LoginView({
  onMicrosoftLogin,
  loading = false,
  error,
}: LoginViewProps) {
  const handleLogin = () => {
    if (!loading && onMicrosoftLogin) {
      onMicrosoftLogin();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f17] flex flex-col items-center justify-between p-6 text-slate-100 font-sans selection:bg-brand-teal selection:text-slate-950">
      {/* Contenedor central de la tarjeta */}
      <div className="my-auto w-full max-w-md">
        <div className="bg-[#111927] border border-dark-border/80 rounded-2xl p-8 shadow-2xl shadow-black/50 space-y-8 relative overflow-hidden backdrop-blur-sm">
          {/* Brillo sutil de fondo en la tarjeta */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header con Isotipo / Branding */}
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-brand-teal/30 flex items-center justify-center shrink-0">
                <img src={logoPisantech} alt="Logo PISANTECH" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-white tracking-tight text-lg">
                  PISANTECH
                </span>
                <span className="text-slate-400 font-normal text-base">
                  Estación de trabajo
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Bienvenido
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa con tus credenciales corporativas (@pisantech.com) para acceder
                al espacio de trabajo.
              </p>
            </div>
          </div>

          {/* Botón de SSO con Microsoft 365 */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-slate-900/90 border border-brand-teal/40 hover:border-brand-teal text-white text-xs font-semibold hover:bg-brand-teal/10 transition-all duration-200 shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Icono vectorial oficial de Microsoft (4 cuadros) */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              <span>
                {loading ? "Esperando a Microsoft..." : "Ingresa con Microsoft 365"}
              </span>
            </button>

            {loading && (
              <p className="text-[11px] text-slate-400 text-center">
                Se abrió tu navegador. Completa el inicio de sesión y vuelve a la
                aplicación.
              </p>
            )}

            {error && (
              <p className="text-xs text-rose-400 text-center whitespace-pre-line">
                {error}
              </p>
            )}

            {/* Divisor sutil y leyenda de seguridad */}
            <div className="pt-2 border-t border-dark-border/60">
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span>
                  Protegido por Microsoft Entra ID · Solo Acceso Corporativo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página con contacto a Soporte TI */}
      <footer className="text-[11px] text-slate-500 text-center py-2 flex items-center justify-center gap-1.5 flex-wrap">
        <span>PISANTECH portal interno · Necesitas acceso?</span>
        <a
          href="mailto:oscar.santiago@pisantech.com"
          className="text-brand-teal hover:underline transition-colors font-medium flex items-center gap-1"
        >
          <Mail className="w-3 h-3 inline" />
          Contactar con Soporte de TI (oscar.santiago@pisantech.com)
        </a>
      </footer>
    </div>
  );
}
