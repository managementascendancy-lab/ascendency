import React, { forwardRef } from "react";

// Offscreen-rendered card captured to an image for Instagram/story sharing
// and for the profile's hero certificate download. Overall card is 9:16
// (405x720 — Instagram Story proportions), but the hero photo itself is
// framed in its own 4:3 box rather than stretched/cropped across the full
// 9:16 frame — the stats panel gets its own space below the photo instead
// of overlaying it, so a square source portrait never has to fill an
// aspect ratio it wasn't composed for.
const IMAGE_HEIGHT = 540; // 405 * 4/3 — 4:3 portrait box
const CARD_HEIGHT = 720; // 405 * 16/9 — 9:16 overall

const ShareCard = forwardRef(function ShareCard({ hero, result }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 405,
        height: CARD_HEIGHT,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#070A18",
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#F5EFE5",
      }}
    >
      {/* hero photo — its own 4:3 box, not the full 9:16 card */}
      <div style={{ position: "relative", width: "100%", height: IMAGE_HEIGHT, overflow: "hidden" }}>
        <img
          src={hero.image}
          alt={hero.name}
          crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #070A18 0%, rgba(7,10,24,0) 22%)",
          }}
        />
        <div style={{ position: "absolute", top: 24, left: 24, fontSize: 14, letterSpacing: 4, fontWeight: 700 }}>
          ASCEND<span style={{ color: "#DF350D" }}>ANCY</span>
        </div>
      </div>

      {/* stats panel — its own space below the photo, not an overlay on it */}
      <div style={{ position: "absolute", top: IMAGE_HEIGHT, left: 0, right: 0, bottom: 0, padding: "14px 26px 12px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#F5C542", marginBottom: 5 }}>CLASSIFICATION COMPLETE</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.05, marginBottom: 10 }}>{hero.name}</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          {[
            ["WPM", Math.round(result.wpm)],
            ["ACC", `${result.accuracy.toFixed(0)}%`],
            ["SCORE", result.score],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "rgba(245,239,229,0.04)", border: "1px solid rgba(135,83,39,0.5)", padding: "6px 12px", minWidth: 72 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#FFE88A" }}>{k}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#F5C542" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#8AA073" }}>TYPE. TRAIN. ASCEND.</div>
      </div>
    </div>
  );
});

export default ShareCard;
