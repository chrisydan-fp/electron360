export default function StatCard({ icon: Icon, label, value, accent = "blue" }) {
  const accentMap = {
    blue: { text: "text-neon-blue", glow: "shadow-neon-blue-sm", ring: "border-electric-500/30" },
    violet: { text: "text-neon-violet", glow: "shadow-neon-violet", ring: "border-neon-violet/30" },
    green: { text: "text-neon-green", glow: "shadow-neon-green", ring: "border-neon-green/30" },
    amber: { text: "text-neon-amber", glow: "", ring: "border-neon-amber/30" },
  };
  const a = accentMap[accent] ?? accentMap.blue;

  return (
    <div className={`panel panel-hover p-5 flex items-center gap-4 border ${a.ring}`}>
      <div className={`w-12 h-12 rounded-xl bg-base-800 flex items-center justify-center border ${a.ring} ${a.glow}`}>
        <Icon size={22} className={a.text} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
