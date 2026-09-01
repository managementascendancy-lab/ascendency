import React from "react";
import { Outlet } from "react-router-dom";
import AscendancyGrid from "@/components/AscendancyGrid";
import SystemTicker from "@/components/SystemTicker";
import Navbar from "@/components/Navbar";
import { Sep } from "@/components/Sep";

export default function Layout() {
  return (
    <div className="relative min-h-screen hud-frame">
      <AscendancyGrid />
      <SystemTicker />
      <Navbar />
      <main className="mx-auto max-w-[1040px] px-4 sm:px-8">
        <Outlet />
      </main>
      <footer className="mx-auto mt-24 max-w-[1040px] border-t border-bronze/30 px-4 py-8 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="font-display text-lg font-700 tracking-[0.12em] text-cream">
            ASCEND<span className="text-red">ANCY</span>
          </div>
          <div className="tech-label text-gold-bright">TYPE. TRAIN. ASCEND.<Sep tone="red" />ASCENDANCY INITIATIVE © 2026</div>
        </div>
      </footer>
    </div>
  );
}
