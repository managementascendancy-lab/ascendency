import React from "react";
import HudPanel from "@/components/HudPanel";

// Route-level Suspense fallback. `data-loading="true"` is the convention
// every lazy-loaded fallback in the app uses so scripts/prerender.js can
// wait for all in-flight chunks to resolve before snapshotting a page.
export default function RouteLoader() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center py-20"
      data-loading="true"
      data-testid="route-loader"
    >
      <HudPanel
        type="system"
        label="ASCENDANCY"
        status="LOADING"
        className="w-full max-w-xs"
        bodyClassName="flex flex-col items-center gap-3 p-8"
      >
        <span className="h-2 w-2 animate-pulse-ring bg-gold-bright" />
        <span className="tech-label text-cream/70">INITIALIZING MODULE</span>
      </HudPanel>
    </div>
  );
}
