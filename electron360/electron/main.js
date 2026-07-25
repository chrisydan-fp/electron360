const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;
let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#050608",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  db = require("./db");
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function generarNumeroOrden() {
  const row = db.prepare("SELECT COUNT(*) AS total FROM ordenes").get();
  return `#${String(row.total + 1).padStart(5, "0")}`;
}

function getConfig() {
  const rows = db.prepare("SELECT clave, valor FROM configuracion").all();
  return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
}

function obtenerOrdenCompleta(idOrden) {
  const orden = db.prepare("SELECT * FROM ordenes WHERE id_orden = ?").get(idOrden);
  if (!orden) return null;
  const cliente = db.prepare("SELECT * FROM clientes WHERE id_cliente = ?").get(orden.id_cliente);
  const equipo = db.prepare("SELECT * FROM equipos WHERE id_equipo = ?").get(orden.id_equipo);
  const perifericos = db.prepare("SELECT * FROM perifericos_estado WHERE id_equipo = ?").all(orden.id_equipo);
  const diagnostico = db
    .prepare("SELECT * FROM diagnosticos WHERE id_orden = ? ORDER BY id_diagnostico DESC")
    .get(orden.id_orden);
  const pagos = db.prepare("SELECT * FROM pagos WHERE id_orden = ?").all(orden.id_orden);
  const garantia = db
    .prepare("SELECT * FROM garantias WHERE id_orden = ? ORDER BY ciclo DESC")
    .get(orden.id_orden);
  return { orden, cliente, equipo: { ...equipo, imagenes: JSON.parse(equipo?.imagenes || "[]") }, perifericos, diagnostico, pagos, garantia };
}

function saldoPendiente(idOrden) {
  const diagnostico = db
    .prepare("SELECT * FROM diagnosticos WHERE id_orden = ? ORDER BY id_diagnostico DESC")
    .get(idOrden);
  const pagos = db.prepare("SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE id_orden = ?").get(idOrden).total;
  const totalOrden =
    (diagnostico?.costo_repuesto || 0) + (diagnostico?.costo_mano_obra || 0) + (diagnostico?.cargo_diagnostico || 0);
  return { totalOrden, totalPagado: pagos, saldo: totalOrden - pagos };
}

