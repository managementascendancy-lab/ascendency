import React, { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import PerformanceStats from "@/components/PerformanceStats";
import AscButton from "@/components/AscButton";
import NeuralTrace from "@/components/NeuralTrace";
import Reveal from "@/components/Reveal";
import ClassificationMarker from "@/components/ClassificationMarker";
import { useAuth } from "@/context/AuthContext";
import { HEROES, getLocaleHeroProgress } from "@/data/heroes";
import { Sep } from "@/components/Sep";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { heroSrcSet } from "@/lib/heroImage";
import { LocalizedLink } from "@/i18n/links";

// three/@react-three/fiber (the 3D scanner) is the single heaviest import in
// the app and is only ever used here — split it into its own chunk so
// visiting any other route never pays for it, and so it doesn't block this
// page's own text/CTA paint either. Fallback mirrors HoloScanner's outer
// frame (same aspect ratio, panel classes) so there's no layout shift when
// the real chunk swaps in.
const HoloScanner = lazy(() => import("@/components/HoloScanner"));

function HoloScannerFallback({ label }) {
  return (
    <div className="relative w-full" data-loading="true">
      <div
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden panel-clip-primary border border-bronze/60 panel-scanlines"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, #0A0710 0%, #060409 70%, #030207 100%)" }}
      >
        <span className="tech-label flex items-center gap-2 text-red">
          <span className="h-1.5 w-1.5 animate-pulse-ring bg-red" /> {label}
        </span>
      </div>
    </div>
  );
}

const MODULES = [
  { to: "/simulator", code: "MOD-01", key: "training" },
  { to: "/ascendancy", code: "MOD-02", key: "classification" },
  { to: "/leaderboard", code: "MOD-03", key: "performance" },
  { to: "/profile", code: "MOD-04", key: "console" },
];

