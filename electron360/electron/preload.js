const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron360API", {
  clientes: {
    buscarPorId: (id) => ipcRenderer.invoke("clientes:buscarPorId", id),
    crear: (cliente) => ipcRenderer.invoke("clientes:crear", cliente),
    actualizar: (cliente) => ipcRenderer.invoke("clientes:actualizar", cliente),
    listarRecientes: () => ipcRenderer.invoke("clientes:listarRecientes"),
  },
  catalogos: {
    marcas: (tipoEquipo) => ipcRenderer.invoke("catalogos:marcas", tipoEquipo),
    modelos: (marca) => ipcRenderer.invoke("catalogos:modelos", marca),
    colores: () => ipcRenderer.invoke("catalogos:colores"),
    agregarMarca: (payload) => ipcRenderer.invoke("catalogos:agregarMarca", payload),
    agregarModelo: (payload) => ipcRenderer.invoke("catalogos:agregarModelo", payload),
    agregarColor: (color) => ipcRenderer.invoke("catalogos:agregarColor", color),
    importar: (payload) => ipcRenderer.invoke("catalogos:importar", payload),
  },
  ordenes: {
    crear: (payload) => ipcRenderer.invoke("ordenes:crear", payload),
    actualizar: (payload) => ipcRenderer.invoke("ordenes:actualizar", payload),
    listar: (filtros) => ipcRenderer.invoke("ordenes:listar", filtros),
    buscar: (numeroOrden) => ipcRenderer.invoke("ordenes:buscar", numeroOrden),
    eliminar: (idOrden) => ipcRenderer.invoke("ordenes:eliminar", idOrden),
    registrarDiagnostico: (payload) => ipcRenderer.invoke("ordenes:registrarDiagnostico", payload),
    avanzarSimple: (payload) => ipcRenderer.invoke("ordenes:avanzarSimple", payload),
    marcarReparado: (payload) => ipcRenderer.invoke("ordenes:marcarReparado", payload),
    entregar: (idOrden) => ipcRenderer.invoke("ordenes:entregar", idOrden),
  },
  pagos: {
    registrar: (payload) => ipcRenderer.invoke("pagos:registrar", payload),
    registrarYAvanzar: (payload) => ipcRenderer.invoke("pagos:registrarYAvanzar", payload),
  },
  garantias: {
    buscar: (query) => ipcRenderer.invoke("garantias:buscar", query),
    reingreso: (idOrden) => ipcRenderer.invoke("garantias:reingreso", idOrden),
  },
  dashboard: {
    resumen: () => ipcRenderer.invoke("dashboard:resumen"),
  },
  reportes: {
    resumen: () => ipcRenderer.invoke("reportes:resumen"),
  },
  configuracion: {
    obtener: () => ipcRenderer.invoke("configuracion:obtener"),
    guardar: (valores) => ipcRenderer.invoke("configuracion:guardar", valores),
    subirLogo: () => ipcRenderer.invoke("configuracion:subirLogo"),
    backupDB: () => ipcRenderer.invoke("configuracion:backupDB"),
    restoreDB: () => ipcRenderer.invoke("configuracion:restoreDB"),
    resetearDB: () => ipcRenderer.invoke("configuracion:resetearDB"),
    purgarOrdenesVencidas: () => ipcRenderer.invoke("configuracion:purgarOrdenesVencidas"),
  },
  sistema: {
    abrirArchivo: (ruta) => ipcRenderer.invoke("sistema:abrirArchivo", ruta),
  },
});
