import { useEffect, useState } from "react";
import { ClipboardList, Search, Trash2, MessageCircle, DollarSign, CheckCircle2, PackageCheck, Filter, Pencil } from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ESTADOS_PERIFERICO } from "../lib/constantes";
import { useNavStore } from "../store/useNavStore";
import PatternMatrix from "../components/ui/PatternMatrix";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tarjetaBuscada, setTarjetaBuscada] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const ordenDestacada = useNavStore((s) => s.ordenDestacada);
  const setOrdenDestacada = useNavStore((s) => s.setOrdenDestacada);

  const cargar = async () => {
    const data = await window.electron360API.ordenes.listar({ estado: filtroEstado || undefined, fechaDesde: fechaDesde || undefined, fechaHasta: fechaHasta || undefined });
    setOrdenes(data);
  };

  useEffect(() => { cargar(); }, [filtroEstado, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (ordenDestacada) {
      abrirDetalle(ordenDestacada);
      setOrdenDestacada(null);
    }
  }, [ordenDestacada]);

  const buscarOrden = async () => {
    if (!busqueda.trim()) return setTarjetaBuscada(null);
    const d = await window.electron360API.ordenes.buscar(busqueda.trim());
    setTarjetaBuscada(d);
  };

  const abrirDetalle = async (numeroOrden) => {
    const d = await window.electron360API.ordenes.buscar(numeroOrden);
    setDetalle(d);
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setTarjetaBuscada(null);
    cargar();
  };

  const eliminar = async () => {
    await window.electron360API.ordenes.eliminar(aEliminar.id_orden);
    setAEliminar(null);
    cargar();
  };

  return (
    <div className="space-y-4">
      {/* Buscador con tarjeta externa */}
      <div className="panel p-4 space-y-3">
        <div className="flex gap-2">
          <input className="input-field" placeholder="Buscar por número de orden (ej: #00012)" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscarOrden()} />
          <button onClick={buscarOrden} className="btn-primary shrink-0 flex items-center gap-2"><Search size={16} /> Buscar</button>
        </div>

        {tarjetaBuscada && (
          <button onClick={() => abrirDetalle(tarjetaBuscada.orden.numero_orden)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-electric-500/10 border border-electric-500/30 text-left hover:shadow-neon-blue-sm transition-all">
            <div>
              <p className="text-white font-medium">{tarjetaBuscada.cliente.nombres}</p>
              <p className="text-slate-400 text-xs">{tarjetaBuscada.equipo.tipo_equipo} {tarjetaBuscada.equipo.marca} {tarjetaBuscada.equipo.modelo}</p>
            </div>
            <StatusBadge estado={tarjetaBuscada.orden.estado} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <Filter size={15} className="text-slate-500" />
        <select className="input-field !py-1.5 w-auto text-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Equipo Recibido">Equipo Recibido</option>
          <option value="En Espera de Aprobacion">En Espera de Aprobación</option>
          <option value="Aprobado">Aprobado</option>
          <option value="En Reparacion">En Reparación</option>
          <option value="Reparado">Reparado</option>
          <option value="Listo para Entrega">Listo para Entrega</option>
          <option value="Entregado">Entregado</option>
          <option value="Equipo No Reparado">Equipo No Reparado</option>
        </select>
        <input type="date" className="input-field !py-1.5 w-auto text-sm" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        <span className="text-slate-600 text-xs">hasta</span>
        <input type="date" className="input-field !py-1.5 w-auto text-sm" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
      </div>

      {/* Lista dinámica */}
      <div className="space-y-2">
        {ordenes.map((o) => (
          <div
            key={o.id_orden}
            onClick={() => abrirDetalle(o.numero_orden)}
            className="group flex items-center justify-between px-4 py-3 rounded-xl bg-panel-gradient border border-white/5 hover:border-electric-500/30 cursor-pointer transition-all"
          >
            <span className="text-neon-blue font-mono text-sm w-20">{o.numero_orden}</span>
            <span className="text-slate-200 text-sm flex-1">{o.cliente_nombre}</span>
            <span className="text-slate-400 text-sm flex-1">{o.tipo_equipo} {o.marca} {o.modelo}</span>
            <StatusBadge estado={o.estado} />
            <span className="text-slate-500 text-xs w-24 text-right">{new Date(o.fecha_creacion).toLocaleDateString()}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setAEliminar(o); }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-neon-red transition-all ml-3"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {ordenes.length === 0 && (
          <div className="panel px-4 py-10 text-center text-slate-600">
            <ClipboardList className="mx-auto mb-2 opacity-40" size={28} />
            No hay órdenes que coincidan con el filtro.
          </div>
        )}
      </div>

      <Modal open={!!detalle} onClose={cerrarDetalle} title={detalle ? `Orden ${detalle.orden.numero_orden}` : ""} width="max-w-xl">
        {detalle && <DetalleOrden detalle={detalle} onActualizado={abrirDetalle} onClose={cerrarDetalle} />}
      </Modal>

      <ConfirmDialog
        open={!!aEliminar}
        title="Eliminar Orden"
        message={aEliminar ? `¿Eliminar definitivamente la orden ${aEliminar.numero_orden}? Esta acción no se puede deshacer.` : ""}
        labelSi="Eliminar"
        onSi={eliminar}
        onNo={() => setAEliminar(null)}
      />
    </div>
  );
}

function ClonNuevaOrdenDetalle({ detalle }) {
  const { orden, cliente, equipo, perifericos } = detalle;

  const listaAccesorios = [];
  if (equipo.accesorio_funda) listaAccesorios.push("Funda");
  if (equipo.accesorio_simcard) listaAccesorios.push("SIM Card");
  if (equipo.accesorio_cable_usb) listaAccesorios.push("Cable USB");
  if (equipo.accesorio_cargador) listaAccesorios.push("Cargador");
  if (equipo.accesorio_memoria_externa) listaAccesorios.push("Memoria Externa");
  const accesoriosTexto = listaAccesorios.length > 0 ? listaAccesorios.join(", ") : "Ninguno";

  return (
    <div className="space-y-4 border border-white/5 bg-base-900/40 p-4 rounded-xl text-slate-300 max-h-[50vh] overflow-y-auto">
      <p className="text-white font-semibold border-b border-white/5 pb-1">Datos Completos del Equipo Registrado</p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500 font-medium">Tipo de Equipo</p>
          <p className="text-slate-200">{equipo.tipo_equipo}</p>
        </div>
        <div>
          <p className="text-slate-500 font-medium">Marca / Modelo</p>
          <p className="text-slate-200">{equipo.marca || "—"} {equipo.modelo || "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 font-medium">Color</p>
          <p className="text-slate-200">{equipo.color || "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 font-medium">Estado Encendido</p>
          <p className={equipo.encendido ? "text-neon-green font-semibold" : "text-neon-red font-semibold"}>
            {equipo.encendido ? "Encendido" : "Apagado"}
          </p>
        </div>

        {equipo.imei && (
          <div>
            <p className="text-slate-500 font-medium">IMEI / Serial</p>
            <p className="text-slate-200">{equipo.imei}</p>
          </div>
        )}
        {equipo.serial && (
          <div>
            <p className="text-slate-500 font-medium">Serial</p>
            <p className="text-slate-200">{equipo.serial}</p>
          </div>
        )}
        {equipo.ram && (
          <div>
            <p className="text-slate-500 font-medium">RAM</p>
            <p className="text-slate-200">{equipo.ram}</p>
          </div>
        )}
        {equipo.almacenamiento && (
          <div>
            <p className="text-slate-500 font-medium">Almacenamiento / Disco</p>
            <p className="text-slate-200">{equipo.almacenamiento}</p>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-slate-500 font-medium">Accesorios Entregados</p>
          <p className="text-slate-200">{accesoriosTexto}</p>
        </div>

        {equipo.pin_desbloqueo && (
          <div>
            <p className="text-slate-500 font-medium">PIN de Desbloqueo</p>
            <p className="text-neon-blue font-semibold">{equipo.pin_desbloqueo}</p>
          </div>
        )}
        {equipo.patron_desbloqueo && (
          <div>
            <p className="text-slate-500 font-medium">Patrón de Desbloqueo (Secuencia)</p>
            <p className="text-neon-blue font-semibold">{equipo.patron_desbloqueo}</p>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-2 text-xs">
        <p className="text-slate-500 font-medium">Falla Reportada</p>
        <p className="text-slate-200 italic">"{orden.falla_reportada || "Sin falla reportada"}"</p>
      </div>

      {equipo.detalle_extra && (
        <div className="border-t border-white/5 pt-2 text-xs">
          <p className="text-slate-500 font-medium">Detalle Extra / Observaciones</p>
          <p className="text-slate-200">{equipo.detalle_extra}</p>
        </div>
      )}

      {/* Checklist de periféricos */}
      {perifericos && perifericos.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <p className="text-white font-medium text-xs mb-1.5">Estado de Periféricos</p>
          <div className="grid grid-cols-2 gap-1.5">
            {perifericos.map((p) => (
              <div key={p.periferico} className="flex items-center justify-between bg-base-950/40 px-2.5 py-1.5 rounded border border-white/5 text-[11px]">
                <span className="text-slate-400">{p.periferico}</span>
                <span className={`font-semibold ${
                  p.estado === "Funciona" ? "text-neon-green" :
                  p.estado === "No Funciona" ? "text-neon-red" : "text-slate-500"
                }`}>
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patrón de desbloqueo dibujado */}
      {equipo.patron_desbloqueo && (
        <div className="border-t border-white/5 pt-2 flex flex-col items-center">
          <p className="text-white font-semibold text-xs mb-1.5 self-start">Patrón de Desbloqueo Registrado</p>
          <div className="scale-90 origin-top">
            <PatternMatrix value={equipo.patron_desbloqueo.split("-").map(Number)} disabled={true} />
          </div>
        </div>
      )}

      {/* Imágenes en miniatura con protocolo file:// */}
      {equipo.imagenes && equipo.imagenes.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <p className="text-white font-medium text-xs mb-1">Imágenes Adjuntas</p>
          <div className="grid grid-cols-4 gap-1.5">
            {equipo.imagenes.map((src, i) => (
              <img key={i} src={src.startsWith("file://") ? src : `file://${src}`} alt="" className="w-full h-12 object-cover rounded border border-white/5" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleOrden({ detalle, onActualizado, onClose }) {
  const { orden, cliente, equipo, perifericos, diagnostico, pagos } = detalle;
  const totalOrden = (diagnostico?.costo_repuesto || 0) + (diagnostico?.costo_mano_obra || 0) + (diagnostico?.cargo_diagnostico || 0);
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldo = totalOrden - totalPagado;

  const setView = useNavStore((s) => s.setView);
  const setOrdenParaEditar = useNavStore((s) => s.setOrdenParaEditar);

  const [mostrarFormDiagnostico, setMostrarFormDiagnostico] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div>
          <p className="text-white font-medium">{cliente.nombres}</p>
          <p className="text-slate-500 text-xs">{equipo.tipo_equipo} {equipo.marca} {equipo.modelo} · {cliente.telefono}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge estado={orden.estado} />
          <button
            onClick={() => {
              setOrdenParaEditar(detalle);
              setView("nueva-orden");
              onClose();
            }}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Pencil size={13} /> Editar Orden
          </button>
        </div>
      </div>

      {/* Clon de Nueva Orden con todos los detalles registrados */}
      <ClonNuevaOrdenDetalle detalle={detalle} />

      {/* Botones de Función: Avanzar al Siguiente Estado */}
      <div className="pt-2 border-t border-white/5">
        <div className="w-full">
          {orden.estado === "Equipo Recibido" && (
            mostrarFormDiagnostico ? (
              <FormDiagnostico idOrden={orden.id_orden} onListo={() => { onActualizado(orden.numero_orden); setMostrarFormDiagnostico(false); }} />
            ) : (
              <button
                onClick={() => setMostrarFormDiagnostico(true)}
                className="btn-primary w-full text-sm py-2.5"
              >
                Avanzar a Diagnosticado
              </button>
            )
          )}

          {orden.estado === "En Espera de Aprobacion" && (
            <FormPago
              idOrden={orden.id_orden}
              totalOrden={totalOrden}
              saldo={saldo}
              modo="aprobar"
              onListo={() => onActualizado(orden.numero_orden)}
            />
          )}

          {orden.estado === "Aprobado" && (
            <BotonSimple etiqueta="Avanzar a En Reparación" idOrden={orden.id_orden} siguienteEstado="En Reparacion" onListo={() => onActualizado(orden.numero_orden)} />
          )}

          {orden.estado === "En Reparacion" && (
            <FormReparado idOrden={orden.id_orden} perifericos={perifericos} onListo={() => onActualizado(orden.numero_orden)} />
          )}

          {orden.estado === "Reparado" && (
            <BotonSimple etiqueta="Avanzar a Listo para Entrega" idOrden={orden.id_orden} siguienteEstado="Listo para Entrega" onListo={() => onActualizado(orden.numero_orden)} />
          )}

          {orden.estado === "Listo para Entrega" && (
            <BotonEntrega idOrden={orden.id_orden} esReingreso={orden.es_reingreso} saldo={saldo} onListo={() => onActualizado(orden.numero_orden)} />
          )}
        </div>
      </div>

      {(diagnostico || pagos.length > 0) && (
        <div className="border-t border-white/5 pt-3 space-y-1 text-sm">
          {diagnostico && (
            <p className="text-slate-400">
              Repuesto: ${diagnostico.costo_repuesto.toFixed(2)} · Mano de obra: ${diagnostico.costo_mano_obra.toFixed(2)} · Diagnóstico: ${diagnostico.cargo_diagnostico.toFixed(2)}
            </p>
          )}
          <p className="text-slate-300 font-medium">
            Total: ${totalOrden.toFixed(2)} · Pagado: ${totalPagado.toFixed(2)} ·{" "}
            <span className={saldo <= 0 ? "text-neon-green" : "text-neon-red"}>Saldo: ${saldo.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function copiarMensaje(texto, setCopiado) {
  navigator.clipboard?.writeText(texto);
  setCopiado(true);
  setTimeout(() => setCopiado(false), 2000);
}

function FormDiagnostico({ idOrden, onListo }) {
  const [tieneReparacion, setTieneReparacion] = useState(true);
  const [fallaEncontrada, setFallaEncontrada] = useState("");
  const [tipoProcedimiento, setTipoProcedimiento] = useState("");
  const [costoRepuesto, setCostoRepuesto] = useState("");
  const [costoManoObra, setCostoManoObra] = useState("");
  const [diasGarantia, setDiasGarantia] = useState(30);
  const [mensaje, setMensaje] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const generar = async () => {
    const res = await window.electron360API.ordenes.registrarDiagnostico({
      idOrden, fallaEncontrada, tieneReparacion,
      tipoProcedimiento, costoRepuesto: parseFloat(costoRepuesto) || 0,
      costoManoObra: parseFloat(costoManoObra) || 0, diasGarantia: parseInt(diasGarantia) || 30,
    });
    setMensaje(res.mensaje);
    setEnviado(true);
  };

  return (
    <div className="panel p-4 space-y-3 border-electric-500/20">
      <p className="text-white text-sm font-medium">Registrar Diagnóstico</p>
      <div>
        <label className="label-field">Falla Encontrada</label>
        <input className="input-field" value={fallaEncontrada} onChange={(e) => setFallaEncontrada(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setTieneReparacion(true)} className={`flex-1 text-xs py-1.5 rounded-lg border ${tieneReparacion ? "border-neon-green/40 text-neon-green bg-neon-green/10" : "border-white/10 text-slate-500"}`}>Tiene Reparación</button>
        <button onClick={() => setTieneReparacion(false)} className={`flex-1 text-xs py-1.5 rounded-lg border ${!tieneReparacion ? "border-neon-red/40 text-neon-red bg-neon-red/10" : "border-white/10 text-slate-500"}`}>No Reparable</button>
      </div>

      {tieneReparacion && (
        <div className="space-y-3">
          <div>
            <label className="label-field">Tipo de Procedimiento</label>
            <input className="input-field" value={tipoProcedimiento} onChange={(e) => setTipoProcedimiento(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label-field">Repuesto</label><input className="input-field" value={costoRepuesto} onChange={(e) => setCostoRepuesto(e.target.value)} /></div>
            <div><label className="label-field">Mano de Obra</label><input className="input-field" value={costoManoObra} onChange={(e) => setCostoManoObra(e.target.value)} /></div>
            <div><label className="label-field">Días Garantía</label><input className="input-field" value={diasGarantia} onChange={(e) => setDiasGarantia(e.target.value)} /></div>
          </div>
        </div>
      )}

      {!enviado ? (
        <button onClick={generar} className="btn-primary w-full text-sm">Confirmar Diagnóstico</button>
      ) : (
        <div className="bg-base-900/60 border border-white/10 rounded-xl p-3 space-y-3">
          <div className="flex items-start gap-2">
            <MessageCircle size={15} className="text-neon-green shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">{mensaje}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => copiarMensaje(mensaje, setCopiado)} className="btn-ghost text-xs w-full text-center">
              {copiado ? "Mensaje copiado ✓" : "Copiar mensaje para WhatsApp/SMS"}
            </button>
            <button onClick={onListo} className="btn-primary w-full text-xs py-2">
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormPago({ idOrden, saldo, onListo }) {
  const [monto, setMonto] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);

  const registrar = async (tipo) => {
    const valor = tipo === "Pago Total" ? saldo : parseFloat(monto) || 0;
    if (valor <= 0) return;
    const res = await window.electron360API.pagos.registrarYAvanzar({ idOrden, monto: valor, tipo });
    setConfirmacion(res.mensaje);
  };

  if (confirmacion) {
    return (
      <div className="panel p-4 border-neon-green/30 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-neon-green" />
        <p className="text-sm text-slate-200">{confirmacion}</p>
        <button onClick={onListo} className="btn-primary text-xs ml-auto">Aceptar</button>
      </div>
    );
  }

  return (
    <div className="panel p-4 space-y-3 border-neon-amber/20">
      <p className="text-white text-sm font-medium flex items-center gap-2"><DollarSign size={15} className="text-neon-amber" /> Registrar Pago para Aprobar</p>
      <p className="text-xs text-slate-500">Saldo total: ${saldo.toFixed(2)}</p>
      <div className="flex gap-2">
        <input className="input-field" placeholder="Monto del abono" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <button onClick={() => registrar("Abono")} className="btn-secondary shrink-0 text-sm">Abonar</button>
      </div>
      <button onClick={() => registrar("Pago Total")} className="btn-primary w-full text-sm">Pagar Total (${saldo.toFixed(2)})</button>
    </div>
  );
}

function BotonSimple({ etiqueta, idOrden, siguienteEstado, onListo }) {
  const avanzar = async () => {
    await window.electron360API.ordenes.avanzarSimple({ idOrden, siguienteEstado });
    onListo();
  };
  return <button onClick={avanzar} className="btn-primary w-full text-sm">{etiqueta}</button>;
}

function FormReparado({ idOrden, perifericos, onListo }) {
  const [estado, setEstado] = useState(Object.fromEntries(perifericos.map((p) => [p.periferico, p.estado])));

  const confirmar = async () => {
    await window.electron360API.ordenes.marcarReparado({ idOrden, perifericos: Object.entries(estado).map(([nombre, e]) => ({ nombre, estado: e })) });
    onListo();
  };

  return (
    <div className="panel p-4 space-y-3 border-neon-green/20">
      <p className="text-white text-sm font-medium flex items-center gap-2"><CheckCircle2 size={15} className="text-neon-green" /> Re-verificación de Periféricos</p>
      <div className="grid grid-cols-2 gap-2">
        {perifericos.map((p) => (
          <div key={p.periferico} className="flex items-center justify-between px-3 py-2 rounded-lg bg-base-900/50 border border-white/5">
            <span className="text-xs text-slate-300">{p.periferico}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={estado[p.periferico] === "Funciona"}
                onChange={(e) => setEstado({ ...estado, [p.periferico]: e.target.checked ? "Funciona" : "No Funciona" })}
                className="accent-electric-500 rounded h-4 w-4 cursor-pointer"
              />
              <span className={`text-xs font-semibold ${
                estado[p.periferico] === "Funciona" ? "text-neon-green" : "text-neon-red"
              }`}>
                {estado[p.periferico]}
              </span>
            </label>
          </div>
        ))}
      </div>
      <button onClick={confirmar} className="btn-primary w-full text-sm">Guardar y Avanzar a Reparado</button>
    </div>
  );
}

function BotonEntrega({ idOrden, esReingreso, saldo, onListo }) {
  const [error, setError] = useState(null);
  const [montoCompletar, setMontoCompletar] = useState("");
  const setPdfViewerUrl = useNavStore((s) => s.setPdfViewerUrl);

  const intentarEntregar = async () => {
    const res = await window.electron360API.ordenes.entregar(idOrden);
    if (!res.ok) { setError(res.error); return; }
    if (res.rutaFactura?.dataUrl) {
      setPdfViewerUrl(res.rutaFactura.dataUrl);
    }
    onListo();
  };

  const completarYEntregar = async () => {
    const valor = parseFloat(montoCompletar) || saldo;
    await window.electron360API.pagos.registrar({ idOrden, monto: valor, tipo: "Pago Total" });
    setError(null);
    await intentarEntregar();
  };

  return (
    <div className="space-y-2">
      <button onClick={intentarEntregar} className="btn-primary w-full flex items-center justify-center gap-2">
        <PackageCheck size={16} /> Entregar Equipo y Generar Factura
      </button>
      {!esReingreso && saldo > 0 && (
        <p className="text-xs text-neon-amber">Saldo pendiente: ${saldo.toFixed(2)}</p>
      )}
      {error && (
        <div className="panel p-3 border-neon-red/30 space-y-2">
          <p className="text-xs text-neon-red">{error}</p>
          <div className="flex gap-2">
            <input className="input-field" placeholder={`Completar saldo ($${saldo.toFixed(2)})`} value={montoCompletar} onChange={(e) => setMontoCompletar(e.target.value)} />
            <button onClick={completarYEntregar} className="btn-secondary shrink-0 text-sm">Registrar y Entregar</button>
          </div>
        </div>
      )}
    </div>
  );
}
