import React from "react";
import { useTranslation } from "react-i18next";

export default function SystemTicker() {
  const { t } = useTranslation();
  const MESSAGES = t("systemTicker.messages", { returnObjects: true });
  const line = [...MESSAGES, ...MESSAGES];
  return (
    <div
      className="w-full overflow-hidden border-b border-bronze/40 bg-navy-dark/90 py-1.5"
      data-testid="system-ticker"
    >
      <div className="flex w-max animate-ticker whitespace-nowrap will-change-transform">
        {line.map((m, i) => (
          <span key={i} className="mx-6 flex items-center gap-3 tech-label text-sage/80">
            <span className="h-1 w-1 bg-red" />
            {m}
            <span className="ml-3 inline-block h-1.5 w-1.5 rotate-45 bg-red/70" />
          </span>
        ))}
      </div>
    </div>
  );
}
