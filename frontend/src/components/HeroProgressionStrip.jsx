import React from "react";
import { HEROES } from "@/data/heroes";
import ClassificationMarker from "@/components/ClassificationMarker";
import { heroAvatarSrc } from "@/lib/heroImage";

// Illustrative strip for the classification guide — all 10 heroes in tier
// order, joined by a dashed progression line (ascension_ring visual
// language). Static/informational, not tied to any user's real progress.
export default function HeroProgressionStrip() {
  return (
    <div className="guide-embed" data-testid="hero-progression-strip">
      <div className="relative flex items-start gap-3 overflow-x-auto px-1 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-4 right-4 top-[38px] h-0 border-t border-dashed border-bronze/50"
        />
        {HEROES.map((h) => (
          <div key={h.id} className="relative z-10 flex w-[74px] shrink-0 flex-col items-center gap-2 text-center">
            <div
              className="h-12 w-12 overflow-hidden border bg-navy-dark"
              style={{ borderColor: h.accent }}
            >
              <img
                src={heroAvatarSrc(h.image)}
                alt={h.name}
                className="h-full w-full object-cover"
              />
            </div>
            <ClassificationMarker index={h.index} active size={22} />
            <span className="font-mono text-[9px] leading-tight tracking-wide text-cream/70">{h.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
