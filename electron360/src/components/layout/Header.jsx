import { Search, Bell } from "lucide-react";

const TITLES = {
  dashboard: "Dashboard Principal",
  clientes: "Módulo Clientes",
  "nueva-orden": "Nueva Orden de Servicio",
  ordenes: "Órdenes de Servicio",
  garantias: "Garantías",
  reportes: "Reportes e Ingresos",
  configuracion: "Configuración",
};

export default function Header({ currentView }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-base-950/60 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight">
          {TITLES[currentView] ?? "Electron360"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por ID, orden o cliente..."
            className="input-field !py-2 pl-9 w-72 text-sm"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-base-800 border border-white/10 text-slate-400 hover:text-neon-blue hover:border-electric-500/40 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neon-red shadow-neon-red" />
        </button>
      </div>
    </header>
  );
}
