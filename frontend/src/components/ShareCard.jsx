import React, { forwardRef } from "react";

// Offscreen-rendered card captured to an image for Instagram/story sharing.
const ShareCard = forwardRef(function ShareCard({ hero, result }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 375,
        height: 667,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#070A18",
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#F5EFE5",
      }}
    >
      <img
        src={hero.image}
        alt={hero.name}
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, #070A18 8%, rgba(7,10,24,0.35) 45%, rgba(7,10,24,0.55) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 28, left: 28, fontSize: 14, letterSpacing: 4, fontWeight: 700 }}>
        ASCEND<span style={{ color: "#DF350D" }}>ANCY</span>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 28px 36px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#F5C542", marginBottom: 4 }}>CLASSIFICATION COMPLETE</div>
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.05, marginBottom: 14 }}>{hero.name}</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          {[
            ["WPM", Math.round(result.wpm)],
            ["ACC", `${result.accuracy.toFixed(0)}%`],
            ["SCORE", result.score],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "rgba(7,10,24,0.65)", border: "1px solid rgba(135,83,39,0.5)", padding: "8px 14px", minWidth: 74 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#FFE88A" }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#F5C542" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#8AA073" }}>TYPE. TRAIN. ASCEND.</div>
      </div>
    </div>
  );
});

export default ShareCard;
