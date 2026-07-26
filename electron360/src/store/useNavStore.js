import { create } from "zustand";

export const useNavStore = create((set) => ({
  currentView: "dashboard",
  setView: (view) => set({ currentView: view }),

  // Cliente preseleccionado al pasar de "Clientes" -> "Nueva Orden" (caso 1 de acceso)
  clienteParaOrden: null,
  setClienteParaOrden: (cliente) => set({ clienteParaOrden: cliente }),

  // Número de orden a resaltar al entrar al módulo Órdenes (tras generar orden o reingreso)
  ordenDestacada: null,
  setOrdenDestacada: (numeroOrden) => set({ ordenDestacada: numeroOrden }),

  // ID de cliente buscado pero no encontrado para pre-llenar y habilitar registro express
  clienteIDParaRegistro: null,
  setClienteIDParaRegistro: (id) => set({ clienteIDParaRegistro: id }),

  // Base64 PDF Data URL to show in internal viewer modal
  pdfViewerUrl: null,
  setPdfViewerUrl: (url) => set({ pdfViewerUrl: url }),

  // Datos para clonar la orden en edición en Nueva Orden
  ordenParaEditar: null,
  setOrdenParaEditar: (orden) => set({ ordenParaEditar: orden }),
}));