// ---------------------------------------------------------------------------
function registerIpcHandlers() {
  // ---------- Clientes ----------
  ipcMain.handle("clientes:buscarPorId", (_e, idCliente) => {
    const cliente = db.prepare("SELECT * FROM clientes WHERE id_cliente = ?").get(idCliente);
    if (!cliente) return null;
    const ordenes = db
      .prepare(
        `SELECT o.id_orden, o.numero_orden, o.estado, o.fecha_creacion, e.tipo_equipo, e.marca, e.modelo
         FROM ordenes o JOIN equipos e ON e.id_equipo = o.id_equipo
         WHERE o.id_cliente = ? ORDER BY o.fecha_creacion DESC`
      )
      .all(idCliente);
    return { ...cliente, ordenes };
  });

  ipcMain.handle("clientes:crear", (_e, cliente) => {
    db.prepare(
      `INSERT INTO clientes (id_cliente, nombres, telefono, correo, red_social_tipo, red_social_usuario)
       VALUES (@id_cliente, @nombres, @telefono, @correo, @red_social_tipo, @red_social_usuario)`
    ).run(cliente);
    return { ok: true };
  });

  ipcMain.handle("clientes:actualizar", (_e, cliente) => {
    db.prepare(
      `UPDATE clientes SET nombres=@nombres, telefono=@telefono, correo=@correo,
         red_social_tipo=@red_social_tipo, red_social_usuario=@red_social_usuario,
         fecha_actualizacion=datetime('now')
       WHERE id_cliente=@id_cliente`
    ).run(cliente);
    return { ok: true };
  });

  ipcMain.handle("clientes:listarRecientes", () => {
    return db.prepare("SELECT * FROM clientes ORDER BY fecha_actualizacion DESC LIMIT 15").all();
  });

  // ---------- Catálogos ----------
  ipcMain.handle("catalogos:marcas", (_e, tipoEquipo) =>
    db.prepare("SELECT marca FROM catalogo_marcas WHERE tipo_equipo = ? ORDER BY marca").all(tipoEquipo).map((r) => r.marca)
  );
  ipcMain.handle("catalogos:modelos", (_e, payload) => {
    let tipoEquipo = "";
    let marca = "";
    if (typeof payload === "string") {
      marca = payload;
    } else if (payload) {
      tipoEquipo = payload.tipoEquipo;
      marca = payload.marca;
    }
    if (tipoEquipo) {
      return db.prepare("SELECT modelo FROM catalogo_modelos WHERE tipo_equipo = ? AND marca = ? ORDER BY modelo").all(tipoEquipo, marca).map((r) => r.modelo);
    } else {
      return db.prepare("SELECT modelo FROM catalogo_modelos WHERE marca = ? ORDER BY modelo").all(marca).map((r) => r.modelo);
    }
  });
  ipcMain.handle("catalogos:colores", () =>
    db.prepare("SELECT color FROM catalogo_colores ORDER BY color").all().map((r) => r.color)
  );
  ipcMain.handle("catalogos:agregarMarca", (_e, { tipoEquipo, marca }) => {
    if (marca) db.prepare("INSERT OR IGNORE INTO catalogo_marcas (tipo_equipo, marca) VALUES (?, ?)").run(tipoEquipo, marca);
    return { ok: true };
  });
  ipcMain.handle("catalogos:agregarModelo", (_e, { tipoEquipo, marca, modelo }) => {
    if (modelo) db.prepare("INSERT OR IGNORE INTO catalogo_modelos (tipo_equipo, marca, modelo) VALUES (?, ?, ?)").run(tipoEquipo || null, marca, modelo);
    return { ok: true };
  });
  ipcMain.handle("catalogos:agregarColor", (_e, color) => {
    if (color) db.prepare("INSERT OR IGNORE INTO catalogo_colores (color) VALUES (?)").run(color);
    return { ok: true };
  });

  // ---------- Nueva Orden ----------
  ipcMain.handle("ordenes:crear", async (_e, payload) => {
    const { equipo, perifericos, fallaReportada, imagenes } = payload;

    const carpetaImgs = path.join(app.getPath("userData"), "imagenes");
    if (!fs.existsSync(carpetaImgs)) fs.mkdirSync(carpetaImgs, { recursive: true });
    const rutasGuardadas = (imagenes || []).map((dataUrl, i) => {
      const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl);
      if (!match) return null;
      const ext = match[1];
      const nombre = `equipo_${Date.now()}_${i}.${ext}`;
      const ruta = path.join(carpetaImgs, nombre);
      fs.writeFileSync(ruta, Buffer.from(match[2], "base64"));
      return ruta;
    }).filter(Boolean);

    const transaccion = db.transaction(() => {
      const infoEquipo = db
        .prepare(
          `INSERT INTO equipos
             (id_cliente, tipo_equipo, marca, modelo, color, imei, serial, ram, almacenamiento, encendido,
              accesorio_funda, accesorio_simcard, accesorio_cable_usb, accesorio_cargador, accesorio_memoria_externa,
              patron_desbloqueo, pin_desbloqueo, detalle_extra, imagenes)
           VALUES (@id_cliente, @tipo_equipo, @marca, @modelo, @color, @imei, @serial, @ram, @almacenamiento, @encendido,
              @accesorio_funda, @accesorio_simcard, @accesorio_cable_usb, @accesorio_cargador, @accesorio_memoria_externa,
              @patron_desbloqueo, @pin_desbloqueo, @detalle_extra, @imagenes)`
        )
        .run({ ...equipo, imagenes: JSON.stringify(rutasGuardadas) });
      const idEquipo = infoEquipo.lastInsertRowid;

      const insertPeriferico = db.prepare(
        "INSERT INTO perifericos_estado (id_equipo, periferico, estado) VALUES (?, ?, ?)"
      );
      for (const p of perifericos || []) insertPeriferico.run(idEquipo, p.nombre, p.estado);

      const numeroOrden = generarNumeroOrden();
      const infoOrden = db
        .prepare(
          `INSERT INTO ordenes (numero_orden, id_cliente, id_equipo, falla_reportada, estado)
           VALUES (?, ?, ?, ?, 'Equipo Recibido')`
        )
        .run(numeroOrden, equipo.id_cliente, idEquipo, fallaReportada);

      return { idOrden: infoOrden.lastInsertRowid, numeroOrden, idEquipo };
    });

    const resultado = transaccion();
    const completa = obtenerOrdenCompleta(resultado.idOrden);
    const config = getConfig();
    const pdf = require("./pdf");
    const rutaRecibo = await pdf.generarReciboTermico({ ...completa, config });

    return { orden: completa.orden, rutaRecibo };
  });

  ipcMain.handle("ordenes:actualizar", async (_e, payload) => {
    const { idOrden, equipo, perifericos, fallaReportada } = payload;
    const transaccion = db.transaction(() => {
      const orden = db.prepare("SELECT id_equipo FROM ordenes WHERE id_orden = ?").get(idOrden);
      if (!orden) return { ok: false };
      const idEquipo = orden.id_equipo;

      db.prepare(`
        UPDATE equipos SET
          tipo_equipo = @tipo_equipo,
          marca = @marca,
          modelo = @modelo,
          color = @color,
          imei = @imei,
          serial = @serial,
          ram = @ram,
          almacenamiento = @almacenamiento,
          encendido = @encendido,
          accesorio_funda = @accesorio_funda,
          accesorio_simcard = @accesorio_simcard,
          accesorio_cable_usb = @accesorio_cable_usb,
          accesorio_cargador = @accesorio_cargador,
          accesorio_memoria_externa = @accesorio_memoria_externa,
          patron_desbloqueo = @patron_desbloqueo,
          pin_desbloqueo = @pin_desbloqueo,
          detalle_extra = @detalle_extra
        WHERE id_equipo = ?
      `).run({ ...equipo }, idEquipo);

      db.prepare("DELETE FROM perifericos_estado WHERE id_equipo = ?").run(idEquipo);
      const insertPeriferico = db.prepare(
        "INSERT INTO perifericos_estado (id_equipo, periferico, estado) VALUES (?, ?, ?)"
      );
      for (const p of perifericos || []) insertPeriferico.run(idEquipo, p.nombre, p.estado);

      db.prepare("UPDATE ordenes SET falla_reportada = ? WHERE id_orden = ?").run(fallaReportada, idOrden);
    });
    transaccion();
    return { ok: true };
  });

  // ---------- Órdenes: listado / búsqueda / eliminación ----------
  ipcMain.handle("ordenes:listar", (_e, filtros = {}) => {
    const { estado, fechaDesde, fechaHasta } = filtros;
    let sql = `SELECT o.*, c.nombres AS cliente_nombre, e.tipo_equipo, e.marca, e.modelo
               FROM ordenes o
               JOIN clientes c ON c.id_cliente = o.id_cliente
               JOIN equipos e ON e.id_equipo = o.id_equipo WHERE 1=1`;
    const params = [];
    if (estado) {
      sql += " AND o.estado = ?";
      params.push(estado);
    }
    if (fechaDesde) {
      sql += " AND date(o.fecha_creacion) >= date(?)";
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      sql += " AND date(o.fecha_creacion) <= date(?)";
      params.push(fechaHasta);
    }
    sql += " ORDER BY o.fecha_creacion DESC";
    return db.prepare(sql).all(...params);
  });

  ipcMain.handle("ordenes:buscar", (_e, numeroOrden) => {
    const orden = db.prepare("SELECT id_orden FROM ordenes WHERE numero_orden = ?").get(numeroOrden);
    if (!orden) return null;
    return obtenerOrdenCompleta(orden.id_orden);
  });

  ipcMain.handle("ordenes:eliminar", (_e, idOrden) => {
    const transaccion = db.transaction(() => {
      db.prepare("DELETE FROM pagos WHERE id_orden = ?").run(idOrden);
      db.prepare("DELETE FROM diagnosticos WHERE id_orden = ?").run(idOrden);
      db.prepare("DELETE FROM garantias WHERE id_orden = ?").run(idOrden);
      db.prepare("DELETE FROM ordenes WHERE id_orden = ?").run(idOrden);
    });
    transaccion();
    return { ok: true };
  });

  // Recibido -> (En Espera de Aprobación | Equipo No Reparado)
  ipcMain.handle("ordenes:registrarDiagnostico", (_e, payload) => {
    const { idOrden, fallaEncontrada, tieneReparacion, tipoProcedimiento, costoRepuesto, costoManoObra, diasGarantia } = payload;
    const config = getConfig();
    const cargoDiagnostico = tieneReparacion ? 0 : parseFloat(config.cargo_diagnostico || 0);

    const transaccion = db.transaction(() => {
      db.prepare(
        `INSERT INTO diagnosticos
           (id_orden, falla_encontrada, tiene_reparacion, tipo_procedimiento, costo_repuesto, costo_mano_obra, cargo_diagnostico, dias_garantia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        idOrden,
        fallaEncontrada || "",
        tieneReparacion ? 1 : 0,
        tipoProcedimiento || "",
        costoRepuesto || 0,
        costoManoObra || 0,
        cargoDiagnostico,
        diasGarantia || parseInt(config.dias_garantia_default || 30)
      );
      const nuevoEstado = tieneReparacion ? "En Espera de Aprobacion" : "Equipo No Reparado";
      db.prepare("UPDATE ordenes SET estado = ? WHERE id_orden = ?").run(nuevoEstado, idOrden);
    });
    transaccion();

    const orden = db.prepare("SELECT * FROM ordenes WHERE id_orden = ?").get(idOrden);
    const cliente = db.prepare("SELECT * FROM clientes WHERE id_cliente = ?").get(orden.id_cliente);

    const mensaje = tieneReparacion
      ? `Hola ${cliente.nombres}, tu equipo (orden ${orden.numero_orden}) ya tiene diagnóstico. Costo estimado: $${(
          (costoRepuesto || 0) + (costoManoObra || 0)
        ).toFixed(2)}. Quedamos atentos a tu aprobación para iniciar la reparación.`
      : `Hola ${cliente.nombres}, tu equipo (orden ${orden.numero_orden}) no pudo ser reparado. Se aplica un cargo de revisión de $${cargoDiagnostico.toFixed(
          2
        )}. Puedes pasar a retirarlo cuando gustes.`;

    return { orden, mensaje };
  });

  // En Espera de Aprobación -> registrar pago (abono / total) -> Aprobado
  ipcMain.handle("pagos:registrarYAvanzar", (_e, { idOrden, monto, tipo }) => {
    db.prepare("INSERT INTO pagos (id_orden, monto, tipo) VALUES (?, ?, ?)").run(idOrden, monto, tipo || "Abono");
    db.prepare("UPDATE ordenes SET estado = 'Aprobado' WHERE id_orden = ?").run(idOrden);
    const info = saldoPendiente(idOrden);
    return { ok: true, ...info, mensaje: tipo === "Pago Total" ? "Pago total registrado" : "Abono registrado" };
  });

  // Pago suelto (completar saldo en el paso de Entregado)
  ipcMain.handle("pagos:registrar", (_e, { idOrden, monto, tipo }) => {
    db.prepare("INSERT INTO pagos (id_orden, monto, tipo) VALUES (?, ?, ?)").run(idOrden, monto, tipo || "Abono");
    return { ok: true, ...saldoPendiente(idOrden) };
  });

  // Transición simple genérica: Aprobado -> En Reparacion, Reparado -> Listo para Entrega
  ipcMain.handle("ordenes:avanzarSimple", (_e, { idOrden, siguienteEstado }) => {
    db.prepare("UPDATE ordenes SET estado = ? WHERE id_orden = ?").run(siguienteEstado, idOrden);
    return { ok: true };
  });

  // En Reparacion -> Reparado (con re-checklist de perifericos)
  ipcMain.handle("ordenes:marcarReparado", (_e, { idOrden, perifericos }) => {
    const transaccion = db.transaction(() => {
      const orden = db.prepare("SELECT id_equipo FROM ordenes WHERE id_orden = ?").get(idOrden);
      const update = db.prepare("UPDATE perifericos_estado SET estado = ? WHERE id_equipo = ? AND periferico = ?");
      for (const p of perifericos) update.run(p.estado, orden.id_equipo, p.nombre);
      db.prepare("UPDATE ordenes SET estado = 'Reparado' WHERE id_orden = ?").run(idOrden);
    });
    transaccion();
    return { ok: true };
  });

  // Listo para Entrega -> Entregado (valida saldo salvo que sea reingreso por garantía)
  ipcMain.handle("ordenes:entregar", async (_e, idOrden) => {
    const orden = db.prepare("SELECT * FROM ordenes WHERE id_orden = ?").get(idOrden);
    const { totalOrden, totalPagado, saldo } = saldoPendiente(idOrden);

    if (!orden.es_reingreso && saldo > 0.009) {
      return { ok: false, error: "El cliente aún no completa el pago. Registra el saldo pendiente para continuar.", saldo };
    }

    const diagnostico = db
      .prepare("SELECT * FROM diagnosticos WHERE id_orden = ? ORDER BY id_diagnostico DESC")
      .get(idOrden);
    const diasGarantia = diagnostico?.dias_garantia || parseInt(getConfig().dias_garantia_default || 30);
    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + diasGarantia);
    const cicloAnterior = db.prepare("SELECT MAX(ciclo) AS c FROM garantias WHERE id_orden = ?").get(idOrden).c || 0;

    const transaccion = db.transaction(() => {
      db.prepare("UPDATE ordenes SET estado = 'Entregado', fecha_entrega = ? WHERE id_orden = ?").run(
        fechaInicio.toISOString(),
        idOrden
      );
      db.prepare(
        `INSERT INTO garantias (id_orden, dias_garantia, fecha_inicio, fecha_fin, ciclo) VALUES (?, ?, ?, ?, ?)`
      ).run(idOrden, diasGarantia, fechaInicio.toISOString(), fechaFin.toISOString(), cicloAnterior + 1);
    });
    transaccion();

    const completa = obtenerOrdenCompleta(idOrden);
    const config = getConfig();
    const pdf = require("./pdf");
    const rutaFactura = await pdf.generarFacturaCarta({ ...completa, config });

    return { ok: true, rutaFactura, garantia: completa.garantia };
  });

  // ---------- Garantías / Reingreso ----------
  ipcMain.handle("garantias:buscar", (_e, query) => {
    let ordenes = db.prepare("SELECT id_orden FROM ordenes WHERE numero_orden = ?").all(query);
    if (ordenes.length === 0) {
      ordenes = db.prepare("SELECT id_orden FROM ordenes WHERE id_cliente = ? ORDER BY fecha_creacion DESC").all(query);
    }
    return ordenes.map(({ id_orden }) => {
      const completa = obtenerOrdenCompleta(id_orden);
      const vigente = completa.garantia ? new Date(completa.garantia.fecha_fin) >= new Date() : false;
      return { ...completa, vigente };
    });
  });

  ipcMain.handle("garantias:reingreso", (_e, idOrden) => {
    db.prepare("UPDATE ordenes SET estado = 'En Reparacion', es_reingreso = 1 WHERE id_orden = ?").run(idOrden);
    return { ok: true };
  });

  // ---------- Dashboard ----------
  ipcMain.handle("dashboard:resumen", () => {
    const contar = (estado) => db.prepare("SELECT COUNT(*) AS total FROM ordenes WHERE estado = ?").get(estado).total;
    return {
      recibidos: contar("Equipo Recibido"),
      enReparacion: contar("En Reparacion"),
      listosEntrega: contar("Listo para Entrega"),
    };
  });

  // ---------- Reportes ----------
  ipcMain.handle("reportes:resumen", () => {
    const ingresos = db
      .prepare(`SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE date(fecha) >= date('now','start of month')`)
      .get().total;
    const costos = db
      .prepare(
        `SELECT COALESCE(SUM(costo_repuesto),0) AS total FROM diagnosticos WHERE date(fecha) >= date('now','start of month')`
      )
      .get().total;
    const entregadasMes = db
      .prepare(
        `SELECT COUNT(*) AS total FROM ordenes WHERE estado='Entregado' AND date(fecha_entrega) >= date('now','start of month')`
      )
      .get().total;
    return { ingresos, gananciaNeta: ingresos - costos, entregadasMes };
  });

  // ---------- Configuración ----------
  ipcMain.handle("configuracion:obtener", () => getConfig());

  ipcMain.handle("configuracion:guardar", (_e, valores) => {
    const stmt = db.prepare(
      "INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor"
    );
    for (const [clave, valor] of Object.entries(valores)) stmt.run(clave, String(valor));
    return { ok: true };
  });

  ipcMain.handle("configuracion:subirLogo", async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: "Imágenes", extensions: ["png", "jpg", "jpeg"] }],
      properties: ["openFile"],
    });
    if (res.canceled || !res.filePaths[0]) return null;
    const destino = path.join(app.getPath("userData"), "logo" + path.extname(res.filePaths[0]));
    fs.copyFileSync(res.filePaths[0], destino);
    db.prepare(
      "INSERT INTO configuracion (clave, valor) VALUES ('taller_logo', ?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor"
    ).run(destino);
    return destino;
  });

  ipcMain.handle("configuracion:backupDB", async () => {
    const res = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `electron360_backup_${Date.now()}.db`,
    });
    if (res.canceled || !res.filePath) return { ok: false };
    const origen = path.join(app.getPath("userData"), "electron360.db");
    fs.copyFileSync(origen, res.filePath);
    return { ok: true, ruta: res.filePath };
  });

  ipcMain.handle("configuracion:resetearDB", () => {
    const tablas = ["pagos", "garantias", "diagnosticos", "perifericos_estado", "ordenes", "equipos", "clientes"];
    const transaccion = db.transaction(() => {
      for (const t of tablas) db.prepare(`DELETE FROM ${t}`).run();
    });
    transaccion();
    return { ok: true };
  });

  ipcMain.handle("configuracion:purgarOrdenesVencidas", () => {
    const info = db
      .prepare(`DELETE FROM ordenes WHERE estado='Entregado' AND date(fecha_entrega) < date('now','-3 months')`)
      .run();
    return { ok: true, eliminadas: info.changes };
  });

  // ---------- Sistema ----------
  ipcMain.handle("sistema:abrirArchivo", (_e, ruta) => shell.openPath(ruta));
}
