const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

const dbPath = path.join(app.getPath("userData"), "electron360.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id_cliente      TEXT PRIMARY KEY,
    nombres         TEXT NOT NULL,
    telefono        TEXT,
    correo          TEXT,
    red_social_tipo TEXT,
    red_social_usuario TEXT,
    fecha_registro  TEXT DEFAULT (datetime('now')),
    fecha_actualizacion TEXT DEFAULT (datetime('now'))
  );

  -- Catálogos dinámicos: marca/modelo/color se van alimentando cuando el técnico
  -- agrega uno nuevo vía "Otros" en Nueva Orden.
  CREATE TABLE IF NOT EXISTS catalogo_marcas (
    id_marca    INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_equipo TEXT NOT NULL,
    marca       TEXT NOT NULL,
    UNIQUE(tipo_equipo, marca)
  );

  CREATE TABLE IF NOT EXISTS catalogo_modelos (
    id_modelo INTEGER PRIMARY KEY AUTOINCREMENT,
    marca     TEXT NOT NULL,
    modelo    TEXT NOT NULL,
    UNIQUE(marca, modelo)
  );

  CREATE TABLE IF NOT EXISTS catalogo_colores (
    id_color INTEGER PRIMARY KEY AUTOINCREMENT,
    color    TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS equipos (
    id_equipo         INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente        TEXT NOT NULL REFERENCES clientes(id_cliente),
    tipo_equipo       TEXT NOT NULL,      -- Telefono | Tablet | Laptop | PC Escritorio | Otro
    marca             TEXT,
    modelo            TEXT,
    color             TEXT,
    imei              TEXT,
    serial            TEXT,
    ram               TEXT,
    almacenamiento    TEXT,
    encendido         INTEGER DEFAULT 1,  -- 0 = apagado -> perifericos No Verificado, oculta IMEI/RAM/almacenamiento
    accesorio_funda           INTEGER DEFAULT 0,
    accesorio_simcard         INTEGER DEFAULT 0,
    accesorio_cable_usb       INTEGER DEFAULT 0,
    accesorio_cargador        INTEGER DEFAULT 0,
    accesorio_memoria_externa INTEGER DEFAULT 0,
    patron_desbloqueo TEXT,               -- secuencia matriz 3x3, ej "1-2-6"
    pin_desbloqueo    TEXT,
    detalle_extra     TEXT,
    imagenes          TEXT                -- JSON array de rutas locales
  );

  CREATE TABLE IF NOT EXISTS perifericos_estado (
    id_estado    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_equipo    INTEGER NOT NULL REFERENCES equipos(id_equipo),
    periferico   TEXT NOT NULL,
    estado       TEXT NOT NULL      -- Funciona | No Funciona | No Verificado
  );

  CREATE TABLE IF NOT EXISTS ordenes (
    id_orden        INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden    TEXT UNIQUE NOT NULL,
    id_cliente      TEXT NOT NULL REFERENCES clientes(id_cliente),
    id_equipo       INTEGER NOT NULL REFERENCES equipos(id_equipo),
    falla_reportada TEXT,
    -- Ciclo: Equipo Recibido -> En Espera de Aprobacion -> Aprobado -> En Reparacion
    --        -> Reparado -> Listo para Entrega -> Entregado
    -- Ramal: Equipo Recibido -> Equipo No Reparado
    estado          TEXT DEFAULT 'Equipo Recibido',
    es_reingreso    INTEGER DEFAULT 0,   -- true si viene de un reingreso por garantía (salta validación de pago)
    fecha_creacion  TEXT DEFAULT (datetime('now')),
    fecha_entrega   TEXT
  );

  CREATE TABLE IF NOT EXISTS diagnosticos (
    id_diagnostico    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden          INTEGER NOT NULL REFERENCES ordenes(id_orden),
    falla_encontrada  TEXT,
    tiene_reparacion  INTEGER DEFAULT 1,
    tipo_procedimiento TEXT,
    costo_repuesto    REAL DEFAULT 0,
    costo_mano_obra   REAL DEFAULT 0,
    cargo_diagnostico REAL DEFAULT 0,
    dias_garantia     INTEGER DEFAULT 30,
    fecha             TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pagos (
    id_pago    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden   INTEGER NOT NULL REFERENCES ordenes(id_orden),
    monto      REAL NOT NULL,
    tipo       TEXT DEFAULT 'Abono',  -- Abono | Pago Total
    fecha      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS garantias (
    id_garantia    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden       INTEGER NOT NULL REFERENCES ordenes(id_orden),
    dias_garantia  INTEGER NOT NULL,
    fecha_inicio   TEXT NOT NULL,
    fecha_fin      TEXT NOT NULL,
    ciclo          INTEGER DEFAULT 1     -- se incrementa en cada reingreso por garantía
  );

  CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes(numero_orden);
  CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
  CREATE INDEX IF NOT EXISTS idx_clientes_id ON clientes(id_cliente);
`);

// Migraciones/Actualizaciones para bases de datos existentes
try {
  db.exec("ALTER TABLE clientes ADD COLUMN fecha_registro TEXT");
  db.exec("UPDATE clientes SET fecha_registro = datetime('now') WHERE fecha_registro IS NULL");
} catch (e) {
  // Ya existe el campo o error al agregar
}

try {
  db.exec("ALTER TABLE clientes ADD COLUMN fecha_actualizacion TEXT");
  db.exec("UPDATE clientes SET fecha_actualizacion = datetime('now') WHERE fecha_actualizacion IS NULL");
} catch (e) {
  // Ya existe el campo o error al agregar
}

try {
  db.exec("ALTER TABLE ordenes ADD COLUMN es_reingreso INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN falla_encontrada TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN tiene_reparacion INTEGER DEFAULT 1");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN tipo_procedimiento TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN costo_repuesto REAL DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN costo_mano_obra REAL DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN cargo_diagnostico REAL DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN dias_garantia INTEGER DEFAULT 30");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE diagnosticos ADD COLUMN fecha TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE garantias ADD COLUMN ciclo INTEGER DEFAULT 1");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE clientes ADD COLUMN red_social_tipo TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE clientes ADD COLUMN red_social_usuario TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN serial TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN imei TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN ram TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN almacenamiento TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN encendido INTEGER DEFAULT 1");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN accesorio_funda INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN accesorio_simcard INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN accesorio_cable_usb INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN accesorio_cargador INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN accesorio_memoria_externa INTEGER DEFAULT 0");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN patron_desbloqueo TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN pin_desbloqueo TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN detalle_extra TEXT");
} catch (e) {
  // Ya existe el campo
}

try {
  db.exec("ALTER TABLE equipos ADD COLUMN imagenes TEXT");
} catch (e) {
  // Ya existe el campo
}

// Migrar tabla periféricos_estado si es que la BD ya existía y tenía la tabla con nombre no-ASCII
try {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='periféricos_estado'").get();
  if (tableCheck) {
    db.exec(`
      INSERT OR IGNORE INTO perifericos_estado (id_estado, id_equipo, periferico, estado)
      SELECT id_estado, id_equipo, periferico, estado FROM periféricos_estado;
    `);
    db.exec("DROP TABLE IF EXISTS periféricos_estado;");
  }
} catch (e) {
  // Ignorar errores si no se puede migrar automáticamente
}

const defaults = {
  tema: "oscuro",
  moneda: "USD",
  dias_garantia_default: "30",
  cargo_diagnostico: "5",
  taller_nombre: "Electron360 Taller Técnico",
  taller_telefono: "",
  taller_direccion: "",
  taller_correo: "",
  taller_logo: "",
  taller_redes: "[]", // JSON [{tipo:'Instagram', usuario:'@mitaller'}]
};
const insertDefault = db.prepare("INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)");
for (const [clave, valor] of Object.entries(defaults)) insertDefault.run(clave, valor);

// Catálogos base precargados de fábrica
const marcasBase = {
  Telefono: ["Samsung", "Apple", "Xiaomi", "Motorola", "Huawei"],
  Tablet: ["Samsung", "Apple", "Lenovo", "Huawei"],
  Laptop: ["HP", "Dell", "Lenovo", "Asus", "Apple", "Acer"],
  "PC Escritorio": ["HP", "Dell", "Lenovo", "Ensamblado"],
};
const insertMarca = db.prepare("INSERT OR IGNORE INTO catalogo_marcas (tipo_equipo, marca) VALUES (?, ?)");
for (const [tipo, marcas] of Object.entries(marcasBase)) {
  for (const marca of marcas) insertMarca.run(tipo, marca);
}

const coloresBase = ["Negro", "Blanco", "Gris", "Plata", "Azul", "Rojo", "Dorado", "Verde"];
const insertColor = db.prepare("INSERT OR IGNORE INTO catalogo_colores (color) VALUES (?)");
for (const c of coloresBase) insertColor.run(c);

// Modelos base precargados de fábrica
const modelosBase = {
  Samsung: ["Galaxy S24", "Galaxy S23", "Galaxy A54", "Galaxy Tab S9", "Galaxy Tab A9"],
  Apple: ["iPhone 15 Pro", "iPhone 15", "iPhone 14", "iPhone 13", "iPad Pro", "iPad Air", "MacBook Pro", "MacBook Air"],
  Xiaomi: ["Redmi Note 13", "Redmi Note 12", "Xiaomi 14", "Poco F6"],
  Motorola: ["Moto G84", "Edge 40", "Moto G54"],
  Huawei: ["P60 Pro", "Mate 60", "MatePad 11"],
  Lenovo: ["ThinkPad L14", "IdeaPad Slim 3", "Tab M10"],
  HP: ["Pavilion 15", "ProBook 450", "EliteBook 840"],
  Dell: ["Inspiron 15", "Latitude 5440", "XPS 13"],
  Asus: ["ZenBook 14", "ROG Strix", "VivoBook 15"],
  Acer: ["Aspire 5", "Nitro 5", "Swift Go"],
  Ensamblado: ["Intel Core i5", "Intel Core i7", "AMD Ryzen 5", "AMD Ryzen 7"],
};
const insertModelo = db.prepare("INSERT OR IGNORE INTO catalogo_modelos (marca, modelo) VALUES (?, ?)");
for (const [marca, modelos] of Object.entries(modelosBase)) {
  for (const modelo of modelos) insertModelo.run(marca, modelo);
}

module.exports = db;
