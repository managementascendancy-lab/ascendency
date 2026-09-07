import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from "recharts";

// Illustrative sample curve — a beginner's WPM dipping below their old
// hunt-and-peck baseline while relearning correct form, recovering, then
// flattening into the plateau the article's Step 4 describes, before
// deliberate practice breaks through it. Not tied to any real user.
const SAMPLE_DATA = [
  { week: 1, wpm: 30 },
  { week: 2, wpm: 22 },
  { week: 3, wpm: 24 },
  { week: 4, wpm: 27 },
  { week: 5, wpm: 33 },
  { week: 6, wpm: 34 },
  { week: 7, wpm: 34 },
  { week: 8, wpm: 35 },
  { week: 9, wpm: 42 },
  { week: 10, wpm: 47 },
];

const WIDTH = 560;
const HEIGHT = 260;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-bronze/60 bg-navy-dark px-3 py-2 font-mono text-xs text-cream/90">
      <div className="text-bronze">WEEK {label}</div>
      <div style={{ color: "#F5C542" }}>{payload[0].value} WPM</div>
    </div>
  );
}

// Fixed pixel dimensions on purpose — see WpmProgressionChart.jsx for why
// ResponsiveContainer is avoided (it can render blank in the prerendered
// static HTML, since its ResizeObserver measurement isn't guaranteed to
// resolve before scripts/prerender.js captures the page).
export default function PracticeCurveChart() {
  return (
    <div className="guide-embed" data-testid="practice-curve-chart">
      <div className="mb-2 flex items-center justify-between">
        <span className="tech-label text-cream/70">PRACTICE CURVE · ILLUSTRATIVE</span>
        <span className="font-mono text-xs" style={{ color: "#F5C542" }}>PLATEAU · WEEKS 6-8</span>
      </div>
      <div className="overflow-x-auto">
        <LineChart width={WIDTH} height={HEIGHT} data={SAMPLE_DATA} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#875327" strokeOpacity={0.25} strokeDasharray="2 6" vertical={false} />
          <ReferenceArea x1={6} x2={8} fill="#875327" fillOpacity={0.18} />
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={{ stroke: "#875327" }}
            tickLine={false}
            label={{ value: "PRACTICE WEEK", position: "insideBottom", offset: -2, fill: "rgba(245,239,229,0.4)", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#875327", strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="wpm" stroke="#F5C542" strokeWidth={2} dot={{ r: 3, fill: "#F5C542" }} activeDot={{ r: 5 }} />
        </LineChart>
      </div>
    </div>
  );
}
