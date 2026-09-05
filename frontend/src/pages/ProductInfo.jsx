import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import AscButton from "@/components/AscButton";
import { Mark } from "@/components/Sep";
import { productBySlug } from "@/data/products";
import { accountPageBySlug } from "@/data/accountPages";
import { useLocalizedPath } from "@/i18n/links";

export default function ProductInfo() {
  const { t } = useTranslation("productInfo");
  const { slug } = useParams();
  const productRaw = productBySlug(slug) || accountPageBySlug(slug);
  const homeHref = useLocalizedPath("/");

  if (!productRaw) return <Navigate to={homeHref} replace />;

  const product = {
    ...productRaw,
    name: t(`pages.${productRaw.slug}.name`),
    eyebrow: t(`pages.${productRaw.slug}.eyebrow`),
    tagline: t(`pages.${productRaw.slug}.tagline`),
    summary: t(`pages.${productRaw.slug}.summary`),
    features: t(`pages.${productRaw.slug}.features`, { returnObjects: true }),
    ctaLabel: t(`pages.${productRaw.slug}.ctaLabel`),
  };

  return (
    <div className="py-14">
      <SEO
        title={`${product.name} | Ascendancy`}
        description={product.summary}
      />

      <Reveal>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-red">{product.code}</span>
          <span className="tech-label text-gold-bright">{product.eyebrow}</span>
        </div>
        <div className="relative mt-2 block">
          <h1 className="font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
            {product.name}
          </h1>
        </div>
        <p className="mt-3 font-display text-lg tracking-wide text-gold-bright">{product.tagline}</p>
      </Reveal>

      <Reveal delay={80}>
        <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-cream/75">{product.summary}</p>
      </Reveal>

      <Reveal delay={140}>
        <div className="mt-10 max-w-xl space-y-4 border border-bronze/40 bg-navy-dark p-6 panel-clip-primary">
          {product.features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <Mark tone="gold" />
              <p className="font-body text-sm leading-relaxed text-cream/80">{f}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="mt-10 flex flex-wrap gap-3">
          <AscButton variant="red" to={product.ctaTo} data-testid="product-cta-btn">
            {product.ctaLabel}
          </AscButton>
          <AscButton to="/" data-testid="product-home-btn">
            {t("backToHome")}
          </AscButton>
        </div>
      </Reveal>
    </div>
  );
}
