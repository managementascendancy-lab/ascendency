import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Illustrative sample waveforms — a "bursty" run (fast, then crashes, then
// recovers) vs. a steady one at a lower average pace — visualizing the
// article's point that consistency measures steadiness relative to your
// own average, not raw speed.
const SAMPLE_DATA = [
  { second: 0, bursty: 95, steady: 58 },
  { second: 3, bursty: 102, steady: 60 },
  { second: 6, bursty: 88, steady: 57 },
  { second: 9, bursty: 40, steady: 59 },
  { second: 12, bursty: 35, steady: 61 },
  { second: 15, bursty: 60, steady: 58 },
  { second: 18, bursty: 98, steady: 60 },
  { second: 21, bursty: 45, steady: 59 },
  { second: 24, bursty: 52, steady: 62 },
  { second: 27, bursty: 90, steady: 60 },
];

const WIDTH = 560;
const HEIGHT = 260;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-bronze/60 bg-navy-dark px-3 py-2 font-mono text-xs text-cream/90">
      <div className="text-bronze">{label}s</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.value} WPM
        </div>
      ))}
    </div>
  );
}

// Fixed pixel dimensions on purpose — see WpmProgressionChart.jsx for why
// ResponsiveContainer is avoided (it can render blank in the prerendered
// static HTML, since its ResizeObserver measurement isn't guaranteed to
// resolve before scripts/prerender.js captures the page).
export default function ConsistencyWaveformChart() {
  return (
    <div className="guide-embed" data-testid="consistency-waveform-chart">
      <div className="mb-2 flex items-center gap-4">
        <span className="tech-label text-cream/70">PACE OVER TIME · ILLUSTRATIVE</span>
        <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#DF350D" }}>
          <span className="h-1.5 w-1.5" style={{ background: "#DF350D" }} /> BURSTY
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#8AA073" }}>
          <span className="h-1.5 w-1.5" style={{ background: "#8AA073" }} /> STEADY
        </span>
      </div>
      <div className="overflow-x-auto">
        <LineChart width={WIDTH} height={HEIGHT} data={SAMPLE_DATA} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#875327" strokeOpacity={0.25} strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="second"
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={{ stroke: "#875327" }}
            tickLine={false}
            label={{ value: "SECONDS INTO RUN", position: "insideBottom", offset: -2, fill: "rgba(245,239,229,0.4)", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#875327", strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="bursty" stroke="#DF350D" strokeWidth={2} dot={{ r: 3, fill: "#DF350D" }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="steady" stroke="#8AA073" strokeWidth={2} dot={{ r: 3, fill: "#8AA073" }} activeDot={{ r: 5 }} />
        </LineChart>
      </div>
    </div>
  );
}
