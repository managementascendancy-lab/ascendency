import React from "react";

// Hexagonal classification marker. locked dims it.
export default function ClassificationMarker({ index = 0, locked = false, size = 44, active = false }) {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][index] || "I";
  const border = locked ? "#0B0F2A" : active ? "#F5C542" : "#C88900";
  const text = locked ? "#875327" : active ? "#F5C542" : "#C88900";
  return (
    <div
      className="relative inline-flex items-center justify-center clip-hex"
      style={{
        width: size,
        height: size,
        background: "#070A18",
        border: `1px solid ${border}`,
        boxShadow: active ? `0 0 12px ${border}66` : "none",
      }}
      data-testid="classification-marker"
    >
      <div
        className="absolute inset-[3px] clip-hex"
        style={{ border: `1px solid ${border}55` }}
      />
      <span className="font-mono text-sm font-700" style={{ color: text }}>
        {roman}
      </span>
    </div>
  );
}
