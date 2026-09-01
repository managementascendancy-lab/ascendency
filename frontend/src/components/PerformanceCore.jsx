import React, { useMemo } from "react";

// Signature ASCENDANCY visualization: WPM + Accuracy + Consistency.
export default function PerformanceCore({
  wpm = 0,
  accuracy = 100,
  consistency = 0,
  intensity = 0,
  size = 320,
}) {
  const cx = size / 2;
  const rAcc = size / 2 - 18;
  const cAcc = 2 * Math.PI * rAcc;
  const accOffset = cAcc - (Math.max(0, Math.min(accuracy, 100)) / 100) * cAcc;

  // rotating tick nodes
  const ticks = useMemo(() => Array.from({ length: 36 }), []);

  // consistency waveform path
  const wave = useMemo(() => {
    const w = size - 120;
    const startX = 60;
    const midY = cx + 29;
    const amp = 6 + (consistency / 100) * 18 + intensity * 3;
    let d = `M ${startX} ${midY}`;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const x = startX + (w / steps) * i;
      const y = midY + Math.sin(i * 0.9) * amp * (i % 2 ? 1 : -0.7);
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [consistency, intensity, size, cx]);

  const accColor = "#8AA073";
  const coreColor = intensity >= 3 ? "#DF350D" : intensity >= 2 ? "#F5C542" : "#C88900";
  const spin = intensity >= 2 ? "animate-spin-slow" : "animate-spin-rev";

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }} data-testid="performance-core">
      {/* rotating tick ring */}
      <svg width={size} height={size} className={`absolute inset-0 ${spin}`}>
        {ticks.map((_, i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const inner = size / 2 - 6;
          const outer = size / 2 - (i % 3 === 0 ? 0 : 3);
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * inner}
              y1={cx + Math.sin(a) * inner}
              x2={cx + Math.cos(a) * outer}
              y2={cx + Math.sin(a) * outer}
              stroke={i % 9 === 0 ? coreColor : "#875327"}
              strokeWidth={i % 3 === 0 ? 1.5 : 1}
              opacity={i % 3 === 0 ? 0.9 : 0.4}
            />
          );
        })}
      </svg>

      {/* accuracy arc */}
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle cx={cx} cy={cx} r={rAcc} fill="none" stroke="#0B0F2A" strokeWidth="3" />
        <circle
          cx={cx}
          cy={cx}
          r={rAcc}
          fill="none"
          stroke={accColor}
          strokeWidth="3"
          strokeDasharray={cAcc}
          strokeDashoffset={accOffset}
          style={{ transition: "stroke-dashoffset 0.4s ease-out", filter: "drop-shadow(0 0 3px rgba(138,160,115,0.5))" }}
        />
      </svg>

      {/* center readout */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <span className="tech-label text-highlight">WPM</span>
        <span
          className="font-mono text-6xl font-700 leading-none"
          style={{ color: coreColor, textShadow: intensity >= 2 ? `0 0 18px ${coreColor}` : "none", transition: "color 0.4s" }}
          data-testid="core-wpm"
        >
          {Math.round(wpm)}
        </span>
        <div className="mt-6 flex items-center gap-4">
          <span className="font-mono text-xs text-sage">{accuracy.toFixed(0)}% ACC</span>
          <span className="font-mono text-xs text-gold">{Math.round(consistency)}% CNS</span>
        </div>
      </div>

      {/* consistency waveform */}
      <svg width={size} height={size} className="pointer-events-none absolute inset-0">
        <path d={wave} fill="none" stroke={coreColor} strokeWidth="1.5" opacity="0.7" />
      </svg>
    </div>
  );
}
