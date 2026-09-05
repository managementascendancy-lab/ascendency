import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { LocalizedLink, useLocalizedPath } from "@/i18n/links";
import Reveal from "@/components/Reveal";
import { Sep } from "@/components/Sep";
import { guideBySlug } from "@/lib/guides";
import HeroProgressionStrip from "@/components/HeroProgressionStrip";
import WpmProgressionChart from "@/components/WpmProgressionChart";
import AccuracySpeedTradeoffChart from "@/components/AccuracySpeedTradeoffChart";

const SITE_URL = "https://ascendancytyping.com";

// A guide's markdown body is rendered as one HTML blob (see lib/guides.js),
// which can't host live React components directly. A guide that wants one
// drops a standalone `{{MARKER}}` line in its .md source — marked renders
// that as `<p>{{MARKER}}</p>`, and splitGuideBody() below cuts the HTML
// string on that exact tag, swapping in the real component at that point.
// Adding a new embeddable component is just adding it to this map.
const COMPONENT_MARKERS = {
  HERO_PROGRESSION_STRIP: HeroProgressionStrip,
  WPM_PROGRESSION_CHART: WpmProgressionChart,
  ACCURACY_SPEED_CHART: AccuracySpeedTradeoffChart,
};

function splitGuideBody(html) {
  const pattern = /<p>\{\{([A-Z_]+)\}\}<\/p>/g;
  const parts = [];
  let lastIndex = 0;
  let key = 0;
  let match;
  while ((match = pattern.exec(html))) {
    const Component = COMPONENT_MARKERS[match[1]];
    if (!Component) continue; // unrecognized marker — leave the literal text in place
    if (match.index > lastIndex) {
      parts.push(<div key={key++} className="guide-markdown-block" dangerouslySetInnerHTML={{ __html: html.slice(lastIndex, match.index) }} />);
    }
    parts.push(<Component key={key++} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    parts.push(<div key={key++} className="guide-markdown-block" dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }} />);
  }
  return parts;
}

export default function GuideArticle() {
  const { t } = useTranslation("guides");
  const { slug } = useParams();
  const guide = guideBySlug(slug);
  const guidesHref = useLocalizedPath("/guides");

  if (!guide) return <Navigate to={guidesHref} replace />;

  const canonical = `${SITE_URL}/guides/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date || undefined,
    url: canonical,
    author: { "@type": "Organization", name: "Ascendancy" },
    publisher: { "@type": "Organization", name: "Ascendancy" },
  };

  return (
    <div className="py-14">
      <SEO
        title={`${guide.title} | Ascendancy`}
        description={guide.description}
        canonical={canonical}
        type="article"
        publishedTime={guide.date || undefined}
        jsonLd={jsonLd}
      />

      <Reveal>
        <LocalizedLink to="/guides" className="tech-label text-bronze transition-colors hover:text-gold-bright">
          {t("article.allGuides")}
        </LocalizedLink>
        <div className="mt-4 flex items-center gap-3">
          {guide.date && <span className="font-mono text-xs text-sage">{guide.date}</span>}
          {guide.date && guide.readTime && <Sep tone="bronze" />}
          {guide.readTime && <span className="tech-label text-bronze">{guide.readTime}</span>}
        </div>
        <h1 className="mt-2 font-display text-3xl font-700 tracking-tight text-cream display-outline sm:text-4xl">
          {guide.title}
        </h1>
      </Reveal>

      <Reveal delay={80}>
        <article className="guide-content mt-8 max-w-2xl" data-testid="guide-article-body">
          {splitGuideBody(guide.html)}
        </article>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-10 max-w-2xl border-t border-bronze/30 pt-8">
          <p className="font-body text-sm text-cream/70">{t("article.practicePrompt")}</p>
          <LocalizedLink
            to="/simulator"
            className="tech-label mt-2 inline-block text-gold-bright transition-colors hover:text-gold"
            data-testid="guide-article-simulate-cta"
          >
            {t("article.simulateCta")}
          </LocalizedLink>
        </div>
      </Reveal>
    </div>
  );
}
