import React from "react";

// Radial progression toward next hero classification.
// progress: 0-100. label & sublabel text in center.
export default function AscensionRing({ progress = 0, label = "", sublabel = "", size = 200 }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 100));
  const offset = c - (clamped / 100) * c;
  const cx = size / 2;

  // 10 outer segments (dashed)
  const seg = c / 10;
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* outer dashed segment ring */}
        <circle
          cx={cx}
          cy={cx}
          r={r + 8}
          fill="none"
          stroke="#875327"
          strokeWidth="1.5"
          strokeDasharray={`${seg * 0.6} ${seg * 0.4}`}
          opacity="0.55"
        />
        {/* track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#0B0F2A" strokeWidth="6" />
        {/* progress */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#C88900"
          strokeWidth="6"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)", filter: "drop-shadow(0 0 4px rgba(200,137,0,0.6))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-700 text-gold-bright">{Math.round(clamped)}%</span>
        {label && <span className="tech-label mt-1 text-cream/80">{label}</span>}
        {sublabel && <span className="tech-label mt-0.5 text-[9px] text-gold-bright">{sublabel}</span>}
      </div>
    </div>
  );
}
