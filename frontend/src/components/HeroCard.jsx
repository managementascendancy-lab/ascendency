import React from "react";
import ClassificationMarker from "@/components/ClassificationMarker";
import { useSound } from "@/context/SoundContext";
import { heroSrcSet } from "@/lib/heroImage";

export default function HeroCard({ hero, locked = false, active = false, progress = 0, onClick }) {
  const sound = useSound();
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => sound?.play("hover")}
      data-testid={`hero-card-${hero.id}`}
      className={`group relative block w-full overflow-hidden text-left panel-clip-primary border bg-navy-dark transition-all duration-300 ${
        active ? "border-gold-bright" : "border-bronze/50 hover:border-gold"
      }`}
      style={active ? { boxShadow: "0 0 26px rgba(245,197,66,0.25)" } : undefined}
    >
      {/* image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <img
          src={hero.image}
          srcSet={heroSrcSet(hero.image)}
          sizes="(min-width: 1280px) 240px, (min-width: 1024px) 330px, (min-width: 640px) 490px, 90vw"
          alt={hero.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            locked ? "grayscale brightness-[0.28]" : "brightness-90 group-hover:brightness-100"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/30 to-transparent" />
        {/* scan line on hover */}
        <div
          className="absolute left-0 top-0 h-full w-16 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "linear-gradient(90deg,transparent,rgba(245,197,66,0.2),transparent)", animation: "scan-x 2.4s linear infinite" }}
        />

        {/* top data row */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="font-mono text-[10px] text-gold-bright">HERO_{String(hero.index).padStart(2, "0")}</span>
          <ClassificationMarker index={hero.index} locked={locked} active={active} size={34} />
        </div>

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span className="tech-label text-red">PROFILE LOCKED</span>
            <span className="font-mono text-[10px] text-cream/60">CLASSIFICATION REQUIRED</span>
          </div>
        )}
      </div>

      {/* info */}
      <div className="relative border-t border-bronze/40 p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-700 tracking-wide text-cream">{hero.name}</h3>
          <span className="tech-label text-highlight">{hero.class}</span>
        </div>
        <p className="tech-label mt-0.5 text-gold">{hero.title}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-bronze/30 pt-3">
          <div>
            <div className="tech-label text-highlight">WPM</div>
            <div className="font-mono text-sm text-gold-bright">{hero.minWpm}+</div>
          </div>
          <div>
            <div className="tech-label text-highlight">ACC</div>
            <div className="font-mono text-sm text-sage">{hero.minAccuracy}%</div>
          </div>
          <div>
            <div className="tech-label text-highlight">CNS</div>
            <div className="font-mono text-sm text-cream/80">{hero.minConsistency}%</div>
          </div>
        </div>

        {locked ? (
          <div className="mt-3">
            <div className="flex items-center justify-between tech-label">
              <span className="text-gold-bright">UNLOCK PROGRESS</span>
              <span className="text-red">{Math.round(progress)}%</span>
            </div>
            <div className="mt-1 h-1 w-full bg-bronze/30">
              <div className="h-full bg-red transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 tech-label text-sage">
            <span className="h-1.5 w-1.5 bg-sage" /> CLASSIFICATION AVAILABLE
          </div>
        )}
      </div>
    </button>
  );
}
