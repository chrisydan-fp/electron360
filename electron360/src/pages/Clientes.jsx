import { useEffect, useState } from "react";
import { Search, UserPlus, Pencil, Save, Users } from "lucide-react";
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
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(CLIENTE_VACIO);
  const [dialogGuardado, setDialogGuardado] = useState(null); // 'nuevo' | 'edicion' | null
  const [recientes, setRecientes] = useState([]);
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const setView = useNavStore((s) => s.setView);
  const setClienteParaOrden = useNavStore((s) => s.setClienteParaOrden);

  const cargarRecientes = () => window.electron360API.clientes.listarRecientes().then(setRecientes);

  useEffect(() => {
    cargarRecientes();
  }, []);

  const buscar = async () => {
    if (!idBusqueda.trim()) return;
    const resultado = await window.electron360API.clientes.buscarPorId(idBusqueda.trim());
    if (resultado) {
      setCliente(resultado);
      setNoEncontrado(false);
      setEditando(false);
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
    await window.electron360API.clientes.crear(form);
    setNoEncontrado(false);
    setCliente({ ...form, ordenes: [] });
    setDialogGuardado("nuevo");
    cargarRecientes();
  };

  const guardarEdicion = async () => {
    await window.electron360API.clientes.actualizar(form);
    setCliente({ ...cliente, ...form });
    setEditando(false);
    setDialogGuardado("edicion");
    cargarRecientes();
  };

  const responderCrearOrden = (si) => {
    setDialogGuardado(null);
    if (si) {
      setClienteParaOrden(form);
      setView("nueva-orden");
    }
  };

  const iniciarEdicion = () => {
    setForm(cliente);
    setEditando(true);
  };

  const abrirClienteReciente = async (idc) => {
    const resultado = await window.electron360API.clientes.buscarPorId(idc);
    setCliente(resultado);
    setIdBusqueda(idc);
    setNoEncontrado(false);
    setEditando(false);
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

      {/* Caso 1: Cliente registrado — tarjeta no editable */}
      {cliente && !editando && (
        <div className="panel p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-semibold text-lg">{cliente.nombres}</p>
              <p className="text-slate-500 text-sm">ID: {cliente.id_cliente}</p>
            </div>
            <button onClick={iniciarEdicion} className="btn-secondary flex items-center gap-2 text-sm">
              <Pencil size={14} /> Editar Información
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-500">Teléfono</p><p className="text-slate-200">{cliente.telefono || "—"}</p></div>
            <div><p className="text-slate-500">Correo</p><p className="text-slate-200">{cliente.correo || "—"}</p></div>
            <div className="col-span-2">
              <p className="text-slate-500">Redes Sociales</p>
              <p className="text-slate-200">
                {cliente.red_social_tipo ? `${cliente.red_social_tipo}: ${cliente.red_social_usuario || "—"}` : "—"}
              </p>
            </div>
          </div>

          <div>
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
            className="btn-primary text-sm"
          >
            Crear Nueva Orden para este Cliente
          </button>
        </div>
      )}

      {/* Formulario de edición */}
      {editando && (
        <div className="panel p-5 space-y-4">
          <p className="text-white font-semibold">Actualizar Información</p>
          <FormularioCliente form={form} setForm={setForm} bloquearId />
          <button onClick={guardarEdicion} className="btn-primary flex items-center gap-2 text-sm">
            <Save size={15} /> Actualizar y Guardar
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
          <FormularioCliente form={form} setForm={setForm} bloquearId />
          <button onClick={guardarNuevo} className="btn-primary flex items-center gap-2 text-sm">
            <Save size={15} /> Guardar Datos
          </button>
        </div>
      )}

      {/* Lista dinámica de clientes recientes */}
      {!cliente && !noEncontrado && (
        <div className="panel p-5">
          <p className="text-white font-semibold flex items-center gap-2 mb-3">
            <Users size={16} className="text-neon-blue" /> Clientes Recientes
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
        title={dialogGuardado === "nuevo" ? "Sus datos fueron guardados con éxito" : "Sus datos fueron guardados de forma correcta"}
        message="¿Desea crear una nueva orden?"
        onSi={() => responderCrearOrden(true)}
        onNo={() => responderCrearOrden(false)}
      />

      {/* Ventanilla de detalle de orden (incluye reingreso por garantía) */}
      <Modal open={!!ordenDetalle} onClose={() => setOrdenDetalle(null)} title={ordenDetalle ? `Orden ${ordenDetalle.orden.numero_orden}` : ""}>
        {ordenDetalle && <DetalleOrdenVentanilla detalle={ordenDetalle} />}
      </Modal>
    </div>
  );
}

function DetalleOrdenVentanilla({ detalle }) {
  const { orden, equipo, perifericos, diagnostico, pagos, garantia } = detalle;
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
        <div>
          <p className="text-slate-500">Diagnóstico</p>
          <p className="text-slate-200">{diagnostico.falla_encontrada || "—"}</p>
        </div>
      )}
      <div>
        <p className="text-slate-500 mb-1">Periféricos</p>
        <div className="grid grid-cols-2 gap-1">
          {perifericos.map((p) => (
            <p key={p.periferico} className="text-slate-300 text-xs">{p.periferico}: {p.estado}</p>
          ))}
        </div>
      </div>
      {pagos.length > 0 && (
        <div>
          <p className="text-slate-500 mb-1">Pagos</p>
          {pagos.map((p) => (
            <p key={p.id_pago} className="text-slate-300 text-xs">{p.tipo}: ${p.monto.toFixed(2)}</p>
          ))}
        </div>
      )}
      {garantia && (
        <p className="text-neon-green text-xs">
          Garantía vigente hasta {new Date(garantia.fecha_fin).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function FormularioCliente({ form, setForm, bloquearId }) {
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label-field">Número ID</label>
        <input className="input-field" value={form.id_cliente} onChange={set("id_cliente")} disabled={bloquearId} />
      </div>
      <div>
        <label className="label-field">Nombres y Apellidos</label>
        <input className="input-field" value={form.nombres} onChange={set("nombres")} />
      </div>
      <div>
        <label className="label-field">Teléfono de Contacto</label>
        <input className="input-field" value={form.telefono} onChange={set("telefono")} />
      </div>
      <div>
        <label className="label-field">Correo Electrónico (opcional)</label>
        <input className="input-field" value={form.correo} onChange={set("correo")} />
      </div>
      <div>
        <label className="label-field">Red Social (opcional)</label>
        <select className="input-field" value={form.red_social_tipo} onChange={set("red_social_tipo")}>
          <option value="">Seleccionar...</option>
          {REDES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="label-field">Usuario / Contacto</label>
        <input className="input-field" value={form.red_social_usuario} onChange={set("red_social_usuario")} />
      </div>
    </div>
  );
}
