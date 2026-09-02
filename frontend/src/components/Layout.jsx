import React, { Suspense } from "react";
import { Outlet, Link } from "react-router-dom";
import AscendancyGrid from "@/components/AscendancyGrid";
import SystemTicker from "@/components/SystemTicker";
import Navbar from "@/components/Navbar";
import RouteLoader from "@/components/RouteLoader";
import { Sep } from "@/components/Sep";

const FOOTER_COLUMNS = [
  {
    heading: "PRODUCT",
    links: [
      { to: "/product/training-simulator", label: "Training Simulator" },
      { to: "/product/classification-archive", label: "Classification Archive" },
      { to: "/product/performance-network", label: "Performance Network" },
      { to: "/product/achievements", label: "Achievements" },
      { to: "/guides", label: "Guides" },
    ],
  },
  {
    heading: "ACCOUNT",
    links: [
      { to: "/account/ascendant-console", label: "Ascendant Console" },
      { to: "/account/sign-in-register", label: "Sign In / Register" },
    ],
  },
  {
    heading: "LEGAL",
    links: [
      { to: "/privacy-policy", label: "Privacy Policy" },
      { to: "/terms-of-service", label: "Terms of Service" },
    ],
  },
];

export default function Layout() {
  return (
    <div className="relative min-h-screen hud-frame">
      <AscendancyGrid />
      <SystemTicker />
      <Navbar />
      <main className="mx-auto max-w-[1040px] px-4 sm:px-8">
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* reserved ad slot — drop the AdSense <ins> unit in here */}
      <div className="mx-auto mt-16 flex min-h-[120px] max-w-[1040px] items-center justify-center border border-dashed border-bronze/30 px-4 sm:px-8" data-testid="ad-slot">
        <span className="tech-label text-bronze/60">ADVERTISEMENT</span>
      </div>

      <footer className="mx-auto mt-16 max-w-[1040px] border-t border-bronze/30 px-4 py-10 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display text-lg font-700 tracking-[0.12em] text-cream">
              ASCEND<span className="text-red">ANCY</span>
            </div>
            <p className="mt-3 max-w-[220px] font-body text-xs leading-relaxed text-cream/60">
              Measure your typing speed, accuracy and consistency. Unlock hero classifications and climb the network.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="tech-label text-bronze">{col.heading}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="font-body text-xs text-cream/70 transition-colors hover:text-gold-bright">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-bronze/20 pt-6 sm:flex-row sm:items-center">
          <div className="tech-label text-gold-bright">TYPE. TRAIN. ASCEND.<Sep tone="red" />ASCENDANCY INITIATIVE © 2026</div>
          <div className="flex items-center gap-4">
            <a href="mailto:support@ascendancy.io" className="font-mono text-[11px] text-cream/50 transition-colors hover:text-gold-bright">
              support@ascendancy.io
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
