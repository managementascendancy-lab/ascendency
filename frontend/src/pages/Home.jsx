import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import HoloScanner from "@/components/HoloScanner";
import PerformanceStats from "@/components/PerformanceStats";
import AscButton from "@/components/AscButton";
import NeuralTrace from "@/components/NeuralTrace";
import Reveal from "@/components/Reveal";
import HudPanel from "@/components/HudPanel";
import ClassificationMarker from "@/components/ClassificationMarker";
import { useAuth } from "@/context/AuthContext";
import { HEROES } from "@/data/heroes";
import { Sep } from "@/components/Sep";

const HERO_IMG =
  "https://images.unsplash.com/photo-1580046939256-c377c5b099f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=900";

const MODULES = [
  { to: "/simulator", code: "MOD-01", name: "TRAINING SYSTEM", desc: "Enter the simulation and measure your performance." },
  { to: "/ascendancy", code: "MOD-02", name: "CLASSIFICATION ARCHIVE", desc: "Ten heroes. One path to ascension." },
  { to: "/leaderboard", code: "MOD-03", name: "PERFORMANCE NETWORK", desc: "Compete across the global rankings." },
  { to: "/profile", code: "MOD-04", name: "ASCENDANT CONSOLE", desc: "Track your ascension and performance data." },
];

export default function Home({ seo }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stats = user
    ? { bestWpm: user.bestWpm, totalTests: user.totalTests, bestAccuracy: user.bestAccuracy }
    : { bestWpm: 0, totalTests: 0, bestAccuracy: 0 };

  return (
    <div>
      <SEO
        title={seo?.title || "Typing Speed Test & WPM Test | Ascendancy"}
        description={
          seo?.description ||
          "Measure your typing speed, accuracy and consistency. Complete simulations, unlock hero classifications and climb the Ascendancy leaderboard."
        }
      />

      {/* HERO SECTION — asymmetric */}
      <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-red" />
              <span className="tech-label text-gold-bright">ASCENDANCY<Sep tone="red" />PERFORMANCE PROTOCOL</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative mt-6 inline-block">
              <h1 className="font-display text-5xl font-700 leading-[0.95] tracking-tight text-cream display-outline sm:text-6xl lg:text-7xl">
                HOW FAST
                <br />
                CAN YOU <span className="text-red">TYPE?</span>
              </h1>
              <span
                aria-hidden="true"
                className="text-sweep pointer-events-none absolute inset-0 font-display text-5xl font-700 leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
              >
                HOW FAST
                <br />
                CAN YOU TYPE?
              </span>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md font-body text-base text-cream/80 txt-shadow">
              Your speed is only the beginning. Enter the simulation, measure your performance, and
              discover your ascension.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-4">
              <AscButton variant="red" onClick={() => navigate("/simulator")} data-testid="home-begin-btn">
                BEGIN SIMULATION →
              </AscButton>
              <AscButton onClick={() => navigate("/ascendancy")} data-testid="home-ascendancy-btn">
                VIEW ASCENDANCY
              </AscButton>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <NeuralTrace intensity={1} className="mt-10 max-w-md" />
            <div className="mt-2 flex max-w-md justify-between font-mono text-[10px] text-gold-bright/90">
              <span>NEURAL LINK<Sep tone="sage" />STABLE</span>
              <span>LATENCY 004ms</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mx-auto w-full max-w-[440px] lg:mx-0 lg:ml-auto">
          <HoloScanner />
        </Reveal>
      </section>

      {/* PERFORMANCE DATA */}
      <section className="py-10">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <ClassificationMarker index={user?.highestHeroIndex || 0} size={30} active={!!user} />
            <span className="tech-label text-cream/70">
              {user ? (
                <>ASCENDANT<Sep tone="gold" />{user.username}</>
              ) : (
                <>PERFORMANCE DATA<Sep tone="red" />GUEST SESSION</>
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
              <span className="tech-label text-gold-bright">SYSTEM MODULES</span>
              <div className="relative mt-2 block">
                <h2 className="font-display text-3xl font-700 tracking-tight text-cream">
                  ONE SYSTEM. <span className="text-red">MANY MODULES.</span>
                </h2>
                <span
                  aria-hidden="true"
                  className="text-sweep pointer-events-none absolute inset-0 font-display text-3xl font-700 tracking-tight"
                >
                  ONE SYSTEM. MANY MODULES.
                </span>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m, i) => (
            <Reveal key={m.to} delay={i * 90}>
              <button
                onClick={() => navigate(m.to)}
                data-testid={`module-${m.code}`}
                className="brd-anim group relative w-full overflow-hidden border border-bronze/40 bg-navy-dark p-6 text-left transition-all duration-300 hover:border-gold-bright panel-clip-primary"
              >
                <span className="brd-top" />
                <span className="brd-bottom" />
                <span className="brd-left" />
                <span className="brd-right" />
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] text-red">{m.code}</span>
                  <span className="tech-label text-bronze transition-colors group-hover:text-gold-bright">ACCESS →</span>
                </div>
                <div className="relative mt-4 inline-block">
                  <h3 className="font-display text-2xl font-700 tracking-wide text-cream transition-colors group-hover:text-gold-bright">
                    {m.name}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="text-sweep-red pointer-events-none absolute inset-0 font-display text-2xl font-700 tracking-wide"
                    style={{ animationDelay: `${i * 400}ms` }}
                  >
                    {m.name}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm text-cream/70 txt-shadow">{m.desc}</p>
                <div
                  className="mt-5 h-px w-full bg-bronze/30"
                >
                  <div className="h-full w-0 bg-gold-bright transition-all duration-500 group-hover:w-full" />
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HERO STRIP */}
      <section className="py-10">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-gold" />
            <span className="tech-label text-gold-bright">THE ASCENDANCY<Sep tone="gold" />HERO ARCHIVE</span>
          </div>
        </Reveal>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {HEROES.map((h, i) => (
            <Reveal key={h.id} delay={i * 40}>
              <div
                onClick={() => navigate("/ascendancy")}
                className="group relative h-40 w-28 shrink-0 cursor-pointer overflow-hidden border border-bronze/40 panel-clip-primary transition-all duration-300 hover:border-gold-bright hover:shadow-[0_0_20px_rgba(245,197,66,0.25)]"
              >
                <img
                  src={h.image}
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
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
