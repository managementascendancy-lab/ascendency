import React from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import { Sep } from "@/components/Sep";
import { GUIDES } from "@/lib/guides";

export default function Guides() {
  return (
    <div className="py-14">
      <SEO
        title="Typing Guides & Tips | Ascendancy"
        description="Practical guides on typing speed, accuracy, ergonomics and the Ascendancy classification system."
      />

      <Reveal>
        <span className="tech-label text-gold-bright">RESOURCES<Sep tone="gold" />GUIDES</span>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
          TRAINING GUIDES
        </h1>
        <p className="mt-3 max-w-xl font-body text-base text-cream/70">
          Practical, no-fluff guides on typing speed, accuracy, ergonomics and how the Ascendancy classification
          system actually works.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {GUIDES.map((g, i) => (
          <Reveal key={g.slug} delay={i * 60}>
            <Link
              to={`/guides/${g.slug}`}
              data-testid={`guide-card-${g.slug}`}
              className="group relative block h-full border border-bronze/40 bg-navy-dark p-6 transition-all duration-300 hover:border-gold-bright panel-clip-primary"
            >
              <div className="flex items-center justify-between">
                {g.date && <span className="font-mono text-[10px] text-sage">{g.date}</span>}
                {g.readTime && <span className="tech-label text-bronze">{g.readTime}</span>}
              </div>
              <h2 className="mt-4 font-display text-xl font-700 tracking-wide text-cream transition-colors group-hover:text-gold-bright">
                {g.title}
              </h2>
              <p className="mt-2 font-body text-sm text-cream/70">{g.description}</p>
              <div className="mt-5 tech-label text-red">READ GUIDE →</div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
