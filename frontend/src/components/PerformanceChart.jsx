import React, { useMemo } from "react";

// Custom ASCENDANCY line chart (SVG). Avoids generic dashboard look.
export default function PerformanceChart({ data = [], color = "#F5C542", label = "", unit = "", height = 140 }) {
  const width = 520;
  const pad = 10;

  const { path, area, points, min, max } = useMemo(() => {
    if (!data.length) return { path: "", area: "", points: [], min: 0, max: 0 };
    const mn = Math.min(...data);
    const mx = Math.max(...data);
    const range = mx - mn || 1;
    const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = height - pad - ((v - mn) / range) * (height - pad * 2);
      return [x, y];
    });
    const p = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const a = `${p} L ${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
    return { path: p, area: a, points: pts, min: mn, max: mx };
  }, [data, height]);

  return (
    <div className="w-full" data-testid={`chart-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="tech-label text-cream/70">{label}</span>
        <span className="font-mono text-xs" style={{ color }}>
          {data.length ? `${max}${unit} PEAK` : "NO DATA"}
        </span>
      </div>
      {data.length ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
          <defs>
            <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={pad} x2={width - pad} y1={height * f} y2={height * f} stroke="#875327" strokeWidth="0.5" opacity="0.25" />
          ))}
          <path d={area} fill={`url(#g-${label})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill={color} />
          ))}
        </svg>
      ) : (
        <div className="flex h-[100px] items-center justify-center border border-dashed border-bronze/40 tech-label text-gold-bright">
          NO SIMULATIONS RECORDED
        </div>
      )}
    </div>
  );
}