export default function Home({ seo }) {
  const { t, i18n } = useTranslation("home");
  const { user } = useAuth();
  const stats = user
    ? { bestWpm: user.bestWpm, totalTests: user.totalTests, bestAccuracy: user.bestAccuracy }
    : { bestWpm: 0, totalTests: 0, bestAccuracy: 0 };

  const faqs = t("faq.items", { returnObjects: true });

  return (
    <div>
      <SEO title={seo?.title || t("seo.title")} description={seo?.description || t("seo.description")} />

      {/* HERO SECTION — asymmetric */}
      <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-red" />
              <span className="tech-label text-gold-bright">ASCENDANCY<Sep tone="red" />{t("hero.overline")}</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative mt-6 inline-block">
              <h1 className="font-display text-5xl font-700 leading-[0.95] tracking-tight text-cream display-outline sm:text-6xl lg:text-7xl">
                {t("hero.headingLine1")}
                <br />
                {t("hero.headingLine2Prefix")}<span className="text-red">{t("hero.headingLine2Highlight")}</span>
              </h1>
              <span
                aria-hidden="true"
                className="text-sweep pointer-events-none absolute inset-0 font-display text-5xl font-700 leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
              >
                {t("hero.headingLine1")}
                <br />
                {t("hero.headingLine2Prefix")}{t("hero.headingLine2Highlight")}
              </span>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md font-body text-base text-cream/80 txt-shadow">{t("hero.subtitle")}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-4">
              <AscButton variant="red" to="/simulator" data-testid="home-begin-btn">
                {t("hero.beginSimulation")}
              </AscButton>
              <AscButton to="/ascendancy" data-testid="home-ascendancy-btn">
                {t("hero.viewAscendancy")}
              </AscButton>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <NeuralTrace intensity={1} className="mt-10 max-w-md" />
            <div className="mt-2 flex max-w-md justify-between font-mono text-[10px] text-gold-bright/90">
              <span>{t("hero.neuralLink")}<Sep tone="sage" />{t("hero.stable")}</span>
              <span>{t("hero.latency")}</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mx-auto w-full max-w-[440px] lg:mx-0 lg:ml-auto">
          <Suspense fallback={<HoloScannerFallback label={t("hero.scanLoading")} />}>
            <HoloScanner />
          </Suspense>
        </Reveal>
      </section>

      {/* PERFORMANCE DATA */}
      <section className="py-10">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <ClassificationMarker index={getLocaleHeroProgress(user, i18n.language).highestHeroIndex} size={30} active={!!user} />
            <span className="tech-label text-cream/70">
              {user ? (
                <>{t("performanceData.ascendant")}<Sep tone="gold" />{user.username}</>
              ) : (
                <>{t("performanceData.guestHeading")}<Sep tone="red" />{t("performanceData.guestSession")}</>
              )}
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <PerformanceStats {...stats} />
        </Reveal>
      </section>

      {/* MODULES */}
      <section className="py-14">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="tech-label text-gold-bright">{t("modules.heading")}</span>
              <div className="relative mt-2 block">
                <h2 className="font-display text-3xl font-700 tracking-tight text-cream">
                  {t("modules.titlePrefix")}<span className="text-red">{t("modules.titleHighlight")}</span>
                </h2>
                <span
                  aria-hidden="true"
                  className="text-sweep pointer-events-none absolute inset-0 font-display text-3xl font-700 tracking-tight"
                >
                  {t("modules.titlePrefix")}{t("modules.titleHighlight")}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m, i) => {
            const name = t(`modules.items.${m.key}.name`);
            return (
              <Reveal key={m.to} delay={i * 90}>
                <LocalizedLink
                  to={m.to}
                  data-testid={`module-${m.code}`}
                  className="brd-anim group relative block w-full overflow-hidden border border-bronze/40 bg-navy-dark p-6 text-left transition-all duration-300 hover:border-gold-bright panel-clip-primary"
                >
                  <span className="brd-top" />
                  <span className="brd-bottom" />
                  <span className="brd-left" />
                  <span className="brd-right" />
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[10px] text-red">{m.code}</span>
                    <span className="tech-label text-bronze transition-colors group-hover:text-gold-bright">{t("modules.access")}</span>
                  </div>
                  <div className="relative mt-4 inline-block">
                    <h3 className="font-display text-2xl font-700 tracking-wide text-cream transition-colors group-hover:text-gold-bright">
                      {name}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="text-sweep-red pointer-events-none absolute inset-0 font-display text-2xl font-700 tracking-wide"
                      style={{ animationDelay: `${i * 400}ms` }}
                    >
                      {name}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-sm text-cream/70 txt-shadow">{t(`modules.items.${m.key}.desc`)}</p>
                  <div className="mt-5 h-px w-full bg-bronze/30">
                    <div className="h-full w-0 bg-gold-bright transition-all duration-500 group-hover:w-full" />
                  </div>
                </LocalizedLink>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HERO STRIP */}
      <section className="py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <span className="tech-label text-gold-bright">{t("heroStrip.brand")}<Sep tone="gold" />{t("heroStrip.overline")}</span>
          </div>
          <div className="relative mb-6 mt-2 block">
            <h2 className="font-display text-3xl font-700 tracking-tight text-cream">
              {t("heroStrip.titlePrefix")}<span className="text-red">{t("heroStrip.titleHighlight")}</span>
            </h2>
            <span
              aria-hidden="true"
              className="text-sweep pointer-events-none absolute inset-0 font-display text-3xl font-700 tracking-tight"
            >
              {t("heroStrip.titlePrefix")}{t("heroStrip.titleHighlight")}
            </span>
          </div>
        </Reveal>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {HEROES.map((h, i) => {
            const alt = t("heroStrip.viewAlt", { name: h.name });
            return (
              <Reveal key={h.id} delay={i * 40}>
                <LocalizedLink
                  to="/ascendancy"
                  aria-label={alt}
                  title={alt}
                  className="group relative block h-40 w-28 shrink-0 cursor-pointer overflow-hidden border border-bronze/40 panel-clip-primary transition-all duration-300 hover:border-gold-bright hover:shadow-[0_0_20px_rgba(245,197,66,0.25)]"
                >
                  <img
                    src={h.image}
                    srcSet={heroSrcSet(h.image)}
                    sizes="112px"
                    alt={h.name}
                    loading="lazy"
                    className="h-full w-full object-cover brightness-75 transition-all duration-500 group-hover:scale-110 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark to-transparent" />
                  <div
                    className="pointer-events-none absolute left-0 top-0 h-full w-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(245,197,66,0.25),transparent)", animation: "scan-x 2.2s linear infinite" }}
                  />
                  <span className="absolute bottom-2 left-2 font-display text-xs font-700 text-cream transition-colors group-hover:text-gold-bright">
                    {h.name}
                  </span>
                </LocalizedLink>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16 py-14">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <span className="tech-label text-gold-bright">{t("faq.brand")}<Sep tone="gold" />{t("faq.overline")}</span>
          </div>
          <div className="relative mb-6 mt-2 block">
            <h2 className="font-display text-3xl font-700 tracking-tight text-cream">
              {t("faq.titlePrefix")}<span className="text-red">{t("faq.titleHighlight")}</span>
            </h2>
            <span
              aria-hidden="true"
              className="text-sweep pointer-events-none absolute inset-0 font-display text-3xl font-700 tracking-tight"
            >
              {t("faq.titlePrefix")}{t("faq.titleHighlight")}
            </span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <Accordion type="single" collapsible className="mt-10 border border-bronze/40 bg-navy-dark panel-clip-primary">
            {faqs.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className={`border-bronze/30 px-8 ${i === faqs.length - 1 ? "border-b-0" : ""}`}
              >
                <AccordionTrigger className="py-8 font-display text-base tracking-wide text-cream hover:no-underline hover:text-gold-bright">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-8 font-body text-sm leading-relaxed text-cream/70">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>
    </div>
  );
}
