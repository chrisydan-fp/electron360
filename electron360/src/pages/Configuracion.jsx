import { useEffect, useState } from "react";
import { Save, Trash2, ImagePlus, DatabaseBackup, Sun, Moon, ShieldAlert } from "lucide-react";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const REDES = ["Instagram", "Facebook", "WhatsApp", "TikTok", "X"];

export default function Configuracion() {
  const [config, setConfig] = useState(null);
  const [guardado, setGuardado] = useState(false);
  const [purgadas, setPurgadas] = useState(null);
  const [confirmarReset, setConfirmarReset] = useState(false);
  const [redesTaller, setRedesTaller] = useState([]);

  useEffect(() => {
    window.electron360API.configuracion.obtener().then((c) => {
      setConfig(c);
      try { setRedesTaller(JSON.parse(c.taller_redes || "[]")); } catch { setRedesTaller([]); }
    });
  }, []);

  const guardar = async () => {
    await window.electron360API.configuracion.guardar({ ...config, taller_redes: JSON.stringify(redesTaller) });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const subirLogo = async () => {
    const ruta = await window.electron360API.configuracion.subirLogo();
    if (ruta) setConfig({ ...config, taller_logo: ruta });
  };

  const cambiarTema = (tema) => {
    setConfig({ ...config, tema });
    document.documentElement.classList.toggle("light", tema === "claro");
    window.electron360API.configuracion.guardar({ tema });
  };

  const agregarRed = () => setRedesTaller([...redesTaller, { tipo: "Instagram", usuario: "" }]);
  const actualizarRed = (i, campo, valor) => {
    const copia = [...redesTaller];
    copia[i] = { ...copia[i], [campo]: valor };
    setRedesTaller(copia);
  };
  const quitarRed = (i) => setRedesTaller(redesTaller.filter((_, idx) => idx !== i));

  const backup = async () => {
    const res = await window.electron360API.configuracion.backupDB();
    if (res.ok) alert(`Respaldo guardado en: ${res.ruta}`);
  };

  const resetear = async () => {
    await window.electron360API.configuracion.resetearDB();
    setConfirmarReset(false);
    window.location.reload();
  };

  const purgar = async () => {
    const res = await window.electron360API.configuracion.purgarOrdenesVencidas();
    setPurgadas(res.eliminadas);
  };

  if (!config) return <p className="text-slate-500 text-sm">Cargando configuración...</p>;

  return (
    <div className="max-w-xl space-y-6">
      {/* Apariencia */}
      <div className="panel p-5 space-y-3">
        <p className="text-white font-semibold">Apariencia</p>
        <div className="flex gap-2">
          <button onClick={() => cambiarTema("oscuro")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm border ${config.tema === "oscuro" ? "border-electric-500/50 text-neon-blue bg-electric-500/10" : "border-white/10 text-slate-500"}`}>
            <Moon size={15} /> Modo Oscuro
          </button>
          <button onClick={() => cambiarTema("claro")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm border ${config.tema === "claro" ? "border-electric-500/50 text-neon-blue bg-electric-500/10" : "border-white/10 text-slate-500"}`}>
            <Sun size={15} /> Modo Claro
          </button>
        </div>
      </div>

      {/* Datos del taller */}
      <div className="panel p-5 space-y-4">
        <p className="text-white font-semibold">Datos del Taller</p>

        <div className="flex items-center gap-3">
          {config.taller_logo && <img src={`file://${config.taller_logo}`} alt="logo" className="w-12 h-12 rounded-lg object-cover border border-white/10" />}
          <button onClick={subirLogo} className="btn-secondary flex items-center gap-2 text-sm"><ImagePlus size={14} /> Subir Logotipo</button>
        </div>

        <div>
          <label className="label-field">Nombre del Taller</label>
          <input className="input-field" value={config.taller_nombre} onChange={(e) => setConfig({ ...config, taller_nombre: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label-field">Teléfono</label><input className="input-field" value={config.taller_telefono} onChange={(e) => setConfig({ ...config, taller_telefono: e.target.value })} /></div>
          <div><label className="label-field">Correo Electrónico</label><input className="input-field" value={config.taller_correo} onChange={(e) => setConfig({ ...config, taller_correo: e.target.value })} /></div>
        </div>
        <div>
          <label className="label-field">Dirección</label>
          <input className="input-field" value={config.taller_direccion} onChange={(e) => setConfig({ ...config, taller_direccion: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="label-field">Redes Sociales (aparecerán en la factura)</label>
          {redesTaller.map((r, i) => (
            <div key={i} className="flex gap-2">
              <select className="input-field w-32" value={r.tipo} onChange={(e) => actualizarRed(i, "tipo", e.target.value)}>
                {REDES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <input className="input-field" placeholder="@usuario" value={r.usuario} onChange={(e) => actualizarRed(i, "usuario", e.target.value)} />
              <button onClick={() => quitarRed(i)} className="btn-ghost text-neon-red text-xs shrink-0">Quitar</button>
            </div>
          ))}
          <button onClick={agregarRed} className="btn-ghost text-xs">+ Agregar Red Social</button>
        </div>
      </div>

      {/* Ajustes operativos */}
      <div className="panel p-5 space-y-4">
        <p className="text-white font-semibold">Ajustes Operativos</p>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="label-field">Moneda</label><input className="input-field" value={config.moneda} onChange={(e) => setConfig({ ...config, moneda: e.target.value })} /></div>
          <div><label className="label-field">Días Garantía Default</label><input className="input-field" value={config.dias_garantia_default} onChange={(e) => setConfig({ ...config, dias_garantia_default: e.target.value })} /></div>
          <div><label className="label-field">Cargo por Diagnóstico</label><input className="input-field" value={config.cargo_diagnostico} onChange={(e) => setConfig({ ...config, cargo_diagnostico: e.target.value })} /></div>
        </div>
        <button onClick={guardar} className="btn-primary flex items-center gap-2 text-sm"><Save size={15} /> Guardar Cambios</button>
        {guardado && <p className="text-xs text-neon-green">Configuración guardada.</p>}
      </div>

      {/* Base de datos */}
      <div className="panel p-5 space-y-3">
        <p className="text-white font-semibold">Base de Datos</p>
        <button onClick={backup} className="btn-secondary flex items-center gap-2 text-sm"><DatabaseBackup size={15} /> Respaldar Base de Datos</button>

        <div className="pt-2 border-t border-white/5">
          <p className="text-sm text-slate-400 mb-2">Purga las órdenes <strong>Entregadas</strong> con más de 3 meses de antigüedad. No afecta las estadísticas de reportes.</p>
          <button onClick={purgar} className="btn-secondary flex items-center gap-2 text-sm"><Trash2 size={15} /> Purgar Órdenes Vencidas</button>
          {purgadas !== null && <p className="text-xs text-slate-500 mt-1">{purgadas} orden(es) eliminada(s).</p>}
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="panel p-5 space-y-3 border-neon-red/20">
        <p className="text-white font-semibold flex items-center gap-2"><ShieldAlert size={15} className="text-neon-red" /> Zona de Peligro</p>
        <p className="text-sm text-slate-400">Resetea por completo la base de datos: clientes, equipos, órdenes, pagos y garantías. Esta acción no se puede deshacer.</p>
        <button onClick={() => setConfirmarReset(true)} className="btn-secondary flex items-center gap-2 text-sm hover:border-neon-red/50 hover:text-neon-red">
          <Trash2 size={15} /> Resetear Base de Datos
        </button>
      </div>

      <ConfirmDialog
        open={confirmarReset}
        title="¿Resetear toda la base de datos?"
        message="Se eliminarán todos los clientes, equipos, órdenes, pagos y garantías de forma permanente."
        labelSi="Sí, resetear todo"
        onSi={resetear}
        onNo={() => setConfirmarReset(false)}
      />
    </div>
  );
}
