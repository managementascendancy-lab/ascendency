import React from "react";

// Creative label divider — a small angular diamond used instead of "//".
export const Sep = ({ tone = "red", className = "" }) => {
  const color =
    tone === "gold" ? "bg-gold-bright" : tone === "sage" ? "bg-sage" : tone === "bronze" ? "bg-bronze" : "bg-red";
  return (
    <span
      aria-hidden="true"
      className={`mx-2 inline-block h-[6px] w-[6px] rotate-45 ${color} align-middle ${className}`}
    />
  );
};

// Prefix marker — chevron-style angle used before a value (replaces leading "//").
export const Mark = ({ tone = "red", className = "" }) => {
  const color =
    tone === "gold" ? "border-gold-bright" : tone === "sage" ? "border-sage" : "border-red";
  return (
    <span
      aria-hidden="true"
      className={`mr-2 inline-block h-2 w-2 rotate-45 border-b border-r ${color} align-middle ${className}`}
    />
  );
};

export default Sep;
