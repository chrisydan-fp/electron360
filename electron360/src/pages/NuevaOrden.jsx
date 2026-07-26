import { useEffect, useState } from "react";
import {
  Smartphone, Tablet, Laptop, Monitor, MoreHorizontal, ImagePlus, Zap, Search, UserPlus, X,
} from "lucide-react";
import PatternMatrix from "../components/ui/PatternMatrix";
import CatalogSelect from "../components/ui/CatalogSelect";
import ImageViewer from "../components/ui/ImageViewer";
import AutoCloseToast from "../components/ui/AutoCloseToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { PERIFERICOS_POR_TIPO, ACCESORIOS, ESTADOS_PERIFERICO, TIPOS_EQUIPO_CATALOGABLES } from "../lib/constantes";
import { useNavStore } from "../store/useNavStore";

const TIPOS_EQUIPO = [
  { id: "Telefono", label: "Teléfono", icon: Smartphone },
  { id: "Tablet", label: "Tablet", icon: Tablet },
  { id: "Laptop", label: "Laptop", icon: Laptop },
  { id: "PC Escritorio", label: "PC Escritorio", icon: Monitor },
  { id: "Otro", label: "Otro", icon: MoreHorizontal },
];

function estadoInicialPerifericos(tipo) {
  return Object.fromEntries((PERIFERICOS_POR_TIPO[tipo] || []).map((p) => ["OK_" + p, "Funciona"]).map(([, v], i) => [PERIFERICOS_POR_TIPO[tipo][i], v]));
}

