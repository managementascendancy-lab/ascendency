import React from "react";

// Thin animated signal line representing system activity.
// intensity: 0 idle, 1 normal, 2 high, 3 extreme. error flashes red.
export default function NeuralTrace({ intensity = 1, error = false, className = "" }) {
  const speed = ["4s", "2.4s", "1.4s", "0.8s"][Math.min(intensity, 3)];
  const color = error ? "#DF350D" : intensity >= 3 ? "#F5C542" : "#C88900";
  return (
    <div
      className={`relative h-[2px] w-full overflow-hidden bg-bronze/25 ${className}`}
      aria-hidden="true"
      data-testid="neural-trace"
    >
      <div
        className="absolute top-0 h-full w-16"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: `scan-x ${speed} cubic-bezier(0.4,0,0.2,1) infinite`,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}
