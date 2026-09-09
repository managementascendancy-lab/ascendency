import React from "react";

// Hexagonal classification marker. locked dims it.
export default function ClassificationMarker({ index = 0, locked = false, size = 44, active = false }) {
  const roman =
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"][
      index
    ] || "I";
  const border = locked ? "#0B0F2A" : active ? "#F5C542" : "#C88900";
  const text = locked ? "#875327" : active ? "#F5C542" : "#C88900";
  // Original I-X tops out at 4 characters ("VIII"), which text-sm was sized
  // for. XI-XX adds "XVIII" (5 characters, the longest in the set) — scale
  // the font down for it specifically so it doesn't overflow/wrap inside
  // the small hex marker instead of leaving font size fixed.
  const fontSize = roman.length >= 5 ? Math.round(size * 0.22) : Math.round(size * 0.32);
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
      <span className="font-mono font-700" style={{ color: text, fontSize }}>
        {roman}
      </span>
    </div>
  );
}
