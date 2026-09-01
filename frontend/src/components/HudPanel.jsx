import React from "react";

// Custom ASCENDANCY panel. type: primary | secondary | system
export default function HudPanel({
  type = "primary",
  label,
  status,
  className = "",
  bodyClassName = "",
  children,
  ...rest
}) {
  const base = {
    primary: "panel-primary panel-scanlines",
    secondary: "panel-secondary",
    system: "panel-system panel-scanlines",
  }[type];

  return (
    <div className={`relative ${base} ${className}`} {...rest}>
      {/* tactical corner brackets */}
      <span className="pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 border-l border-t border-gold/60" />
      <span className="pointer-events-none absolute right-0 top-0 z-10 h-4 w-4 border-r border-t border-gold-bright/70" />
      <span className="pointer-events-none absolute bottom-0 left-0 z-10 h-4 w-4 border-b border-l border-gold-bright/70" />
      <span className="pointer-events-none absolute bottom-0 right-0 z-10 h-4 w-4 border-b border-r border-gold/60" />

      {/* edge tick marks */}
      <span className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-bronze/50" />
      <span className="pointer-events-none absolute left-1/2 bottom-0 h-1.5 w-px -translate-x-1/2 bg-bronze/50" />

      {(label || status) && (
        <div className="relative z-10 flex items-center justify-between border-b border-bronze/40 px-4 py-2">
          <div className="flex items-center gap-2">
            {/* status LEDs */}
            <span className="flex gap-1">
              <span className="h-1 w-1 bg-red" />
              <span className="h-1 w-1 bg-gold" />
              <span className="h-1 w-1 bg-sage" />
            </span>
            {label && <span className="tech-label">{label}</span>}
          </div>
          {status && (
            <span className="flex items-center gap-2 tech-label text-sage">
              <span className="h-1.5 w-1.5 animate-pulse-ring bg-sage" />
              {status}
            </span>
          )}
        </div>
      )}
      <div className={`relative z-10 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
