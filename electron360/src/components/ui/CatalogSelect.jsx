import { useState } from "react";

export default function CatalogSelect({ label, opciones, value, onChange, placeholder = "Seleccionar..." }) {
  const [modoManual, setModoManual] = useState(false);

  const manejarCambio = (e) => {
    const val = e.target.value;
    if (val === "__otros__") {
      setModoManual(true);
      onChange("");
    } else {
      onChange(val);
    }
  };

  return (
    <div>
      {label && <label className="label-field">{label}</label>}
      {!modoManual ? (
        <select className="input-field" value={value} onChange={manejarCambio}>
          <option value="">{placeholder}</option>
          {opciones.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
          <option value="__otros__">Otros (agregar nuevo)</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            className="input-field"
            autoFocus
            placeholder="Escribe el nuevo valor..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setModoManual(false)}
            className="btn-ghost text-xs shrink-0"
          >
            Volver a lista
          </button>
        </div>
      )}
    </div>
  );
}
