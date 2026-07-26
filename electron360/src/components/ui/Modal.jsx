import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} panel border-electric-500/20 shadow-neon-blue-sm max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-base-900/95 backdrop-blur rounded-t-2xl">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-neon-red transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
