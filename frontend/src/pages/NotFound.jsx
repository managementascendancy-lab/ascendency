import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import HudPanel from "@/components/HudPanel";
import AscButton from "@/components/AscButton";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-14">
      <SEO title={t("notFound.seo.title")} description={t("notFound.seo.description")} noindex />

      <Reveal>
        <HudPanel type="primary" label={t("notFound.label")} status={t("notFound.status")} bodyClassName="flex flex-col items-center gap-4 px-8 py-12 text-center sm:px-16">
          <div className="font-display text-7xl font-700 tracking-tight text-gold-bright display-outline sm:text-8xl">
            404
          </div>
          <p className="tech-label text-red">{t("notFound.subtitle")}</p>
          <p className="max-w-sm font-body text-sm text-cream/60">{t("notFound.description")}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <AscButton to="/" data-testid="notfound-home-btn">
              {t("notFound.homeButton")}
            </AscButton>
            <AscButton to="/simulator" data-testid="notfound-simulator-btn">
              {t("notFound.simulatorButton")}
            </AscButton>
          </div>
        </HudPanel>
      </Reveal>
    </div>
  );
}
