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
import ConsistencyWaveformChart from "@/components/ConsistencyWaveformChart";
import PracticeCurveChart from "@/components/PracticeCurveChart";
import TierWpmChart from "@/components/TierWpmChart";
import AuthorBio from "@/components/AuthorBio";

const SITE_URL = "https://ascendancytyping.com";

// Frontmatter dates are plain "YYYY-MM-DD" (deliberately — that's also what
// renders in the visible byline row below, unchanged by this). Structured
// data needs a full ISO 8601 datetime with a timezone offset though, so this
// conversion happens only here, at the JSON-LD boundary, never touching the
// source value itself.
function toIsoDateTime(dateStr) {
  return dateStr ? `${dateStr}T00:00:00+00:00` : undefined;
}

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
  CONSISTENCY_WAVEFORM_CHART: ConsistencyWaveformChart,
  PRACTICE_CURVE_CHART: PracticeCurveChart,
  TIER_WPM_CHART: TierWpmChart,
  AUTHOR_BIO: AuthorBio,
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

  // guide.image is always a site-relative path today, but this also
  // tolerates an absolute URL without double-prefixing — kept defensive
  // since a future article image doesn't have to be a locally-hosted asset.
  // Shared between the JSON-LD image field and the <SEO> image prop below
  // (which drives og:image/twitter:image) so there's one conversion, not two.
  const absoluteImage = guide.image ? (/^https?:\/\//.test(guide.image) ? guide.image : `${SITE_URL}${guide.image}`) : undefined;

  // publisher.logo is deliberately omitted — there is no logo/favicon asset
  // anywhere in this project to point it at, and a fabricated placeholder
  // would be worse for validator/rich-result quality than leaving it out.
  const articleLd = {
    "@type": "Article",
    "@id": `${canonical}#article`,
    headline: guide.title,
    description: guide.description,
    datePublished: toIsoDateTime(guide.date),
    dateModified: toIsoDateTime(guide.lastUpdated || guide.date),
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: guide.author || "Ascendancy", url: `${SITE_URL}/about` },
    publisher: { "@type": "Organization", name: "Ascendancy" },
    ...(absoluteImage ? { image: absoluteImage } : {}),
  };

  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
    ],
  };

  // Only added when the article actually has a parsed FAQ section (see
  // extractFaq() in lib/guides.js) — question/answer text comes straight
  // from the rendered HTML, so this can never drift from what's on the page.
  const faqLd = guide.faq.length
    ? {
        "@type": "FAQPage",
        mainEntity: guide.faq.map((qa) => ({
          "@type": "Question",
          name: qa.question,
          acceptedAnswer: { "@type": "Answer", text: qa.answer },
        })),
      }
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [articleLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])],
  };

  return (
    <div className="py-14">
      <SEO
        title={`${guide.title} | Ascendancy`}
        description={guide.description}
        canonical={canonical}
        type="article"
        image={absoluteImage}
        publishedTime={toIsoDateTime(guide.date)}
        jsonLd={jsonLd}
      />

      <Reveal>
        <LocalizedLink to="/guides" className="tech-label text-bronze transition-colors hover:text-gold-bright">
          {t("article.allGuides")}
        </LocalizedLink>
        <div className="mt-4 flex items-center gap-3">
          {guide.author && <span className="tech-label text-gold-bright" data-testid="guide-article-byline">By {guide.author}</span>}
          {guide.author && (guide.date || guide.readTime) && <Sep tone="bronze" />}
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
