import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import { ACHIEVEMENTS } from "@/data/achievements";
import { useAuth } from "@/context/AuthContext";
import { Lock, Check } from "lucide-react";
import { LocalizedLink } from "@/i18n/links";

const tierColor = { sage: "#8AA073", gold: "#F5C542", red: "#DF350D" };

export default function Achievements() {
  const { t } = useTranslation(["achievements", "achievementsData"]);
  const { user } = useAuth();
  const unlocked = new Set(user?.achievements || []);

  return (
    <div className="py-14">
      <SEO title={t("achievements:seo.title")} description={t("achievements:seo.description")} />

      <Reveal>
        <span className="tech-label text-gold-bright">{t("achievements:overline")}</span>
        <h1 className="mt-2 font-display text-5xl font-700 tracking-tight text-cream display-outline sm:text-6xl">
          {t("achievements:heading")}
        </h1>
      </Reveal>

      {!user && (
        <Reveal delay={80}>
          <div className="mt-6 border border-bronze/40 bg-navy-dark px-4 py-3 font-mono text-xs text-sage">
            {"> "}<LocalizedLink to="/auth" className="text-gold-bright">{t("achievements:authenticate")}</LocalizedLink>{t("achievements:authPromptSuffix")}
          </div>
        </Reveal>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const has = unlocked.has(a.id);
          const color = tierColor[a.tier];
          return (
            <Reveal key={a.id} delay={(i % 3) * 80}>
              <div
                data-testid={`achievement-${a.id}`}
                className={`relative overflow-hidden border p-5 panel-clip-primary transition-colors ${
                  has ? "border-bronze/60 bg-navy-dark" : "border-navy bg-navy-dark/60"
                }`}
                style={has ? { boxShadow: `inset 0 0 0 1px ${color}22` } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center clip-hex"
                    style={{ border: `1px solid ${has ? color : "#0B0F2A"}`, background: "#070A18" }}
                  >
                    {has ? <Check size={16} color={color} /> : <Lock size={14} color="#875327" />}
                  </div>
                  <span className="tech-label" style={{ color: has ? color : "#875327" }}>
                    {has ? t("achievements:unlocked") : t("achievements:locked")}
                  </span>
                </div>
                <h3 className={`mt-4 font-display text-lg font-700 tracking-wide ${has ? "text-cream" : "text-cream/40"}`}>
                  {t(`achievementsData:${a.id}.name`)}
                </h3>
                <p className={`mt-1 font-body text-sm ${has ? "text-cream/60" : "text-cream/30"}`}>
                  {t(`achievementsData:${a.id}.desc`)}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
