import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, RotateCw } from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { useNavStore } from "../store/useNavStore";

export default function Garantias() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const setView = useNavStore((s) => s.setView);
  const setOrdenDestacada = useNavStore((s) => s.setOrdenDestacada);

  const buscar = async () => {
    if (!query.trim()) return;
    const res = await window.electron360API.garantias.buscar(query.trim());
    setResultados(res);
    setBuscado(true);
  };

  const reingresar = async (idOrden, numeroOrden) => {
    await window.electron360API.garantias.reingreso(idOrden);
    setOrdenDestacada(numeroOrden);
    setView("ordenes");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="panel p-5">
        <p className="label-field">Buscar por Número de Orden o ID de Cliente</p>
        <div className="flex gap-2">
          <input className="input-field" placeholder="Ej: #00012 o CED-00123" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscar()} />
          <button onClick={buscar} className="btn-primary flex items-center gap-2 shrink-0"><Search size={16} /> Buscar</button>
        </div>
      </div>

      {buscado && resultados.length === 0 && (
        <div className="panel p-5 text-slate-400 text-sm">No se encontraron órdenes para esa búsqueda.</div>
      )}

      {resultados.map(({ orden, cliente, equipo, garantia, vigente }) => {
        const diasRestantes = garantia ? Math.ceil((new Date(garantia.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        return (
          <div key={orden.id_orden} className={`panel p-5 space-y-3 ${garantia ? (vigente ? "border-neon-green/30" : "border-neon-red/30") : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{orden.numero_orden} — {cliente.nombres}</p>
                <p className="text-slate-500 text-xs">{equipo.tipo_equipo} {equipo.marca} {equipo.modelo}</p>
              </div>
              <StatusBadge estado={orden.estado} />
            </div>

            {!garantia ? (
              <p className="text-slate-500 text-sm">Esta orden aún no tiene garantía registrada (no ha sido entregada).</p>
            ) : (
              <div className="flex items-center gap-3">
                {vigente ? <ShieldCheck className="text-neon-green" size={20} /> : <ShieldAlert className="text-neon-red" size={20} />}
                <div>
                  <p className="text-sm text-slate-200">{vigente ? "Garantía Vigente" : "Garantía Vencida"}</p>
                  <p className="text-slate-500 text-xs">
                    Vence el {new Date(garantia.fecha_fin).toLocaleDateString()}
                    {vigente && ` · ${diasRestantes} día(s) restante(s)`}
                  </p>
                </div>
              </div>
            )}

            {garantia && vigente && (
              <button onClick={() => reingresar(orden.id_orden, orden.numero_orden)} className="btn-primary flex items-center gap-2 text-sm">
                <RotateCw size={15} /> Reingreso por Garantía (salta a "En Reparación")
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
