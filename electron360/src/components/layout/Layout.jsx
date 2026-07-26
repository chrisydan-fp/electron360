import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavStore } from "../../store/useNavStore";

export default function Layout({ children }) {
  const currentView = useNavStore((s) => s.currentView);

  return (
    <div className="flex h-full w-full overflow-hidden bg-app-gradient">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
