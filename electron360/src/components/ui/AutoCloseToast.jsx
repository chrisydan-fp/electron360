import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function AutoCloseToast({ open, message, onClose, ms = 2000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, ms);
    return () => clearTimeout(t);
  }, [open, ms, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative panel border-neon-green/40 shadow-neon-green px-6 py-5 flex items-center gap-3">
        <CheckCircle2 className="text-neon-green" size={22} />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
}
