import { useEffect, useState } from "react";
import { TrendingUp, Wallet, PackageCheck } from "lucide-react";
import StatCard from "../components/ui/StatCard";

export default function Reportes() {
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    window.electron360API.reportes.resumen().then(setResumen);
  }, []);

  if (!resumen) return <p className="text-slate-500 text-sm">Cargando métricas...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Ingresos Brutos (mes)" value={`$${resumen.ingresos.toFixed(2)}`} accent="blue" />
        <StatCard icon={TrendingUp} label="Ganancia Neta (mes)" value={`$${resumen.gananciaNeta.toFixed(2)}`} accent="green" />
        <StatCard icon={PackageCheck} label="Entregadas (mes)" value={resumen.entregadasMes} accent="violet" />
      </div>

      <div className="panel p-5">
        <p className="text-slate-400 text-sm">
          La ganancia neta descuenta el costo de repuestos de los ingresos brutos recibidos
          (abonos y pagos) durante el mes en curso.
        </p>
      </div>
    </div>
  );
}