export default function NuevaOrden() {
  const clienteParaOrden = useNavStore((s) => s.clienteParaOrden);
  const setClienteParaOrden = useNavStore((s) => s.setClienteParaOrden);
  const setView = useNavStore((s) => s.setView);
  const setOrdenDestacada = useNavStore((s) => s.setOrdenDestacada);
  const setClienteIDParaRegistro = useNavStore((s) => s.setClienteIDParaRegistro);
  const setPdfViewerUrl = useNavStore((s) => s.setPdfViewerUrl);
  const ordenParaEditar = useNavStore((s) => s.ordenParaEditar);
  const setOrdenParaEditar = useNavStore((s) => s.setOrdenParaEditar);

  const [cliente, setCliente] = useState(clienteParaOrden);
  const [idOrdenEdicion, setIdOrdenEdicion] = useState(null);
  const [modalAsignar, setModalAsignar] = useState(!clienteParaOrden && !ordenParaEditar);
  const [idBusquedaCliente, setIdBusquedaCliente] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);

  const [tipoEquipo, setTipoEquipo] = useState("Telefono");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [marcasCat, setMarcasCat] = useState([]);
  const [modelosCat, setModelosCat] = useState([]);
  const [coloresCat, setColoresCat] = useState([]);

  const [encendido, setEncendido] = useState(true);
  const [imei, setImei] = useState("");
  const [serial, setSerial] = useState("");
  const [ram, setRam] = useState("");
  const [almacenamiento, setAlmacenamiento] = useState("");
  const [accesorios, setAccesorios] = useState({});
  const [falla, setFalla] = useState("");
  const [detalleExtra, setDetalleExtra] = useState("");

  const [metodoDesbloqueo, setMetodoDesbloqueo] = useState("patron");
  const [patron, setPatron] = useState([]);
  const [pin, setPin] = useState("");

  const [imagenes, setImagenes] = useState([]); // dataURLs
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const [perifericos, setPerifericos] = useState(estadoInicialPerifericos("Telefono"));

  const [generando, setGenerando] = useState(false);
  const [toastExito, setToastExito] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (clienteParaOrden) setClienteParaOrden(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ordenParaEditar) {
      const { orden, cliente: c, equipo: eq, perifericos: per } = ordenParaEditar;
      setCliente(c);
      setTipoEquipo(eq.tipo_equipo);
      setMarca(eq.marca || "");
      setModelo(eq.modelo || "");
      setColor(eq.color || "");
      setEncendido(eq.encendido === 1);
      setImei(eq.imei || "");
      setSerial(eq.serial || "");
      setRam(eq.ram || "");
      setAlmacenamiento(eq.almacenamiento || "");
      setAccesorios({
        funda: eq.accesorio_funda === 1,
        simcard: eq.accesorio_simcard === 1,
        cable_usb: eq.accesorio_cable_usb === 1,
        cargador: eq.accesorio_cargador === 1,
        memoria_externa: eq.accesorio_memoria_externa === 1,
      });
      setFalla(orden.falla_reportada || "");
      setDetalleExtra(eq.detalle_extra || "");

      if (eq.patron_desbloqueo) {
        setMetodoDesbloqueo("patron");
        setPatron(eq.patron_desbloqueo.split("-").map(Number));
      } else if (eq.pin_desbloqueo) {
        setMetodoDesbloqueo("pin");
        setPin(eq.pin_desbloqueo);
      }

      if (per) {
        setPerifericos(Object.fromEntries(per.map((p) => [p.periferico, p.estado])));
      }

      setImagenes(eq.imagenes || []);
      setIdOrdenEdicion(orden.id_orden);
      setOrdenParaEditar(null);
    }
  }, [ordenParaEditar]);

  useEffect(() => {
    window.electron360API.catalogos.colores().then(setColoresCat);
  }, []);

  useEffect(() => {
    if (TIPOS_EQUIPO_CATALOGABLES.includes(tipoEquipo)) {
      window.electron360API.catalogos.marcas(tipoEquipo).then(setMarcasCat);
    }
    setPerifericos(estadoInicialPerifericos(tipoEquipo));
    setMarca("");
    setModelo("");
  }, [tipoEquipo]);

  useEffect(() => {
    if (marca) window.electron360API.catalogos.modelos({ tipoEquipo, marca }).then(setModelosCat);
    else setModelosCat([]);
  }, [tipoEquipo, marca]);

  // ---- Asignación de cliente (acceso directo desde sidebar) ----
  const buscarClienteParaAsignar = async () => {
    const res = await window.electron360API.clientes.buscarPorId(idBusquedaCliente.trim());
    if (res) {
      setClienteEncontrado(res);
      setClienteNoEncontrado(false);
    } else {
      setClienteEncontrado(null);
      setClienteNoEncontrado(true);
    }
  };

  const asignarCliente = () => {
    setCliente(clienteEncontrado);
    setModalAsignar(false);
  };

  const irARegistrarCliente = () => {
    setClienteIDParaRegistro(idBusquedaCliente.trim());
    setModalAsignar(false);
    setView("clientes");
  };

  // ---- Encendido / perifericos ----
  const cambiarEncendido = (valor) => {
    setEncendido(valor);
    const nombres = PERIFERICOS_POR_TIPO[tipoEquipo] || [];
    if (!valor) {
      setPerifericos(Object.fromEntries(nombres.map((p) => [p, "No Verificado"])));
    } else {
      setPerifericos(Object.fromEntries(nombres.map((p) => [p, "Funciona"])));
    }
  };

  const cambiarEstadoPeriferico = (nombre, estado) => {
    if (!encendido) return;
    setPerifericos({ ...perifericos, [nombre]: estado });
  };

  const toggleAccesorio = (clave) => setAccesorios({ ...accesorios, [clave]: !accesorios[clave] });

  const manejarImagenes = (e) => {
    const archivos = Array.from(e.target.files || []);
    archivos.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setImagenes((prev) => [...prev, reader.result]);
      reader.readAsDataURL(f);
    });
  };

  const eliminarImagen = (index, e) => {
    e.stopPropagation();
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const requiereDatosEncendido = ["Telefono", "Tablet"].includes(tipoEquipo);

  const generarOrden = async () => {
    if (!cliente) {
      alert("Debes asignar un cliente a esta orden.");
      return;
    }
    setGenerando(true);

    if (idOrdenEdicion) {
      const payload = {
        idOrden: idOrdenEdicion,
        equipo: {
          tipo_equipo: tipoEquipo,
          marca: tipoEquipo === "Otro" ? "" : marca,
          modelo: tipoEquipo === "Otro" ? "" : modelo,
          color: tipoEquipo === "Otro" ? "" : color,
          imei: requiereDatosEncendido && encendido ? imei : null,
          serial: serial || null,
          ram: encendido && ["Telefono", "Tablet", "Laptop", "PC Escritorio"].includes(tipoEquipo) ? ram : null,
          almacenamiento: requiereDatosEncendido && encendido ? almacenamiento : null,
          encendido: encendido ? 1 : 0,
          accesorio_funda: accesorios.funda ? 1 : 0,
          accesorio_simcard: accesorios.simcard ? 1 : 0,
          accesorio_cable_usb: accesorios.cable_usb ? 1 : 0,
          accesorio_cargador: accesorios.cargador ? 1 : 0,
          accesorio_memoria_externa: accesorios.memoria_externa ? 1 : 0,
          patron_desbloqueo: metodoDesbloqueo === "patron" && patron.length ? patron.join("-") : null,
          pin_desbloqueo: metodoDesbloqueo === "pin" && pin ? pin : null,
          detalle_extra: detalleExtra || null,
        },
        perifericos: Object.entries(perifericos).map(([nombre, estado]) => ({ nombre, estado })),
        fallaReportada: falla,
      };
      try {
        await window.electron360API.ordenes.actualizar(payload);
        alert("Orden actualizada con éxito.");
        setView("ordenes");
      } catch (err) {
        console.error(err);
        alert("Ocurrió un error al actualizar la orden.");
      } finally {
        setGenerando(false);
      }
      return;
    }

    if (marca && TIPOS_EQUIPO_CATALOGABLES.includes(tipoEquipo)) {
      await window.electron360API.catalogos.agregarMarca({ tipoEquipo, marca });
    }
    if (marca && modelo) {
      await window.electron360API.catalogos.agregarModelo({ tipoEquipo, marca, modelo });
    }
    if (color) await window.electron360API.catalogos.agregarColor(color);

    const payload = {
      equipo: {
        id_cliente: cliente.id_cliente,
        tipo_equipo: tipoEquipo,
        marca: tipoEquipo === "Otro" ? "" : marca,
        modelo: tipoEquipo === "Otro" ? "" : modelo,
        color: tipoEquipo === "Otro" ? "" : color,
        imei: requiereDatosEncendido && encendido ? imei : null,
        serial: serial || null,
        ram: encendido && ["Telefono", "Tablet", "Laptop", "PC Escritorio"].includes(tipoEquipo) ? ram : null,
        almacenamiento: requiereDatosEncendido && encendido ? almacenamiento : null,
        encendido: encendido ? 1 : 0,
        accesorio_funda: accesorios.funda ? 1 : 0,
        accesorio_simcard: accesorios.simcard ? 1 : 0,
        accesorio_cable_usb: accesorios.cable_usb ? 1 : 0,
        accesorio_cargador: accesorios.cargador ? 1 : 0,
        accesorio_memoria_externa: accesorios.memoria_externa ? 1 : 0,
        patron_desbloqueo: metodoDesbloqueo === "patron" && patron.length ? patron.join("-") : null,
        pin_desbloqueo: metodoDesbloqueo === "pin" && pin ? pin : null,
        detalle_extra: detalleExtra || null,
      },
      perifericos: Object.entries(perifericos).map(([nombre, estado]) => ({ nombre, estado })),
      fallaReportada: falla,
      imagenes,
    };

    try {
      const res = await window.electron360API.ordenes.crear(payload);
      // Evento 1 + 2: timestamp, estado "Equipo Recibido", aviso auto-cerrable
      setToastExito(`Orden generada con éxito bajo el número ${res.orden.numero_orden}`);
      setResultado(res);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al generar la orden.");
    } finally {
      setGenerando(false);
    }
  };

  const cerrarToastYMostrarRecibo = () => {
    setToastExito(null);
    // Evento 3: recibo generado, se muestra en el visor interno
    if (resultado?.rutaRecibo?.dataUrl) {
      setPdfViewerUrl(resultado.rutaRecibo.dataUrl);
    }
    setOrdenDestacada(resultado.orden.numero_orden);
    setView("ordenes");
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Tarjeta de cliente asignado */}
      <div className="panel p-5 flex items-center justify-between">
        {cliente ? (
          <div>
            <p className="text-white font-semibold">{cliente.nombres}</p>
            <p className="text-slate-500 text-sm">ID: {cliente.id_cliente} · {cliente.telefono || "sin teléfono"}</p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Ningún cliente asignado a esta orden todavía.</p>
        )}
        <button onClick={() => setModalAsignar(true)} className="btn-secondary text-sm">
          {cliente ? "Cambiar Cliente" : "Asignar Cliente a esta Orden"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de equipo */}
          <div className="panel p-5 space-y-4">
            <p className="text-white font-semibold">Tipo de Equipo</p>
            <div className="flex flex-wrap gap-2">
              {TIPOS_EQUIPO.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTipoEquipo(id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all
                    ${tipoEquipo === id ? "bg-electric-500/10 border-electric-500/50 text-neon-blue shadow-neon-blue-sm" : "border-white/10 text-slate-400 hover:text-white"}`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {tipoEquipo === "Otro" ? (
              <div>
                <label className="label-field">Descripción del Equipo</label>
                <input className="input-field" value={detalleExtra} onChange={(e) => setDetalleExtra(e.target.value)} placeholder="Ej: Consola, impresora, router..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <CatalogSelect label="Marca" opciones={marcasCat} value={marca} onChange={setMarca} />
                  <CatalogSelect label="Modelo" opciones={modelosCat} value={modelo} onChange={setModelo} />
                  <CatalogSelect label="Color" opciones={coloresCat} value={color} onChange={setColor} />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => cambiarEncendido(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${encendido ? "bg-neon-green/10 border-neon-green/40 text-neon-green" : "border-white/10 text-slate-500"}`}
                  >
                    Equipo Encendido
                  </button>
                  <button
                    onClick={() => cambiarEncendido(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!encendido ? "bg-neon-red/10 border-neon-red/40 text-neon-red" : "border-white/10 text-slate-500"}`}
                  >
                    Equipo Apagado
                  </button>
                  {!encendido && (
                    <span className="text-xs text-neon-amber">
                      Datos técnicos deshabilitados · perifericos en "No Verificado"
                    </span>
                  )}
                </div>

                <div className={`grid grid-cols-3 gap-4 ${!encendido ? "opacity-40 pointer-events-none" : ""}`}>
                  {requiereDatosEncendido && (
                    <div>
                      <label className="label-field">Serial / IMEI</label>
                      <input className="input-field" value={imei} onChange={(e) => setImei(e.target.value)} disabled={!encendido} />
                    </div>
                  )}
                  {(tipoEquipo === "Laptop" || tipoEquipo === "PC Escritorio") && (
                    <div>
                      <label className="label-field">Serial (opcional)</label>
                      <input className="input-field" value={serial} onChange={(e) => setSerial(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="label-field">RAM</label>
                    <input className="input-field" value={ram} onChange={(e) => setRam(e.target.value)} disabled={!encendido} />
                  </div>
                  {requiereDatosEncendido && (
                    <div>
                      <label className="label-field">Almacenamiento Interno</label>
                      <input className="input-field" value={almacenamiento} onChange={(e) => setAlmacenamiento(e.target.value)} disabled={!encendido} />
                    </div>
                  )}
                  {(tipoEquipo === "Laptop" || tipoEquipo === "PC Escritorio") && (
                    <div>
                      <label className="label-field">Disco Duro (opcional)</label>
                      <input className="input-field" value={almacenamiento} onChange={(e) => setAlmacenamiento(e.target.value)} />
                    </div>
                  )}
                </div>

                {requiereDatosEncendido && (
                  <div>
                    <p className="label-field mb-2">Accesorios que Deja</p>
                    <div className="flex flex-wrap gap-3">
                      {ACCESORIOS.map((a) => (
                        <label key={a.clave} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={!!accesorios[a.clave]} onChange={() => toggleAccesorio(a.clave)} className="accent-electric-500" />
                          {a.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="label-field">Falla Reportada por el Cliente</label>
              <textarea className="input-field resize-none" rows={3} value={falla} onChange={(e) => setFalla(e.target.value)} />
            </div>

            {tipoEquipo !== "Otro" && (
              <div>
                <label className="label-field">Detalle Extra (opcional)</label>
                <textarea className="input-field resize-none" rows={2} value={detalleExtra} onChange={(e) => setDetalleExtra(e.target.value)} />
              </div>
            )}
          </div>

          {/* Checklist de perifericos */}
          {tipoEquipo !== "Otro" && PERIFERICOS_POR_TIPO[tipoEquipo]?.length > 0 && (
            <div className="panel p-5 space-y-3">
              <p className="text-white font-semibold">Estado de Periféricos (Checklist Interactivo)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PERIFERICOS_POR_TIPO[tipoEquipo].map((nombre) => (
                  <div key={nombre} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-base-900/50 border border-white/5">
                    <span className="text-sm text-slate-300">{nombre}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!encendido}
                        checked={perifericos[nombre] === "Funciona"}
                        onChange={(e) => cambiarEstadoPeriferico(nombre, e.target.checked ? "Funciona" : "No Funciona")}
                        className="accent-electric-500 rounded h-4 w-4 cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${
                        perifericos[nombre] === "Funciona" ? "text-neon-green" :
                        perifericos[nombre] === "No Funciona" ? "text-neon-red" :
                        "text-slate-400"
                      }`}>
                        {perifericos[nombre]}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imágenes */}
          <div className="panel p-5 space-y-3">
            <p className="text-white font-semibold flex items-center gap-2">
              <ImagePlus size={16} className="text-neon-blue" /> Imágenes del Equipo (opcional)
            </p>
            <input type="file" multiple accept="image/*" onChange={manejarImagenes} className="text-sm text-slate-400" />
            {imagenes.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {imagenes.map((src, i) => {
                  const url = src.startsWith("local-file:") || src.startsWith("data:") ? src : `local-file://${src}`;
                  return (
                    <div key={i} className="relative group w-full h-20">
                      <img src={url} alt="" onClick={() => setImagenAmpliada(url)} className="w-full h-full object-cover rounded-lg border border-white/10 cursor-pointer hover:border-electric-500/50" />
                      <button
                        onClick={(e) => eliminarImagen(i, e)}
                        className="absolute top-1 right-1 bg-neon-red/80 hover:bg-neon-red text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-neon-red"
                        title="Eliminar imagen"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna lateral: desbloqueo + generar */}
        <div className="space-y-4">
          {tipoEquipo !== "Otro" && (
            <div className="panel p-4 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setMetodoDesbloqueo("patron")} className={`flex-1 text-xs py-1.5 rounded-lg border ${metodoDesbloqueo === "patron" ? "border-electric-500/50 text-neon-blue bg-electric-500/10" : "border-white/10 text-slate-500"}`}>Patrón</button>
                <button onClick={() => setMetodoDesbloqueo("pin")} className={`flex-1 text-xs py-1.5 rounded-lg border ${metodoDesbloqueo === "pin" ? "border-electric-500/50 text-neon-blue bg-electric-500/10" : "border-white/10 text-slate-500"}`}>PIN Numérico</button>
              </div>
              {metodoDesbloqueo === "patron" ? (
                <PatternMatrix value={patron} onChange={setPatron} />
              ) : (
                <div>
                  <label className="label-field">PIN (opcional)</label>
                  <input className="input-field" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value)} />
                </div>
              )}
            </div>
          )}

          <button onClick={generarOrden} disabled={generando} className="btn-primary w-full flex items-center justify-center gap-2">
            <Zap size={16} /> {generando ? "Guardando..." : (idOrdenEdicion ? "Actualizar Orden" : "Generar Orden")}
          </button>
        </div>
      </div>

      {/* Modal: asignar cliente (acceso directo desde sidebar) */}
      {modalAsignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => {
            if (cliente) {
              setModalAsignar(false);
            } else {
              setView("dashboard");
            }
          }} />
          <div className="relative w-full max-w-md panel p-5 space-y-4 border-electric-500/20">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Asignar Cliente a esta Orden</p>
              <button
                onClick={() => {
                  if (cliente) {
                    setModalAsignar(false);
                  } else {
                    setView("dashboard");
                  }
                }}
                className="text-slate-500 hover:text-neon-red transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <input className="input-field" placeholder="Número ID del cliente" value={idBusquedaCliente} onChange={(e) => setIdBusquedaCliente(e.target.value)} onKeyDown={(e) => e.key === "Enter" && buscarClienteParaAsignar()} />
              <button onClick={buscarClienteParaAsignar} className="btn-primary shrink-0 flex items-center gap-2"><Search size={15} /> Buscar</button>
            </div>

            {clienteEncontrado && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-base-900/60 border border-white/5">
                <span className="text-sm text-slate-200">{clienteEncontrado.nombres}</span>
                <button onClick={asignarCliente} className="btn-primary text-xs py-1.5">Asignar</button>
              </div>
            )}

            {clienteNoEncontrado && (
              <div className="space-y-2 text-sm">
                <p className="text-neon-red">cliente no encontrado por favor registre primero en el area de clientes</p>
                <button onClick={irARegistrarCliente} className="btn-primary flex items-center gap-2 text-xs w-full justify-center">
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ImageViewer src={imagenAmpliada} onClose={() => setImagenAmpliada(null)} />
      <AutoCloseToast open={!!toastExito} message={toastExito} onClose={cerrarToastYMostrarRecibo} />
    </div>
  );
}
