import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Illustrative sample points — rushed attempts (lower accuracy at high WPM)
// vs. controlled ones (higher accuracy, still fast) — visualizing the
// article's point that accuracy, not raw speed, is the harder-earned metric.
const RUSHED = [
  { wpm: 58, accuracy: 82 },
  { wpm: 64, accuracy: 79 },
  { wpm: 71, accuracy: 76 },
  { wpm: 76, accuracy: 74 },
  { wpm: 82, accuracy: 71 },
];
const CONTROLLED = [
  { wpm: 48, accuracy: 96 },
  { wpm: 53, accuracy: 97 },
  { wpm: 57, accuracy: 98 },
  { wpm: 61, accuracy: 97 },
  { wpm: 66, accuracy: 98 },
];

const WIDTH = 560;
const HEIGHT = 260;

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-bronze/60 bg-navy-dark px-3 py-2 font-mono text-xs text-cream/90">
      <div>{p.wpm} WPM</div>
      <div style={{ color: "#8AA073" }}>{p.accuracy}% ACC</div>
    </div>
  );
}

// Fixed pixel dimensions on purpose — see WpmProgressionChart.jsx for why
// ResponsiveContainer is avoided (it can render blank in the prerendered
// static HTML, since its ResizeObserver measurement isn't guaranteed to
// resolve before scripts/prerender.js captures the page).
export default function AccuracySpeedTradeoffChart() {
  return (
    <div className="guide-embed" data-testid="accuracy-speed-tradeoff-chart">
      <div className="mb-2 flex items-center gap-4">
        <span className="tech-label text-cream/70">SPEED VS. ACCURACY · ILLUSTRATIVE</span>
        <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#8AA073" }}>
          <span className="h-1.5 w-1.5" style={{ background: "#8AA073" }} /> CONTROLLED
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#DF350D" }}>
          <span className="h-1.5 w-1.5" style={{ background: "#DF350D" }} /> RUSHED
        </span>
      </div>
      <div className="overflow-x-auto">
        <ScatterChart width={WIDTH} height={HEIGHT} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#875327" strokeOpacity={0.25} strokeDasharray="2 6" />
          <XAxis
            type="number"
            dataKey="wpm"
            name="WPM"
            domain={[40, 90]}
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={{ stroke: "#875327" }}
            tickLine={false}
            label={{ value: "WPM", position: "insideBottom", offset: -2, fill: "rgba(245,239,229,0.4)", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="accuracy"
            name="Accuracy"
            domain={[65, 100]}
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#875327" }} />
          <Scatter data={CONTROLLED} fill="#8AA073" />
          <Scatter data={RUSHED} fill="#DF350D" />
        </ScatterChart>
      </div>
    </div>
  );
}
