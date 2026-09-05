import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

// ASCENDANCY living background: perspective grid, rotating geometry,
// drifting energy fields, particles, vertical scan sweep + coordinate frame.
export default function AscendancyGrid() {
  const { t } = useTranslation();
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${40 + Math.random() * 60}%`,
        duration: `${8 + Math.random() * 10}s`,
        delay: `${Math.random() * 10}s`,
        color: i % 4 === 0 ? "var(--red)" : i % 3 === 0 ? "var(--gold-bright)" : "var(--gold)",
        size: Math.random() > 0.8 ? 3 : 2,
      })),
    []
  );

  const glowParticles = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 12 + Math.random() * 18,
        duration: `${14 + Math.random() * 14}s`,
        delay: `${Math.random() * 14}s`,
        opacity: 0.12 + Math.random() * 0.14,
      })),
    []
  );

  const centerGlowParticles = useMemo(
    () =>
      Array.from({ length: 150 }).map(() => ({
        left: `${32 + Math.random() * 36}%`,
        top: `${32 + Math.random() * 36}%`,
        size: 3 + Math.random() * 5,
        duration: `${10 + Math.random() * 12}s`,
        delay: `${Math.random() * 12}s`,
        opacity: 0.19 + Math.random() * 0.16,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-navy-dark">
      {/* deep base vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, #0B0F2A 0%, #070A18 60%, #05070F 100%)" }}
      />

      {/* dimmed hero group backdrop */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: "url(/bg-heroes.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
      />

      {/* animated coordinate grid */}
      <div className="absolute inset-0 asc-grid-animated opacity-50" />

      {/* perspective holo-deck floor + ceiling for depth */}
      <div className="persp-floor opacity-40" />
      <div className="persp-ceiling opacity-25" />

      {/* radar sweep behind center geometry */}
      <div
        className="radar-sweep absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{ maskImage: "radial-gradient(circle, #000 0%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 65%)" }}
      />

      {/* secondary fine grid drifting opposite */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(200,137,0,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(200,137,0,0.18) 1px, transparent 1px)",
          backgroundSize: "176px 176px",
          animation: "grid-pan 26s linear infinite reverse",
        }}
      />

      {/* large rotating concentric geometry */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
        style={{ animation: "ring-rotate 120s linear infinite" }}
      >
        <svg width="1200" height="1200" viewBox="0 0 1200 1200">
          <circle cx="600" cy="600" r="560" fill="none" stroke="#875327" strokeWidth="1" strokeDasharray="2 26" />
          <circle cx="600" cy="600" r="440" fill="none" stroke="#C88900" strokeWidth="1" strokeDasharray="60 40" />
          <circle cx="600" cy="600" r="300" fill="none" stroke="#875327" strokeWidth="1" />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={600 + Math.cos(a) * 300}
                y1={600 + Math.sin(a) * 300}
                x2={600 + Math.cos(a) * 320}
                y2={600 + Math.sin(a) * 320}
                stroke="#C88900"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* counter-rotating inner ring */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.10]"
        style={{ animation: "ring-rotate 80s linear infinite reverse" }}
      >
        <svg width="640" height="640" viewBox="0 0 640 640">
          <circle cx="320" cy="320" r="300" fill="none" stroke="#DF350D" strokeWidth="1" strokeDasharray="1 30" />
        </svg>
      </div>

      {/* pulsing ambient energy fields */}
      <div
        className="absolute -top-40 -left-32 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #DF350D 0%, transparent 70%)", animation: "glow-pulse 9s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[-220px] right-[-180px] h-[680px] w-[680px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #C88900 0%, transparent 70%)", animation: "glow-pulse 11s ease-in-out infinite 2s" }}
      />
      <div
        className="absolute top-1/3 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #8AA073 0%, transparent 70%)", animation: "glow-pulse 14s ease-in-out infinite 1s", opacity: 0.08 }}
      />

      {/* drifting circuit diagonal lines */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ animation: "drift-diag 30s ease-in-out infinite alternate" }}>
        <svg width="100%" height="100%" preserveAspectRatio="none">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1={`${i * 14}%`} y1="0" x2={`${i * 14 + 40}%`} y2="100%" stroke="#C88900" strokeWidth="1" />
          ))}
        </svg>
      </div>

      {/* floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="asc-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* muted golden glow particles */}
      {glowParticles.map((p, i) => (
        <span
          key={i}
          className="asc-glow-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            "--glow-op": p.opacity,
          }}
        />
      ))}

      {/* extra small glow particles concentrated in the center */}
      {centerGlowParticles.map((p, i) => (
        <span
          key={i}
          className="asc-glow-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            "--glow-op": p.opacity,
          }}
        />
      ))}

      {/* vertical scan sweep */}
      <div className="scan-sweep" />

      {/* scanline texture */}
      <div className="absolute inset-0 bg-scanlines opacity-40" />

      {/* readability scrim — mutes decoration so text stays crisp */}
      <div className="absolute inset-0" style={{ background: "rgba(7,10,24,0.42)" }} />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(90% 70% at 35% 42%, rgba(3,5,15,0.55) 0%, transparent 60%)" }}
      />

      {/* corner coordinate markers */}
      <div className="absolute left-6 top-28 tech-label opacity-40" style={{ animation: "flicker-op 7s linear infinite" }}>
        {t("grid.coordinates")}
      </div>
      <div className="absolute right-6 top-28 tech-label opacity-40">{t("grid.gridCore")}</div>
      <div className="absolute bottom-6 left-6 tech-label opacity-40">{t("grid.sectorSignal")}</div>
      <div className="absolute bottom-6 right-6 tech-label opacity-40" style={{ animation: "flicker-op 9s linear infinite" }}>
        {t("grid.signalStable")}
      </div>

      {/* drifting data lines */}
      {[
        { top: "22%", dur: "9s", delay: "0s" },
        { top: "58%", dur: "13s", delay: "3s" },
        { top: "80%", dur: "11s", delay: "6s" },
      ].map((d, i) => (
        <span key={i} className="data-line" style={{ top: d.top, animationDuration: d.dur, animationDelay: d.delay }} />
      ))}

      {/* left-side HUD arc gauge */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 opacity-20" width="140" height="380" viewBox="0 0 140 380">
        <path d="M 20 30 A 160 160 0 0 1 20 350" fill="none" stroke="#875327" strokeWidth="1" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (-Math.PI / 2.4) + (i / 15) * (Math.PI * 0.83);
          const cx = 20 + Math.cos(a) * -160 + 160;
          const y = 190 + Math.sin(a) * 160;
          return <line key={i} x1={18} y1={y} x2={i % 4 === 0 ? 34 : 26} y2={y} stroke={i % 4 === 0 ? "#C88900" : "#875327"} strokeWidth="1" />;
        })}
      </svg>

      {/* right-side signal bars */}
      <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-25">
        {[8, 14, 20, 12, 24, 16, 10].map((h, i) => (
          <span key={i} className="bg-gold" style={{ width: h, height: 2, animation: `flicker-op ${4 + i}s linear infinite` }} />
        ))}
      </div>

      {/* alignment lines */}
      <div className="absolute left-[8%] top-0 h-full w-px bg-bronze/10" />
      <div className="absolute right-[12%] top-0 h-full w-px bg-bronze/10" />
    </div>
  );
}
