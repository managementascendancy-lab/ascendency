import React from "react";

function StatModule({ value, label, unit, accent = "#F5C542", index }) {
  return (
    <div className="relative border border-bronze/40 bg-navy-dark px-6 py-5 panel-clip-primary" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <span className="absolute right-3 top-2 font-mono text-[9px] text-bronze">0{index}</span>
      <div className="flex items-end gap-1">
        <span className="font-mono text-4xl font-700 leading-none" style={{ color: accent }}>
          {value}
        </span>
        {unit && <span className="mb-1 font-mono text-sm text-cream/60">{unit}</span>}
      </div>
      <div className="tech-label mt-2 text-cream/70">{label}</div>
      <div className="mt-3 h-px w-full bg-bronze/30">
        <div className="h-full bg-gradient-to-r from-red to-gold-bright" style={{ width: "60%" }} />
      </div>
    </div>
  );
}

export default function PerformanceStats({ bestWpm = 0, totalTests = 0, bestAccuracy = 0 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="performance-stats">
      <StatModule index={1} value={bestWpm || "—"} label="BEST WPM" accent="#F5C542" />
      <StatModule index={2} value={totalTests || "—"} label="SIMULATIONS" accent="#C88900" />
      <StatModule index={3} value={bestAccuracy ? `${bestAccuracy}` : "—"} unit={bestAccuracy ? "%" : ""} label="BEST ACCURACY" accent="#8AA073" />
    </div>
  );
}
