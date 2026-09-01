import React, { useEffect, useState } from "react";

const LINE1 = "HOW FAST";
const LINE2A = "CAN YOU ";
const LINE2B = "TYPE?";
const TOTAL = LINE1.length + LINE2A.length + LINE2B.length;

const H1_CLASS =
  "font-display text-5xl font-700 leading-[0.95] tracking-tight text-cream display-outline sm:text-6xl lg:text-7xl";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Typewriter reveal of the hero headline with a blinking caret.
export default function TypeHeading() {
  const [idx, setIdx] = useState(prefersReduced ? TOTAL : 0);
  const done = idx >= TOTAL;

  useEffect(() => {
    if (prefersReduced) return;
    let raf;
    const startAt = performance.now() + 250;
    const perChar = 52;
    const tick = (now) => {
      const elapsed = now - startAt;
      if (elapsed >= 0) {
        const n = Math.min(TOTAL, Math.floor(elapsed / perChar));
        setIdx(n);
        if (n >= TOTAL) return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s1 = LINE1.slice(0, Math.min(idx, LINE1.length));
  const rem2 = Math.max(0, idx - LINE1.length);
  const s2a = LINE2A.slice(0, Math.min(rem2, LINE2A.length));
  const rem2b = Math.max(0, rem2 - LINE2A.length);
  const s2b = LINE2B.slice(0, Math.min(rem2b, LINE2B.length));

  return (
    <div className="relative mt-6 inline-block overflow-hidden">
      <h1 className={H1_CLASS} aria-label="How fast can you type?">
        <span aria-hidden="true">
          {s1}
          <br />
          {s2a}
          <span className="text-red">{s2b}</span>
        </span>
      </h1>

      {/* golden light streak — passes over the title as light (does not recolor letters) */}
      {done && <span aria-hidden="true" className="head-shine" />}
    </div>
  );
}
