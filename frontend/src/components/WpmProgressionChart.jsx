import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Illustrative sample data — a typical WPM curve across practice sessions,
// not tied to any real user. Used to visualize the article's point that
// speed climbs steadily with consistent practice, not in one leap.
const SAMPLE_DATA = [
  { session: 1, wpm: 32 },
  { session: 2, wpm: 36 },
  { session: 3, wpm: 35 },
  { session: 4, wpm: 41 },
  { session: 5, wpm: 45 },
  { session: 6, wpm: 47 },
  { session: 7, wpm: 52 },
  { session: 8, wpm: 55 },
  { session: 9, wpm: 58 },
  { session: 10, wpm: 63 },
];

const WIDTH = 560;
const HEIGHT = 260;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-bronze/60 bg-navy-dark px-3 py-2 font-mono text-xs text-cream/90">
      <div className="text-bronze">SESSION {label}</div>
      <div style={{ color: "#F5C542" }}>{payload[0].value} WPM</div>
    </div>
  );
}

// Fixed pixel dimensions on purpose — no ResponsiveContainer. Recharts'
// ResponsiveContainer measures its parent via ResizeObserver on mount,
// which can still be mid-flight when Puppeteer captures the prerendered
// route (scripts/prerender.js), producing a blank 0-width SVG in the
// static HTML. A static, illustrative chart like this doesn't need
// responsive sizing — a known width renders correctly synchronously,
// every time, in both the browser and the prerender.
export default function WpmProgressionChart() {
  return (
    <div className="guide-embed" data-testid="wpm-progression-chart">
      <div className="mb-2 flex items-center justify-between">
        <span className="tech-label text-cream/70">WPM PROGRESSION · ILLUSTRATIVE</span>
        <span className="font-mono text-xs" style={{ color: "#F5C542" }}>63 WPM PEAK</span>
      </div>
      <div className="overflow-x-auto">
        <LineChart width={WIDTH} height={HEIGHT} data={SAMPLE_DATA} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#875327" strokeOpacity={0.25} strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="session"
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={{ stroke: "#875327" }}
            tickLine={false}
            label={{ value: "PRACTICE SESSION", position: "insideBottom", offset: -2, fill: "rgba(245,239,229,0.4)", fontSize: 10 }}
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
