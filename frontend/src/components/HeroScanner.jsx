import React from "react";

export default function HeroScanner({
  image,
  subject = "UNREGISTERED",
  status = "AWAITING SIMULATION",
}) {
  return (
    <div className="relative w-full" data-testid="hero-scanner">
      <div className="relative aspect-[4/5] w-full overflow-hidden panel-clip-primary border border-bronze/60 bg-navy">
        {/* hero image */}
        <img
          src={image}
          alt="Ascendancy scan subject"
          className="h-full w-full object-cover object-center opacity-90"
          style={{ filter: "contrast(1.05) saturate(0.9)" }}
        />
        {/* navy overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/30 to-navy-dark/60" />

        {/* rotating scan rings */}
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" width="360" height="360" viewBox="0 0 360 360">
          <circle cx="180" cy="180" r="150" fill="none" stroke="#C88900" strokeWidth="1" strokeDasharray="4 10" opacity="0.5" />
          <circle cx="180" cy="180" r="120" fill="none" stroke="#875327" strokeWidth="1" opacity="0.5" />
        </svg>
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-rev" width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="110" fill="none" stroke="#DF350D" strokeWidth="1" strokeDasharray="2 20" opacity="0.55" />
        </svg>

        {/* targeting crosshair */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gold/20" />
        <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-gold/20" />

        {/* scan beam */}
        <div
          className="absolute left-0 top-0 h-full w-24"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(245,197,66,0.18), transparent)",
            animation: "scan-x 3.4s cubic-bezier(0.4,0,0.2,1) infinite",
          }}
        />

        {/* corner data markers */}
        <div className="absolute left-3 top-3 tech-label text-gold-bright">ASCENDANCY SCAN</div>
        <div className="absolute right-3 top-3 tech-label text-sage">SYS::ONLINE</div>
        <div className="absolute bottom-3 left-3 font-mono text-[10px] text-cream/70">
          LAT 40.71 · LON -74.00
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-2 tech-label text-red">
          <span className="h-1.5 w-1.5 animate-pulse-ring bg-red" /> ACTIVE
        </div>

        {/* small targeting brackets */}
        <span className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 border-l-2 border-t-2 border-red/70" />
        <span className="absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 border-b-2 border-r-2 border-red/70" />
      </div>

      {/* scan readout strip */}
      <div className="mt-3 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4">
        {[
          ["SUBJECT", subject, "text-cream"],
          ["STATUS", status, "text-red"],
          ["SYSTEM", "ONLINE", "text-sage"],
          ["SECURITY", "ACTIVE", "text-gold-bright"],
        ].map(([k, v, c]) => (
          <div key={k} className="bg-navy-dark px-3 py-2">
            <div className="tech-label text-highlight">{k}</div>
            <div className={`mt-1 font-mono text-[11px] ${c}`}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
