import React from "react";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import { LocalizedLink } from "@/i18n/links";

// Same class as any inline link inside the body prose below.
const LINK_CLASS = "text-gold-bright underline decoration-bronze/50 underline-offset-2 hover:text-gold";

const SITE_URL = "https://ascendancytyping.com";
const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
  ],
};

const SECTIONS = [
  {
    title: "Why we built this",
    body: (
      <>
        We're The Ascendancy Team — the people who design, build and write everything on this site, from the
        simulator itself to every guide in the archive. Most typing tests measure one thing and stop there: a
        number, once, with nowhere for it to go. We didn't
        think that was the interesting part. The interesting part is what happens when a measurement becomes
        something you actually want to come back and beat — a classification, a rank, a personal best worth
        chasing. Ascendancy started from that idea: keep the measurement rigorous, but give it a system built
        around it.
      </>
    ),
  },
  {
    title: "Why a HUD, not a dashboard",
    body: (
      <>
        The interface looks the way it does on purpose. A typing test could be a plain form with a timer —
        instead, Ascendancy is built to feel like you're operating a piece of equipment: a performance core
        reading your metrics live, a network tracking your classification, a console showing your progression.
        That's not decoration layered on top of the test. The tactical, instrument-panel aesthetic exists because
        measuring performance should feel like it matters, not like filling out a form.
      </>
    ),
  },
  {
    title: "Why classifications instead of just a number",
    body: (
      <>
        A raw WPM score tells you one thing and hides two others. Requiring{" "}
        <LocalizedLink to="/guides/hero-classification-system-explained" className={LINK_CLASS}>
          WPM, accuracy and consistency to clear together
        </LocalizedLink>{" "}
        for every tier was a deliberate choice — it forces the system to be honest about which of the three is
        actually your bottleneck, instead of one composite number flattering a lopsided run. Twenty fixed tiers, from
        NOVA to INFINITE, exist so that "getting better" has visible, specific steps instead of just a number
        trending upward.
      </>
    ),
  },
  {
    title: "Why the leaderboard matters as much as the test",
    body: (
      <>
        A private result is easy to ignore after the first look. A{" "}
        <LocalizedLink to="/guides/typing-test-vs-gamified-typing-test" className={LINK_CLASS}>
          gamified test with a real leaderboard
        </LocalizedLink>{" "}
        isn't — it gives practice a reason to continue that a stopwatch alone never provides. We built the
        Performance Network for the same reason ranked systems work in games: a visible, comparable number makes
        returning to practice feel worth it, not just theoretically useful.
      </>
    ),
  },
  {
    title: "What we're optimizing for",
    body: (
      <>
        Not vanity metrics, and not gamification for its own sake — the goal is genuinely getting people to type
        faster and more accurately over time, measured honestly. Everything else — the classifications, the
        archive, the network — exists to make that measurement something you'll actually return to, session after
        session, instead of running once and never coming back.
      </>
    ),
  },
];

export default function About() {
  return (
    <div className="py-14">
      <SEO
        title="About Ascendancy | Ascendancy"
        description="Why Ascendancy exists, the thinking behind its HUD aesthetic and hero progression system, and what we're actually trying to build."
        jsonLd={BREADCRUMB_LD}
      />

      <Reveal>
        <span className="tech-label text-gold-bright">ABOUT</span>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
          ABOUT ASCENDANCY
        </h1>
      </Reveal>

      <div className="mt-10 max-w-2xl space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-lg font-700 tracking-wide text-gold-bright">{s.title}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-cream/75">{s.body}</p>
          </div>
        ))}
      </div>

      <Reveal delay={80}>
        <div className="mt-12 max-w-2xl border-t border-bronze/30 pt-8">
          <h2 className="font-display text-lg font-700 tracking-wide text-gold-bright">Start where everyone else did</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-cream/75">
            Every ascendant on the network started at NOVA.{" "}
            <LocalizedLink to="/simulator" className={LINK_CLASS}>
              Run your first simulation
            </LocalizedLink>{" "}
            and find out where you actually stand.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
