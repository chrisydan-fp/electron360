const MAPA_ESTADOS = {
  "Equipo Recibido": "badge-blue",
  "En Espera de Aprobacion": "badge-amber",
  "Aprobado": "badge-blue",
  "En Reparacion": "badge-violet",
  "Reparado": "badge-green",
  "Listo para Entrega": "badge-green",
  "Entregado": "badge-green",
  "Equipo No Reparado": "badge-red",
};

const ETIQUETAS = {
  "En Espera de Aprobacion": "En Espera de Aprobación",
  "En Reparacion": "En Reparación",
};

export default function StatusBadge({ estado }) {
  const clase = MAPA_ESTADOS[estado] || "badge-blue";
  return <span className={clase}>{ETIQUETAS[estado] || estado}</span>;
}
