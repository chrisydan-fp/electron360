import { useEffect, useState } from "react";
import { Wrench, Settings2, PackageCheck, DollarSign } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import { useNavStore } from "../store/useNavStore";

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [reportes, setReportes] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const setView = useNavStore((s) => s.setView);
  const setOrdenDestacada = useNavStore((s) => s.setOrdenDestacada);

  useEffect(() => {
    window.electron360API.dashboard.resumen().then(setResumen);
    window.electron360API.reportes.resumen().then(setReportes);
    window.electron360API.ordenes.listar({}).then((data) => setRecientes(data.slice(0, 5)));
  }, []);

  const abrirOrden = (numeroOrden) => {
    setOrdenDestacada(numeroOrden);
    setView("ordenes");
  };

  if (!resumen || !reportes) return <p className="text-slate-500 text-sm">Cargando dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wrench} label="Equipos Recibidos" value={resumen.recibidos} accent="blue" />
        <StatCard icon={Settings2} label="En Reparación" value={resumen.enReparacion} accent="violet" />
        <StatCard icon={PackageCheck} label="Listos p/ Entrega" value={resumen.listosEntrega} accent="green" />
        <StatCard icon={DollarSign} label="Ingresos del Mes" value={`$${reportes.ingresos.toFixed(2)}`} accent="amber" />
      </div>

      <div className="panel p-5">
        <h2 className="text-white font-semibold mb-4">Actividad Reciente</h2>
        <div className="space-y-2">
          {recientes.map((o) => (
            <button
              key={o.id_orden}
              onClick={() => abrirOrden(o.numero_orden)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-base-900/50 border border-white/5 hover:border-electric-500/30 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-neon-blue font-mono text-sm">{o.numero_orden}</span>
                <span className="text-slate-200 text-sm">{o.cliente_nombre}</span>
              </div>
              <StatusBadge estado={o.estado} />
            </button>
          ))}
          {recientes.length === 0 && <p className="text-slate-600 text-sm">Aún no hay órdenes registradas.</p>}
        </div>
      </div>
    </div>
  );
}
