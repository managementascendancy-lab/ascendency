import React from "react";

// Wraps text with the animated gold sheen overlay (matches the hero headline).
export default function SweepText({ children, className = "", as: Tag = "span", delay = 0 }) {
  return (
    <Tag className={`relative inline-block ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className="text-sweep pointer-events-none absolute inset-0"
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </span>
    </Tag>
  );
}
