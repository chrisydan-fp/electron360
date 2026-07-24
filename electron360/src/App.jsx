import { useEffect } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import NuevaOrden from "./pages/NuevaOrden";
import Ordenes from "./pages/Ordenes";
import Garantias from "./pages/Garantias";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import { useNavStore } from "./store/useNavStore";

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
  const ViewComponent = VIEWS[currentView] ?? Dashboard;

  useEffect(() => {
    window.electron360API.configuracion.obtener().then((config) => {
      document.documentElement.classList.toggle("light", config.tema === "claro");
    });
  }, []);

  return (
    <Layout>
      <ViewComponent />
    </Layout>
  );
}
