import { useEffect } from "react";
import Layout from "./components/layout/Layout";
import { useNavStore } from "./store/useNavStore";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import NuevaOrden from "./pages/NuevaOrden";
import Ordenes from "./pages/Ordenes";
import Garantias from "./pages/Garantias";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import { X } from "lucide-react";

const VIEWS = {
  dashboard: Dashboard,
  clientes: Clientes,
  "nueva-orden": NuevaOrden,
  ordenes: Ordenes,
  garantias: Garantias,
  reportes: Reportes,
  configuracion: Configuracion,
};

export default function App() {
  const currentView = useNavStore((s) => s.currentView);
  const pdfViewerUrl = useNavStore((s) => s.pdfViewerUrl);
  const setPdfViewerUrl = useNavStore((s) => s.setPdfViewerUrl);
  const ViewComponent = VIEWS[currentView] || Dashboard;

  useEffect(() => {
    window.electron360API.configuracion.obtener().then((config) => {
      document.documentElement.classList.toggle("light", config.tema === "claro");
    });
  }, []);

  return (
    <Layout>
      <ViewComponent />

      {/* Visor de PDF interno */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl h-[90vh] bg-base-900 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-neon-blue">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-base-950">
              <span className="text-white font-semibold">Visor de Documentos (Electron360)</span>
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="text-slate-400 hover:text-neon-red transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-900">
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full border-none"
                title="Visor PDF"
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
