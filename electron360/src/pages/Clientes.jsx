import { useEffect, useState } from "react";
import { Search, UserPlus, Pencil, Save, Users, RotateCw } from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import { useNavStore } from "../store/useNavStore";

const CLIENTE_VACIO = { id_cliente: "", nombres: "", telefono: "", correo: "", red_social_tipo: "", red_social_usuario: "" };
const REDES = ["Instagram", "Facebook", "WhatsApp", "TikTok", "X"];

export default function Clientes() {
  const [idBusqueda, setIdBusqueda] = useState("");
  const [cliente, setCliente] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [dialogNoEncontrado, setDialogNoEncontrado] = useState(false);

  // Dynamic editing states
  const [habilitadoParaEditar, setHabilitadoParaEditar] = useState(false);
  const [form, setForm] = useState(CLIENTE_VACIO);
  const [haCambiado, setHaCambiado] = useState(false);

  const [dialogGuardado, setDialogGuardado] = useState(null); // 'nuevo' | 'edicion' | null
  const [recientes, setRecientes] = useState([]);
  const [ordenDetalle, setOrdenDetalle] = useState(null);

  const setView = useNavStore((s) => s.setView);
  const setClienteParaOrden = useNavStore((s) => s.setClienteParaOrden);
  const clienteIDParaRegistro = useNavStore((s) => s.clienteIDParaRegistro);
  const setClienteIDParaRegistro = useNavStore((s) => s.setClienteIDParaRegistro);

  const cargarRecientes = () => window.electron360API.clientes.listarRecientes().then(setRecientes);

  useEffect(() => {
    cargarRecientes();
  }, []);

  useEffect(() => {
    if (clienteIDParaRegistro) {
      setIdBusqueda(clienteIDParaRegistro);
      setForm({ ...CLIENTE_VACIO, id_cliente: clienteIDParaRegistro });
      setNoEncontrado(true);
      setClienteIDParaRegistro(null);
    }
  }, [clienteIDParaRegistro]);

  const buscar = async () => {
    if (!idBusqueda.trim()) return;
    const resultado = await window.electron360API.clientes.buscarPorId(idBusqueda.trim());
    if (resultado) {
      setCliente(resultado);
      setForm(resultado);
      setHabilitadoParaEditar(false);
      setHaCambiado(false);
      setNoEncontrado(false);
    } else {
      setCliente(null);
      setDialogNoEncontrado(true);
    }
  };

  const confirmarRegistroNuevo = (si) => {
    setDialogNoEncontrado(false);
    if (si) {
      setForm({ ...CLIENTE_VACIO, id_cliente: idBusqueda.trim() });
      setNoEncontrado(true);
    }
  };

  const guardarNuevo = async () => {
    if (!form.id_cliente.trim() || !form.nombres.trim()) {
      alert("Por favor, rellene el ID del cliente y su nombre.");
      return;
    }
    await window.electron360API.clientes.crear(form);
    setNoEncontrado(false);
    setCliente({ ...form, ordenes: [] });
    setDialogGuardado("nuevo");
    cargarRecientes();
  };

  const guardarEdicion = async () => {
    await window.electron360API.clientes.actualizar(form);
    setCliente({ ...cliente, ...form });
    setHabilitadoParaEditar(false);
    setHaCambiado(false);
    setDialogGuardado("edicion");
    cargarRecientes();
  };

  const responderCrearOrden = (si) => {
    const clienteAsignado = { ...form };
    setDialogGuardado(null);
    if (si) {
      setClienteParaOrden(clienteAsignado);
      setView("nueva-orden");
    }
  };

  const clickBotonDinamico = () => {
    if (!habilitadoParaEditar) {
      // Iniciar edición
      setForm(cliente);
      setHabilitadoParaEditar(true);
      setHaCambiado(false);
    } else {
      // Si ya está habilitado y ha cambiado, guardar
      if (haCambiado) {
        guardarEdicion();
      }
    }
  };

  const manejarCambioForm = (campo, valor) => {
    const nuevoForm = { ...form, [campo]: valor };
    setForm(nuevoForm);

    // Verificar si ha cambiado respecto al cliente original
    const cambio = Object.keys(CLIENTE_VACIO).some(key => nuevoForm[key] !== (cliente[key] || ""));
    setHaCambiado(cambio);
  };

  const abrirClienteReciente = async (idc) => {
    const resultado = await window.electron360API.clientes.buscarPorId(idc);
    setCliente(resultado);
    setForm(resultado);
    setIdBusqueda(idc);
    setNoEncontrado(false);
    setHabilitadoParaEditar(false);
    setHaCambiado(false);
  };

  const abrirOrden = async (numeroOrden) => {
    const detalle = await window.electron360API.ordenes.buscar(numeroOrden);
    setOrdenDetalle(detalle);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Buscador */}
      <div className="panel p-5">
        <p className="label-field">Buscar Cliente por Número de Identificación</p>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="Ej: CED-00123"
            value={idBusqueda}
            onChange={(e) => setIdBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
          />
          <button onClick={buscar} className="btn-primary flex items-center gap-2 shrink-0">
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>

      {/* Caso 1: Cliente registrado — tarjeta dinámica no editable por defecto */}
      {cliente && !noEncontrado && (
        <div className="panel p-5 space-y-4">
          <div className="flex items-start justify-between border-b border-white/5 pb-3">
            <div>
              <p className="text-white font-semibold text-lg">{cliente.nombres}</p>
              <p className="text-slate-500 text-sm">ID: {cliente.id_cliente}</p>
            </div>
            <button
              onClick={clickBotonDinamico}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-150 ${
                habilitadoParaEditar
                  ? (haCambiado
                      ? "bg-neon-green/10 border border-neon-green/40 text-neon-green shadow-neon-green"
                      : "bg-base-800 border border-white/10 text-slate-400 cursor-not-allowed")
                  : "btn-secondary"
              }`}
              disabled={habilitadoParaEditar && !haCambiado}
            >
              <Pencil size={14} />
              {habilitadoParaEditar ? (haCambiado ? "Actualizar y Guardar" : "Editar Información") : "Editar Información"}
            </button>
          </div>

          {/* Formulario integrado en la tarjeta para edición in-place */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombres y Apellidos</label>
              <input
                className="input-field disabled:opacity-70 disabled:bg-base-950/20"
                value={form.nombres || ""}
                onChange={(e) => manejarCambioForm("nombres", e.target.value)}
                disabled={!habilitadoParaEditar}
              />
            </div>
            <div>
              <label className="label-field">Teléfono de Contacto</label>
              <input
                className="input-field disabled:opacity-70 disabled:bg-base-950/20"
                value={form.telefono || ""}
                onChange={(e) => manejarCambioForm("telefono", e.target.value)}
                disabled={!habilitadoParaEditar}
              />
            </div>
            <div>
              <label className="label-field">Correo Electrónico</label>
              <input
                className="input-field disabled:opacity-70 disabled:bg-base-950/20"
                value={form.correo || ""}
                onChange={(e) => manejarCambioForm("correo", e.target.value)}
                disabled={!habilitadoParaEditar}
              />
            </div>
            <div>
              <label className="label-field">Red Social (opcional)</label>
              <select
                className="input-field disabled:opacity-70 disabled:bg-base-950/20"
                value={form.red_social_tipo || ""}
                onChange={(e) => manejarCambioForm("red_social_tipo", e.target.value)}
                disabled={!habilitadoParaEditar}
              >
                <option value="">Seleccionar...</option>
                {REDES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label-field">Usuario / Contacto</label>
              <input
                className="input-field disabled:opacity-70 disabled:bg-base-950/20"
                value={form.red_social_usuario || ""}
                onChange={(e) => manejarCambioForm("red_social_usuario", e.target.value)}
                disabled={!habilitadoParaEditar}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <p className="text-slate-400 text-sm font-medium mb-2">Equipos / Órdenes Asociadas</p>
            <div className="space-y-2">
              {(cliente.ordenes || []).length === 0 && (
                <p className="text-slate-600 text-sm">Sin órdenes registradas todavía.</p>
              )}
              {(cliente.ordenes || []).map((o) => (
                <button
                  key={o.id_orden}
                  onClick={() => abrirOrden(o.numero_orden)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-base-900/50 border border-white/5 hover:border-electric-500/30 transition-colors text-left"
                >
                  <span className="text-neon-blue font-mono text-sm">{o.numero_orden}</span>
                  <span className="text-slate-300 text-sm">{o.tipo_equipo} {o.marca} {o.modelo}</span>
                  <StatusBadge estado={o.estado} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setClienteParaOrden(cliente);
              setView("nueva-orden");
            }}
            className="btn-primary text-sm w-full"
          >
            Crear Nueva Orden para este Cliente
          </button>
        </div>
      )}

      {/* Caso 2: Registro express tras confirmar "sí" en el diálogo */}
      {noEncontrado && (
        <div className="panel p-5 space-y-4 border-neon-amber/30">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-neon-amber" />
            <p className="text-white font-semibold">Registro de Nuevo Cliente</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Número ID</label>
              <input className="input-field" value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Nombres y Apellidos</label>
              <input className="input-field" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Teléfono de Contacto</label>
              <input className="input-field" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Correo Electrónico (opcional)</label>
              <input className="input-field" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Red Social (opcional)</label>
              <select className="input-field" value={form.red_social_tipo} onChange={(e) => setForm({ ...form, red_social_tipo: e.target.value })}>
                <option value="">Seleccionar...</option>
                {REDES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Usuario / Contacto</label>
              <input className="input-field" value={form.red_social_usuario} onChange={(e) => setForm({ ...form, red_social_usuario: e.target.value })} />
            </div>
          </div>

          <button onClick={guardarNuevo} className="btn-primary flex items-center gap-2 text-sm">
            <Save size={15} /> Guardar Datos
          </button>
        </div>
      )}

      {/* Lista dinámica de clientes recientes */}
      {!cliente && !noEncontrado && (
        <div className="panel p-5">
          <p className="text-white font-semibold flex items-center gap-2 mb-3">
            <Users size={16} className="text-neon-blue" /> Clientes Recientes o Actualizados
          </p>
          <div className="space-y-2">
            {recientes.map((c) => (
              <button
                key={c.id_cliente}
                onClick={() => abrirClienteReciente(c.id_cliente)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-base-900/50 border border-white/5 hover:border-electric-500/30 transition-colors text-left"
              >
                <span className="text-slate-200 text-sm">{c.nombres}</span>
                <span className="text-neon-blue font-mono text-xs">{c.id_cliente}</span>
              </button>
            ))}
            {recientes.length === 0 && <p className="text-slate-600 text-sm">Aún no hay clientes registrados.</p>}
          </div>
        </div>
      )}

      {/* Diálogo: cliente no encontrado */}
      <ConfirmDialog
        open={dialogNoEncontrado}
        title="Cliente no encontrado"
        message="¿Desea hacer un nuevo registro?"
        onSi={() => confirmarRegistroNuevo(true)}
        onNo={() => confirmarRegistroNuevo(false)}
      />

      {/* Diálogo: datos guardados, ¿crear nueva orden? */}
      <ConfirmDialog
        open={!!dialogGuardado}
        title={dialogGuardado === "nuevo" ? "sus datos fueron guardados con exito" : "Sus datos fueron guardados de forma correcta"}
        message="¿Desea crear una nueva orden?"
        onSi={() => responderCrearOrden(true)}
        onNo={() => responderCrearOrden(false)}
      />

      {/* Ventanilla de detalle de orden (incluye reingreso por garantía) */}
      <Modal open={!!ordenDetalle} onClose={() => setOrdenDetalle(null)} title={ordenDetalle ? `Orden ${ordenDetalle.orden.numero_orden}` : ""}>
        {ordenDetalle && <DetalleOrdenVentanilla detalle={ordenDetalle} onClose={() => setOrdenDetalle(null)} />}
      </Modal>
    </div>
  );
}

function DetalleOrdenVentanilla({ detalle, onClose }) {
  const { orden, equipo, perifericos, diagnostico, pagos, garantia } = detalle;
  const setView = useNavStore((s) => s.setView);
  const setOrdenDestacada = useNavStore((s) => s.setOrdenDestacada);
  const vigente = garantia ? new Date(garantia.fecha_fin) >= new Date() : false;

  const handleReingreso = async () => {
    await window.electron360API.garantias.reingreso(orden.id_orden);
    setOrdenDestacada(orden.numero_orden);
    setView("ordenes");
    onClose();
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-slate-400">Estado</p>
        <StatusBadge estado={orden.estado} />
      </div>
      <div>
        <p className="text-slate-500">Equipo</p>
        <p className="text-slate-200">{equipo.tipo_equipo} {equipo.marca} {equipo.modelo} — {equipo.color}</p>
      </div>
      <div>
        <p className="text-slate-500">Falla Reportada</p>
        <p className="text-slate-200">{orden.falla_reportada || "—"}</p>
      </div>
      {diagnostico && (
        <div className="border-t border-white/5 pt-2">
          <p className="text-white font-medium mb-1">Procedimientos y Costos</p>
          <p className="text-slate-300">Procedimiento: {diagnostico.tipo_procedimiento || "—"}</p>
          <p className="text-slate-300">Repuestos: ${diagnostico.costo_repuesto?.toFixed(2) || "0.00"}</p>
          <p className="text-slate-300">Mano de Obra: ${diagnostico.costo_mano_obra?.toFixed(2) || "0.00"}</p>
          <p className="text-slate-300">Cargo Revisión: ${diagnostico.cargo_diagnostico?.toFixed(2) || "0.00"}</p>
        </div>
      )}
      <div>
        <p className="text-slate-500 mb-1">Estado de Periféricos</p>
        <div className="grid grid-cols-2 gap-1">
          {perifericos.map((p) => (
            <p key={p.periferico} className="text-slate-300 text-xs">{p.periferico}: {p.estado}</p>
          ))}
        </div>
      </div>
      {pagos.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <p className="text-slate-500 mb-1">Historial de Pagos</p>
          {pagos.map((p) => (
            <p key={p.id_pago} className="text-slate-300 text-xs">{p.tipo}: ${p.monto.toFixed(2)} — {new Date(p.fecha).toLocaleDateString()}</p>
          ))}
        </div>
      )}
      {garantia && (
        <div className="panel p-3 border-neon-green/20 space-y-2">
          <p className={vigente ? "text-neon-green text-xs font-semibold" : "text-neon-red text-xs font-semibold"}>
            Garantía {vigente ? "Vigente" : "Vencida"} hasta {new Date(garantia.fecha_fin).toLocaleDateString()}
          </p>
          {vigente && (
            <button
              onClick={handleReingreso}
              className="btn-primary text-xs py-1.5 w-full flex items-center justify-center gap-2"
            >
              <RotateCw size={12} /> Reingreso por Garantía
            </button>
          )}
        </div>
      )}
    </div>
  );
}
