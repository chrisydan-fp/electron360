export default function ConfirmDialog({
  open,
  title,
  message,
  labelSi = "Sí",
  labelNo = "No",
  onSi,
  onNo,
  soloOk = false,
  labelOk = "Aceptar",
  onOk,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm panel border-electric-500/30 shadow-neon-blue-sm p-5 space-y-4">
        <p className="text-white font-semibold">{title}</p>
        {message && <p className="text-slate-400 text-sm">{message}</p>}
        <div className="flex gap-2 justify-end pt-2">
          {soloOk ? (
            <button onClick={onOk} className="btn-primary text-sm">
              {labelOk}
            </button>
          ) : (
            <>
              <button onClick={onNo} className="btn-secondary text-sm">
                {labelNo}
              </button>
              <button onClick={onSi} className="btn-primary text-sm">
                {labelSi}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
