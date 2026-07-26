const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const PdfPrinter = require("pdfmake");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "fonts/Roboto-MediumItalic.ttf"),
  },
};
const printer = new PdfPrinter(fonts);

function guardarPdf(docDefinition, nombreArchivo) {
  return new Promise((resolve, reject) => {
    const outDir = path.join(app.getPath("userData"), "documentos");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, nombreArchivo);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(filePath);

    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));

    pdfDoc.pipe(stream);
    pdfDoc.end();

    stream.on("finish", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64Data = pdfBuffer.toString("base64");
      const dataUrl = `data:application/pdf;base64,${base64Data}`;
      resolve({ filePath, dataUrl });
    });
    stream.on("error", reject);
  });
}

function encabezadoTaller(config) {
  const bloques = [{ text: config.taller_nombre || "Taller Técnico", bold: true, fontSize: 11, alignment: "center" }];
  if (config.taller_telefono) bloques.push({ text: `Tel: ${config.taller_telefono}`, fontSize: 7, alignment: "center" });
  if (config.taller_direccion) bloques.push({ text: config.taller_direccion, fontSize: 7, alignment: "center" });
  if (config.taller_correo) bloques.push({ text: config.taller_correo, fontSize: 7, alignment: "center" });
  return bloques;
}

/** Recibo de Ingreso — Térmico 80mm */
function generarReciboTermico({ orden, cliente, equipo, perifericos, config }) {
  const anchoPt = (80 / 25.4) * 72;
  const nombreEquipo = `${equipo.tipo_equipo} — ${equipo.marca || ""} ${equipo.modelo || ""}`.trim();

  const filasPerifericos = perifericos.map((p) => [
    { text: p.periferico, fontSize: 8 },
    { text: p.estado, fontSize: 8, alignment: "right" },
  ]);

  const listaAccesorios = [];
  if (equipo.accesorio_funda) listaAccesorios.push("Funda");
  if (equipo.accesorio_simcard) listaAccesorios.push("SIM Card");
  if (equipo.accesorio_cable_usb) listaAccesorios.push("Cable USB");
  if (equipo.accesorio_cargador) listaAccesorios.push("Cargador");
  if (equipo.accesorio_memoria_externa) listaAccesorios.push("Memoria Externa");
  const accesoriosTexto = listaAccesorios.length > 0 ? listaAccesorios.join(", ") : "Ninguno";

  const docDefinition = {
    pageSize: { width: anchoPt, height: "auto" },
    pageMargins: [10, 10, 10, 10],
    content: [
      ...(config.taller_logo && fs.existsSync(config.taller_logo)
        ? [{ image: config.taller_logo, width: 60, alignment: "center", margin: [0, 0, 0, 4] }]
        : []),
      ...encabezadoTaller(config),
      { canvas: [{ type: "line", x1: 0, y1: 6, x2: anchoPt - 20, y2: 6, lineWidth: 0.5 }] },

      { text: orden.numero_orden, bold: true, fontSize: 20, alignment: "center", margin: [0, 8, 0, 2] },
      { text: orden.numero_orden.replace("#", ""), style: "barcode", alignment: "center", margin: [0, 0, 0, 4] },
      { text: `${new Date(orden.fecha_creacion).toLocaleString()}`, fontSize: 8, alignment: "center" },

      { text: "Cliente", bold: true, fontSize: 9, margin: [0, 8, 0, 2] },
      { text: cliente.nombres, fontSize: 8 },
      { text: `Tel: ${cliente.telefono || "—"}`, fontSize: 8 },

      { text: "Equipo", bold: true, fontSize: 9, margin: [0, 8, 0, 2] },
      { text: nombreEquipo, fontSize: 8 },
      { text: `Color: ${equipo.color || "—"}`, fontSize: 8 },
      { text: `IMEI: ${equipo.imei || "—"}`, fontSize: 8 },
      { text: `Serial: ${equipo.serial || "—"}`, fontSize: 8 },
      { text: `RAM: ${equipo.ram || "—"}`, fontSize: 8 },
      { text: `Memoria: ${equipo.almacenamiento || "—"}`, fontSize: 8 },
      { text: `Accesorios: ${accesoriosTexto}`, fontSize: 8 },

      { text: "Falla Reportada", bold: true, fontSize: 9, margin: [0, 8, 0, 2] },
      { text: orden.falla_reportada || "—", fontSize: 8 },
      { text: `Estado: ${equipo.encendido ? "Encendido" : "Apagado"}`, fontSize: 8, margin: [0, 2, 0, 0] },

      { text: "Checklist de Periféricos", bold: true, fontSize: 9, margin: [0, 8, 0, 3] },
      { table: { widths: ["*", "auto"], body: filasPerifericos }, layout: "noBorders" },

      { text: " ", fontSize: 4 },
      equipo.patron_desbloqueo
        ? { text: `Patrón: ${equipo.patron_desbloqueo}`, fontSize: 8 }
        : equipo.pin_desbloqueo
        ? { text: `PIN: ${equipo.pin_desbloqueo}`, fontSize: 8 }
        : { text: "Sin patrón/PIN registrado", fontSize: 8, italics: true },

      { text: " ", fontSize: 14 },
      { text: "Firma de Cliente: ________________________", fontSize: 8, margin: [0, 10, 0, 0] },
      {
        table: { widths: [70], heights: [40], body: [[{ text: "Sello", fontSize: 7, alignment: "center" }]] },
        layout: "lightHorizontalLines",
        margin: [0, 14, 0, 0],
      },
    ],
    styles: { barcode: { font: "Roboto", fontSize: 16, bold: true, characterSpacing: 3 } },
    defaultStyle: { font: "Roboto" },
  };

  return guardarPdf(docDefinition, `recibo_${orden.numero_orden.replace("#", "")}.pdf`);
}

