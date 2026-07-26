import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";

// Genera las coordenadas de los 9 puntos en una grilla 3x3
const PUNTOS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  cx: 40 + (i % 3) * 60,
  cy: 40 + Math.floor(i / 3) * 60,
}));

export default function PatternMatrix({ value = [], onChange, disabled = false }) {
  const [secuencia, setSecuencia] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    setSecuencia((value || []).map(Number));
  }, [value]);

  const emitir = (nueva) => {
    setSecuencia(nueva);
    onChange?.(nueva);
  };

  const agregarPunto = (id) => {
    const numericId = Number(id);
    if (disabled || secuencia.includes(numericId)) return;
    emitir([...secuencia, numericId]);
  };

  const reiniciar = () => {
    if (disabled) return;
    emitir([]);
  };

  const puntoPorId = (id) => PUNTOS.find((p) => Number(p.id) === Number(id));

  return (
    <div className={`panel p-4 flex flex-col items-center gap-3 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <p className="label-field self-start">Patrón de Desbloqueo (Matriz 3x3)</p>

      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        width="200"
        height="200"
        onMouseDown={() => setArrastrando(true)}
        onMouseUp={() => setArrastrando(false)}
        onMouseLeave={() => setArrastrando(false)}
      >
        {/* Líneas conectando la secuencia */}
        {secuencia.slice(1).map((id, idx) => {
          const a = puntoPorId(secuencia[idx]);
          const b = puntoPorId(id);
          return (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke="#00d9ff"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px #00d9ff)" }}
            />
          );
        })}

        {/* Puntos */}
        {PUNTOS.map((p) => {
          const activo = secuencia.includes(p.id);
          return (
            <circle
              key={p.id}
              cx={p.cx}
              cy={p.cy}
              r={activo ? 10 : 8}
              fill={activo ? "#00d9ff" : "#1c2436"}
              stroke={activo ? "#00d9ff" : "#3a4759"}
              strokeWidth="2"
              style={activo ? { filter: "drop-shadow(0 0 6px #00d9ff)" } : {}}
              className="cursor-pointer transition-all duration-150"
              onMouseDown={() => agregarPunto(p.id)}
              onMouseEnter={() => arrastrando && agregarPunto(p.id)}
            />
          );
        })}
      </svg>

      <div className="flex items-center justify-between w-full">
        <p className="text-xs text-slate-500">
          Secuencia:{" "}
          <span className="text-neon-blue font-mono">
            {secuencia.length ? secuencia.join(" → ") : "—"}
          </span>
        </p>
        <button type="button" onClick={reiniciar} className="btn-ghost flex items-center gap-1 text-xs">
          <RotateCcw size={13} /> Reiniciar
        </button>
      </div>
    </div>
  );
}
