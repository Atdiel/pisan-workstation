
import {
    Clock,
    KeyRound,
    Plus,
    Users,
    Briefcase,
    CheckCircle2,
    Utensils,
    Lock,
}  from "lucide-react";

export default function DashboardView({
  userName,
}: {
  userName?: string | null;
}) {
    const now = new Date();
    const hour = now.getHours();
    const greeting =
      hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    const dateLabel = now.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return (
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bienvenida & Acción Rápida */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                ¡{greeting}{userName ? `, ${userName}` : ""}!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} •
                Aquí tienes el resumen operacional de PISANTECH.
              </p>
            </div>

            <button className="bg-brand-teal hover:bg-brand-teal-light text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-brand-teal/20">
              <Plus className="w-4 h-4 stroke-[3]" />
              Nueva Acción Rápida
            </button>
          </div>

          {/* TARJETAS DE MÉTRICAS TOP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Equipo Disponible
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  10{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / 12
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                  83% operativo ahora
                </p>
              </div>
              <div className="p-2.5 bg-brand-teal/10 rounded-lg text-brand-teal border border-brand-teal/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Proyectos Activos
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">6</h3>
                <p className="text-[11px] text-amber-400 mt-2 font-medium">
                  1 con revisión pendiente
                </p>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Avance Planner
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">78%</h3>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                  +12% esta semana
                </p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Credenciales SAP/VPN
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">18</h3>
                <p className="text-[11px] text-slate-400 mt-2">
                  Último cambio: Hoy 10:30
                </p>
              </div>
              <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Lock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* GRID CENTRAL DE 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMNA IZQUIERDA (2 Espacios): Estado de Trabajo + Proyectos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bloque: Estado de Trabajo Actual */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Mi Estado de Trabajo Actual
                  </h3>
                  <button className="text-xs text-brand-teal hover:underline font-medium">
                    Gestionar horarios
                  </button>
                </div>

                <div className="flex items-center justify-between bg-dark-bg/60 border border-dark-border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-navy border border-brand-teal/30 rounded-lg text-brand-teal">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base">
                          Desarrollo ABAP S/4HANA
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ● Activo
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Iniciado a las 09:00 hrs • Ticket PISA-104
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">
                      03:45:12
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                      Tiempo transcurrido
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloque: Proyectos / Módulos en Desarrollo */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Proyectos en Curso
                  </h3>
                  <button className="text-xs text-brand-teal hover:underline font-medium">
                    Ver portafolio
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        Migración MIGO / Reporte DIOT SAP
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        85% Completado
                      </span>
                    </div>
                    <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border">
                      <div className="bg-brand-teal h-full rounded-full w-[85%]"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        Integración Asíncrona REST API (Planta)
                      </span>
                      <span className="text-amber-400 font-semibold">
                        45% En progreso
                      </span>
                    </div>
                    <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden border border-dark-border">
                      <div className="bg-amber-400 h-full rounded-full w-[45%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (1 Espacio): Disponibilidad + Avisos + Accesos Rápidos */}
            <div className="space-y-6">
              {/* Disponibilidad del Equipo */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Disponibilidad del Equipo
                  </h3>
                  <span className="text-xs text-slate-400">12 total</span>
                </div>

                {/* Barra Semántica de Estado */}
                <div className="w-full h-2.5 bg-dark-bg rounded-full flex overflow-hidden gap-0.5 p-0.5 border border-dark-border mb-3">
                  <div
                    className="bg-emerald-400 h-full rounded-s w-[75%]"
                    title="Disponible"
                  ></div>
                  <div
                    className="bg-amber-400 h-full w-[15%]"
                    title="En Comida"
                  ></div>
                  <div
                    className="bg-rose-400 h-full rounded-e w-[10%]"
                    title="Ausente"
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 border-b border-dark-border pb-3 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{" "}
                    9 Disponibles
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>{" "}
                    2 Comida
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> 1
                    Ausente
                  </span>
                </div>

                {/* Avatares Rápida Vista */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {["Carlos", "Ana", "Luis", "Sofia", "Miguel"].map(
                    (name, i) => (
                      <img
                        key={i}
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${name}`}
                        alt={name}
                        title={name}
                        className="w-7 h-7 rounded-full bg-dark-bg border border-brand-teal/30"
                      />
                    ),
                  )}
                  <span className="w-7 h-7 rounded-full bg-dark-border/80 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                    +7
                  </span>
                </div>
              </div>

              {/* Feed Corto de Avisos */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Anuncios Recientes
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-dark-bg/70 border border-dark-border space-y-1">
                    <p className="font-semibold text-slate-200">
                      Mantenimiento de VPN Servidor Dev
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Hoy a las 18:00 hrs por 20 minutos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Rápida (Quick Actions) */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 bg-dark-bg hover:bg-dark-border/50 border border-dark-border p-2.5 rounded-lg text-xs font-medium text-slate-200 transition-colors">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    Iniciar Comida
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-dark-bg hover:bg-dark-border/50 border border-dark-border p-2.5 rounded-lg text-xs font-medium text-slate-200 transition-colors">
                    <KeyRound className="w-3.5 h-3.5 text-brand-teal" />
                    Abrir Bóveda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
    );
}