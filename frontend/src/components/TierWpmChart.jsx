import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { HEROES } from "@/data/heroes";

// Real threshold data, not illustrative — sourced directly from the same
// HEROES list the Classification Archive itself renders from, so this can
// never drift from the numbers in the article's own table above it. Each
// bar uses that hero's own accent color.
const DATA = HEROES.map((h) => ({ name: h.name, wpm: h.minWpm, accent: h.accent }));

const WIDTH = 560;
const HEIGHT = 260;

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="border border-bronze/60 bg-navy-dark px-3 py-2 font-mono text-xs text-cream/90">
      <div className="text-bronze">{p.name}</div>
      <div style={{ color: p.accent }}>{p.wpm} WPM MIN</div>
    </div>
  );
}

// Fixed pixel dimensions on purpose — see WpmProgressionChart.jsx for why
// ResponsiveContainer is avoided (it can render blank in the prerendered
// static HTML, since its ResizeObserver measurement isn't guaranteed to
// resolve before scripts/prerender.js captures the page).
export default function TierWpmChart() {
  return (
    <div className="guide-embed" data-testid="tier-wpm-chart">
      <div className="mb-2 flex items-center justify-between">
        <span className="tech-label text-cream/70">WPM THRESHOLD BY TIER</span>
        <span className="font-mono text-xs" style={{ color: "#FFE88A" }}>130 WPM AT SOVEREIGN</span>
      </div>
      <div className="overflow-x-auto">
        <BarChart width={WIDTH} height={HEIGHT} data={DATA} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#875327" strokeOpacity={0.25} strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}
            axisLine={{ stroke: "#875327" }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: "rgba(245,239,229,0.55)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#875327", fillOpacity: 0.15 }} />
          <Bar dataKey="wpm">
            {DATA.map((d) => (
              <Cell key={d.name} fill={d.accent} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </div>
  );
}
