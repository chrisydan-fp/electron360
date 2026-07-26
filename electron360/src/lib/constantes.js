export const PERIFERICOS_POR_TIPO = {
  Telefono: [
    "Pantalla", "Táctil", "Botón Encendido", "Botón Bajar Volumen", "Botón Subir Volumen",
    "Auricular", "Altavoz", "Micrófono", "Puerto de Carga", "Cámara Frontal",
    "Cámara Principal", "Sensor de Proximidad",
  ],
  Tablet: [
    "Pantalla", "Táctil", "Botón Encendido", "Botón Bajar Volumen", "Botón Subir Volumen",
    "Auricular", "Altavoz", "Micrófono", "Puerto de Carga", "Cámara Frontal",
    "Cámara Principal", "Sensor de Proximidad",
  ],
  Laptop: [
    "Pantalla", "Cámara", "Teclado", "Micrófono", "Touchpad", "Puertos USB",
    "Puerto HDMI/VGA", "Botón de Encendido", "Botón de Reinicio", "Tarjeta de Red", "Jack de Audio",
  ],
  "PC Escritorio": [
    "Puertos USB", "Puerto HDMI/VGA", "Botón de Encendido", "Botón de Reinicio",
    "Tarjeta de Red", "Jack de Audio",
  ],
  Otro: [],
};

export const ACCESORIOS = [
  { clave: "funda", label: "Funda" },
  { clave: "simcard", label: "SIM Card" },
  { clave: "cable_usb", label: "Cable USB" },
  { clave: "cargador", label: "Cargador" },
  { clave: "memoria_externa", label: "Memoria Externa" },
];

export const ESTADOS_PERIFERICO = ["Funciona", "No Funciona", "No Verificado"];

// Orden estricto del ciclo de vida (usado para saber cuál es "el siguiente estado")
export const CICLO_ORDEN = [
  "Equipo Recibido",
  "En Espera de Aprobacion",
  "Aprobado",
  "En Reparacion",
  "Reparado",
  "Listo para Entrega",
  "Entregado",
];

export const ESTADO_LABELS = {
  "Equipo Recibido": "Equipo Recibido",
  "En Espera de Aprobacion": "En Espera de Aprobación",
  "Aprobado": "Aprobado",
  "En Reparacion": "En Reparación",
  "Reparado": "Reparado",
  "Listo para Entrega": "Listo para Entrega",
  "Entregado": "Entregado",
  "Equipo No Reparado": "Equipo No Reparado",
};

export const TIPOS_EQUIPO_CATALOGABLES = ["Telefono", "Tablet", "Laptop", "PC Escritorio"];