/** Factura de Entrega — PDF Carta */
function generarFacturaCarta({ orden, cliente, equipo, diagnostico, pagos, perifericos, garantia, config }) {
  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalOrden =
    (diagnostico?.costo_repuesto || 0) + (diagnostico?.costo_mano_obra || 0) + (diagnostico?.cargo_diagnostico || 0);

  const filasPagos = pagos.map((p) => [
    { text: new Date(p.fecha).toLocaleDateString(), fontSize: 9 },
    { text: p.tipo, fontSize: 9 },
    { text: `$${p.monto.toFixed(2)}`, fontSize: 9, alignment: "right" },
  ]);

  const filasPerifericos = perifericos.map((p) => [
    { text: p.periferico, fontSize: 8 },
    { text: p.estado, fontSize: 8, alignment: "right" },
  ]);

  const docDefinition = {
    pageSize: "LETTER",
    pageMargins: [40, 60, 40, 70],
    content: [
      ...(config.taller_logo && fs.existsSync(config.taller_logo)
        ? [{ image: config.taller_logo, width: 70, margin: [0, 0, 0, 6] }]
        : []),
      { text: config.taller_nombre || "Taller Técnico", fontSize: 16, bold: true, color: "#0d6bff" },
      { text: [config.taller_direccion, config.taller_telefono, config.taller_correo].filter(Boolean).join(" · "), fontSize: 8, margin: [0, 2, 0, 16] },

      {
        columns: [
          [
            { text: "Cliente", bold: true, fontSize: 10 },
            { text: cliente.nombres, fontSize: 10 },
            { text: cliente.telefono || "", fontSize: 10 },
          ],
          [
            { text: `Orden: ${orden.numero_orden}`, bold: true, fontSize: 10, alignment: "right" },
            { text: `Fecha de Entrega: ${new Date().toLocaleDateString()}`, fontSize: 10, alignment: "right" },
          ],
        ],
        margin: [0, 0, 0, 16],
      },

      { text: "Equipo", bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
      { text: `${equipo.tipo_equipo} — ${equipo.marca || ""} ${equipo.modelo || ""} (${equipo.color || "—"})`, fontSize: 10, margin: [0, 0, 0, 12] },

      { text: "Estado de Periféricos (Verificación Final)", bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
      { table: { widths: ["*", "auto"], body: filasPerifericos }, layout: "lightHorizontalLines", margin: [0, 0, 0, 12] },

      { text: "Desglose de Costos", bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ["*", "auto"],
          body: [
            ["Repuesto", `$${(diagnostico?.costo_repuesto || 0).toFixed(2)}`],
            ["Mano de Obra", `$${(diagnostico?.costo_mano_obra || 0).toFixed(2)}`],
            ["Cargo de Diagnóstico", `$${(diagnostico?.cargo_diagnostico || 0).toFixed(2)}`],
            [{ text: "Total", bold: true }, { text: `$${totalOrden.toFixed(2)}`, bold: true }],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 12],
      },

      { text: "Historial de Abonos", bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
      { table: { widths: ["*", "*", "auto"], body: [["Fecha", "Tipo", "Monto"], ...filasPagos] }, layout: "lightHorizontalLines", margin: [0, 0, 0, 4] },
      { text: `Saldo Pendiente: $${(totalOrden - totalPagado).toFixed(2)}`, bold: true, fontSize: 11, alignment: "right", color: totalOrden - totalPagado <= 0 ? "#39c96a" : "#ff3860", margin: [0, 0, 0, 20] },

      {
        columns: [
          { text: "Firma de Cliente: ______________________", fontSize: 9 },
          { text: "Firma de Técnico: ______________________", fontSize: 9 },
        ],
        margin: [0, 20, 0, 8],
      },
      {
        table: { widths: [80], heights: [45], body: [[{ text: "Sello del Taller", fontSize: 7, alignment: "center" }]] },
        layout: "lightHorizontalLines",
        margin: [0, 4, 0, 16],
      },

      {
        text: `Cláusula de Garantía: Este servicio cuenta con ${garantia?.dias_garantia || 0} días de garantía a partir de la fecha de entrega (vence el ${garantia?.fecha_fin ? new Date(garantia.fecha_fin).toLocaleDateString() : "—"}). La garantía cubre exclusivamente la falla original reportada y no aplica en casos de daño por líquidos, golpes posteriores o intervención de terceros.`,
        fontSize: 8,
        italics: true,
      },
    ],
    defaultStyle: { font: "Roboto" },
  };

  return guardarPdf(docDefinition, `factura_${orden.numero_orden.replace("#", "")}_c${garantia?.ciclo || 1}.pdf`);
}

module.exports = { generarReciboTermico, generarFacturaCarta };
