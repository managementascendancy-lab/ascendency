import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import HeroCard from "@/components/HeroCard";
import Reveal from "@/components/Reveal";
import AscButton from "@/components/AscButton";
import ClassificationMarker from "@/components/ClassificationMarker";
import { HEROES } from "@/data/heroes";
import { useAuth } from "@/context/AuthContext";
import { Sep } from "@/components/Sep";

function unlockProgress(hero, user) {
  if (!user || hero.index === 0) return 100;
  const w = hero.minWpm ? Math.min(user.bestWpm / hero.minWpm, 1) : 1;
  const a = hero.minAccuracy ? Math.min(user.bestAccuracy / hero.minAccuracy, 1) : 1;
  const c = hero.minConsistency ? Math.min(user.bestConsistency / hero.minConsistency, 1) : 1;
  return Math.round(Math.min(w, a, c) * 100);
}

export default function Ascendancy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const highest = user?.highestHeroIndex ?? 0;

  return (
    <div className="py-14">
      <SEO title="The Ascendancy — Hero Archive | Ascendancy" description="Ten heroes. One path to ascension. Explore the Ascendancy hero classification archive." />

      <Reveal>
        <span className="tech-label text-gold-bright">HERO ARCHIVE</span>
        <div className="relative mt-2 block">
          <h1 className="font-display text-5xl font-700 tracking-tight text-cream display-outline sm:text-6xl">
            THE ASCENDANCY
          </h1>
          <span
            aria-hidden="true"
            className="text-sweep pointer-events-none absolute inset-0 font-display text-5xl font-700 tracking-tight sm:text-6xl"
          >
            THE ASCENDANCY
          </span>
        </div>
        <p className="mt-4 max-w-xl font-body text-cream/70">
          Ten heroes. One path to ascension. Your speed determines your class. Your accuracy determines how far you rise.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HEROES.map((h, i) => {
          const locked = h.index > highest;
          return (
            <Reveal key={h.id} delay={(i % 4) * 70}>
              <HeroCard
                hero={h}
                locked={locked}
                active={user && h.index === highest}
                progress={unlockProgress(h, user)}
                onClick={() => setSelected(h)}
              />
            </Reveal>
          );
        })}
      </div>

      {/* detail overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/90 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          data-testid="hero-detail-overlay"
        >
          <div
            className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto panel-primary border border-gold-bright/50 sm:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square sm:aspect-auto">
              <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent" />
              <div className="absolute left-3 top-3">
                <ClassificationMarker index={selected.index} active size={40} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gold-bright">HERO_{String(selected.index).padStart(2, "0")}</span>
                <button onClick={() => setSelected(null)} className="tech-label text-red" data-testid="hero-detail-close">
                  [ CLOSE ]
                </button>
              </div>
              <h2 className="mt-3 font-display text-4xl font-700 tracking-wide text-cream">{selected.name}</h2>
              <p className="tech-label mt-1 text-gold">{selected.title}<Sep tone="gold" />{selected.class}</p>
              <p className="mt-4 font-body text-sm text-cream/70">{selected.description}</p>

              <div className="mt-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-bronze/30 pb-1">
                  <span className="text-gold-bright">PERSONALITY</span>
                  <span className="text-cream/80">{selected.personality}</span>
                </div>
                <div className="flex justify-between border-b border-bronze/30 pb-1">
                  <span className="text-gold-bright">POWER</span>
                  <span className="max-w-[60%] text-right text-cream/80">{selected.power}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-px border border-bronze/40 bg-bronze/40">
                {[
                  ["WPM", `${selected.minWpm}+`, "text-gold-bright"],
                  ["ACC", `${selected.minAccuracy}%`, "text-sage"],
                  ["CNS", `${selected.minConsistency}%`, "text-cream"],
                ].map(([k, v, c]) => (
                  <div key={k} className="bg-navy-dark px-3 py-2 text-center">
                    <div className="tech-label text-highlight">{k}</div>
                    <div className={`mt-1 font-mono text-sm ${c}`}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <AscButton variant="red" onClick={() => navigate("/simulator")} data-testid="hero-detail-simulate">
                  SIMULATE TO CLASSIFY →
                </AscButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
