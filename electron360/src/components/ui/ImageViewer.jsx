import { useState, useRef } from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";

export default function ImageViewer({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const arrastrando = useRef(false);
  const origen = useRef({ x: 0, y: 0 });

  if (!src) return null;

  const iniciarArrastre = (e) => {
    arrastrando.current = true;
    origen.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const moverArrastre = (e) => {
    if (!arrastrando.current) return;
    setPos({ x: e.clientX - origen.current.x, y: e.clientY - origen.current.y });
  };
  const detenerArrastre = () => (arrastrando.current = false);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} className="btn-secondary p-2">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="btn-secondary p-2">
          <ZoomOut size={16} />
        </button>
        <button onClick={onClose} className="btn-secondary p-2 hover:text-neon-red">
          <X size={16} />
        </button>
      </div>

      <img
        src={src}
        alt=""
        draggable={false}
        onMouseDown={iniciarArrastre}
        onMouseMove={moverArrastre}
        onMouseUp={detenerArrastre}
        onMouseLeave={detenerArrastre}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
          cursor: arrastrando.current ? "grabbing" : "grab",
        }}
        className="relative z-0 max-h-[85vh] max-w-[85vw] select-none transition-transform duration-75 rounded-lg shadow-neon-blue-sm"
      />
    </div>
  );
}
