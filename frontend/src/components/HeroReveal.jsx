import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AscensionRing from "@/components/AscensionRing";
import ClassificationMarker from "@/components/ClassificationMarker";
import AscButton from "@/components/AscButton";
import { useSound } from "@/context/SoundContext";
import { Sep, Mark } from "@/components/Sep";

// stage: 0 = SIMULATION COMPLETE, 1 = ANALYZING, 2 = REVEAL
export default function HeroReveal({
  hero,
  result,
  nextHero,
  ascensionProgress = 0,
  flags = {},
  onRetry,
  onViewProfile,
  onViewLeaderboard,
  onShare,
}) {
  const [stage, setStage] = useState(0);
  const sound = useSound();

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage(1);
      sound?.play("analyze");
    }, 900);
    const t2 = setTimeout(() => {
      setStage(2);
      sound?.play("reveal");
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/95 backdrop-blur-sm" data-testid="hero-reveal">
      <div className="absolute inset-0 asc-grid opacity-30" />

      <AnimatePresence mode="wait">
        {stage < 2 ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
          >
            <div className="font-display text-2xl font-700 tracking-[0.2em] text-cream sm:text-4xl">
              {stage === 0 ? "SIMULATION COMPLETE" : "ANALYZING PERFORMANCE"}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="h-8 w-1 bg-gold-bright"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
            <div className="space-y-1 font-mono text-[11px] text-sage">
              <div>{"> READING PERFORMANCE MATRIX..."}</div>
              {stage === 1 && <div>{"> CROSS-REFERENCING HERO ARCHIVE..."}</div>}
              {stage === 1 && <div className="text-gold-bright">{"> CLASSIFICATION IN PROGRESS..."}</div>}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 grid max-h-[92vh] w-full max-w-[1100px] gap-6 overflow-y-auto px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
          >
            {/* hero visual */}
            <motion.div
              initial={{ clipPath: "inset(0 100% 0 0)", filter: "grayscale(1) brightness(0.3)" }}
              animate={{ clipPath: "inset(0 0% 0 0)", filter: "grayscale(0) brightness(0.95)" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[3/4] overflow-hidden panel-clip-primary border border-gold-bright/60"
            >
              <img src={hero.image} alt={hero.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-navy-dark/40" />
              <div className="absolute left-3 top-3 tech-label text-gold-bright">HERO PROFILE IDENTIFIED</div>
              <div className="absolute bottom-3 left-3">
                <ClassificationMarker index={hero.index} active size={40} />
              </div>
              {flags.isNewClassification && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute right-3 top-3 border border-red bg-navy-dark px-2 py-1 tech-label text-red"
                >
                  NEW CLASSIFICATION
                </motion.div>
              )}
            </motion.div>

            {/* data */}
            <div className="flex flex-col justify-center">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <span className="tech-label text-gold">CLASSIFICATION COMPLETE</span>
                <h2 className="font-display text-5xl font-700 tracking-wide text-cream display-outline sm:text-6xl">
                  {hero.name}
                </h2>
                <p className="tech-label mt-1 text-gold-bright">{hero.title}<Sep tone="gold" />{hero.class}</p>
                <p className="mt-3 max-w-md font-body text-sm text-cream/70">{hero.description}</p>
                <p className="mt-2 font-mono text-xs text-sage">
                  <span className="text-gold-bright">POWER</span><Sep tone="sage" />{hero.power}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-5 grid grid-cols-2 gap-px border border-bronze/40 bg-bronze/40 sm:grid-cols-4"
              >
                {[
                  ["WPM", Math.round(result.wpm), "text-gold-bright"],
                  ["ACCURACY", `${result.accuracy.toFixed(0)}%`, "text-sage"],
                  ["CONSISTENCY", `${Math.round(result.consistency)}%`, "text-cream"],
                  ["SCORE", result.score, "text-red"],
                ].map(([k, v, c]) => (
                  <div key={k} className="bg-navy-dark px-3 py-3">
                    <div className="tech-label text-highlight">{k}</div>
                    <div className={`mt-1 font-mono text-xl font-700 ${c}`}>{v}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex items-center gap-5"
              >
                <AscensionRing
                  progress={ascensionProgress}
                  label={hero.name}
                  sublabel={nextHero ? `NEXT: ${nextHero.name}` : "MAX ASCENSION"}
                  size={150}
                />
                <div className="flex-1">
                  <div className="tech-label text-gold-bright">ASCENSION PROGRESS</div>
                  <p className="mt-2 font-body text-sm text-cream/70">
                    {nextHero
                      ? `Advance toward ${nextHero.name} — raise your speed, accuracy and consistency to ascend.`
                      : "You have reached the apex of the Ascendancy."}
                  </p>
                  {flags.isPersonalBest && <div className="mt-2 tech-label text-gold-bright"><Mark tone="gold" />NEW RECORD</div>}
                  {flags.isAscensionComplete && <div className="mt-1 tech-label text-red"><Mark tone="red" />ASCENSION COMPLETE</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <AscButton variant="red" onClick={onRetry} data-testid="reveal-retry-btn">
                  RETRY SIMULATION →
                </AscButton>
                <AscButton onClick={onViewProfile} data-testid="reveal-profile-btn">
                  VIEW HERO PROFILE
                </AscButton>
                <AscButton onClick={onViewLeaderboard} data-testid="reveal-leaderboard-btn">
                  VIEW LEADERBOARD
                </AscButton>
                <AscButton onClick={onShare} data-testid="reveal-share-btn">
                  SHARE RESULT
                </AscButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
