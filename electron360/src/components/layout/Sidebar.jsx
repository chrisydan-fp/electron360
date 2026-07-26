import {
  LayoutDashboard,
  Users,
  PlusCircle,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { useNavStore } from "../../store/useNavStore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "nueva-orden", label: "Nueva Orden", icon: PlusCircle },
  { id: "ordenes", label: "Órdenes de Servicio", icon: ClipboardList },
  { id: "garantias", label: "Garantías", icon: ShieldCheck },
  { id: "reportes", label: "Reportes e Ingresos", icon: BarChart3 },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const currentView = useNavStore((s) => s.currentView);
  const setView = useNavStore((s) => s.setView);

  return (
    <aside className="w-64 h-full bg-sidebar-gradient border-r border-white/5 flex flex-col">
      {/* Logo / marca */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-9 h-9 rounded-lg bg-electric-gradient flex items-center justify-center shadow-neon-blue-sm">
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none tracking-tight">
            Electron<span className="text-neon-blue">360</span>
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            Gestión de Taller
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group relative
                ${
                  active
                    ? "bg-electric-500/10 text-white border border-electric-500/40 shadow-neon-blue-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-neon-blue shadow-neon-blue" />
              )}
              <Icon
                size={18}
                className={active ? "text-neon-blue" : "text-slate-500 group-hover:text-slate-300"}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-base-900/60 border border-white/5">
        <p className="text-xs text-slate-500">
          Versión <span className="text-slate-300">1.0.0</span>
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">SQLite local · Modo offline</p>
      </div>
    </aside>
  );
}
